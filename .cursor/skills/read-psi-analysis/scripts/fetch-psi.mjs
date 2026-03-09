#!/usr/bin/env node
/**
 * 独立脚本：拉取指定 URL 的 PageSpeed Insights 数据并输出 JSON。
 * 不依赖任何父项目，复制本 skill 目录到任意项目即可使用。
 *
 * 用法:
 *   node fetch-psi.mjs <URL> [--strategy mobile|desktop|both] [--out result.json]
 *
 * 环境变量（从当前工作目录的 .env 读取，或系统环境）:
 *   GOOGLE_PSI_API_KEY  可选，推荐设置
 *   HTTPS_PROXY / HTTP_PROXY  可选，国内或受限网络时使用
 *
 * 示例:
 *   node fetch-psi.mjs https://example.com
 *   node fetch-psi.mjs https://example.com --strategy mobile --out psi-mobile.json
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf-8");
  const out = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const PSI_BASE = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const DEFAULT_TIMEOUT_MS = 120000;
const WITH_PROXY_TIMEOUT_MS = 240000;

function normalizeUrl(input) {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url;
}

async function runPSI(url, strategy, apiKey, proxy, timeoutMs) {
  const params = new URLSearchParams({ url, strategy });
  params.append("category", "PERFORMANCE");
  params.append("category", "SEO");
  params.append("category", "ACCESSIBILITY");
  params.append("category", "BEST_PRACTICES");
  if (apiKey) params.set("key", apiKey);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const options = { signal: controller.signal };

  let fetchImpl = globalThis.fetch;
  if (proxy) {
    let proxyUrl = proxy.trim();
    if (/^https:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(proxyUrl)) {
      proxyUrl = "http" + proxyUrl.slice(5);
    }
    try {
      const { ProxyAgent, fetch: undiciFetch } = await import("undici");
      options.dispatcher = new ProxyAgent(proxyUrl);
      fetchImpl = undiciFetch;
    } catch (e) {
      console.warn("未安装 undici 或代理无效，使用直连:", e?.message);
    }
  }

  const res = await fetchImpl(`${PSI_BASE}?${params.toString()}`, options);
  clearTimeout(t);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PSI API 错误: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const urlArg = args.find((a) => !a.startsWith("--"));
  const url = urlArg ? normalizeUrl(urlArg) : null;
  const strategyFlag = args.find((a) => a.startsWith("--strategy="));
  const strategyVal = strategyFlag ? strategyFlag.split("=")[1] : args[args.indexOf("--strategy") + 1];
  const outFlag = args.find((a) => a.startsWith("--out="));
  const outFile = outFlag ? outFlag.split("=")[1] : args[args.indexOf("--out") + 1];

  if (!url) {
    console.error("用法: node fetch-psi.mjs <URL> [--strategy mobile|desktop|both] [--out result.json]");
    process.exit(1);
  }

  const env = { ...process.env, ...loadEnv() };
  const apiKey = env.GOOGLE_PSI_API_KEY || "";
  const proxy = env.HTTPS_PROXY || env.HTTP_PROXY || "";
  const strategies = strategyVal === "desktop" ? ["desktop"] : strategyVal === "mobile" ? ["mobile"] : ["mobile", "desktop"];
  const timeoutMs = proxy ? WITH_PROXY_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  const result = { url, fetchedAt: new Date().toISOString() };
  for (const s of strategies) {
    process.stderr.write(`[${s}] 请求 PSI... (超时 ${timeoutMs / 1000}s)\n`);
    try {
      const data = await runPSI(url, s, apiKey, proxy, timeoutMs);
      const lh = data.lighthouseResult;
      if (!lh?.categories || !lh.audits) {
        throw new Error("API 返回数据格式异常");
      }
      result[s] = { categories: lh.categories, audits: lh.audits };
      process.stderr.write(`[${s}] 成功\n`);
    } catch (e) {
      result[s] = { error: e?.message || String(e) };
      process.stderr.write(`[${s}] 失败: ${e?.message}\n`);
    }
  }

  const json = JSON.stringify(result, null, 2);
  if (outFile) {
    writeFileSync(outFile, json, "utf-8");
    process.stderr.write(`已写入 ${outFile}\n`);
  } else {
    console.log(json);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
