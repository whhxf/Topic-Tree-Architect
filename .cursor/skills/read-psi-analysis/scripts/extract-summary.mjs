#!/usr/bin/env node
/**
 * 独立脚本：从 PSI 结果 JSON 中提取摘要，便于放入大模型提示词或人工阅读。
 * 输入：stdin 或文件路径（fetch-psi.mjs 的输出格式）。
 *
 * 用法:
 *   node extract-summary.mjs [psi-result.json]
 *   cat psi-result.json | node extract-summary.mjs
 *
 * 输出：纯文本摘要（四维评分、Core Web Vitals、Top issues），可直接作为 prompt 中的 {payload}。
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function readStdin() {
  return new Promise((resolveStdin) => {
    const chunks = [];
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolveStdin(chunks.join("")));
  });
}

function getLh(data, strategy) {
  if (data[strategy]?.categories) return data[strategy];
  if (data.lighthouseResult) return data.lighthouseResult;
  if (strategy === "mobile" && data.mobile) return data.mobile;
  if (strategy === "desktop" && data.desktop) return data.desktop;
  return null;
}

function scorePct(score) {
  if (score == null) return "-";
  return Math.round(Number(score) * 100);
}

function getCwv(audits) {
  const ids = [
    "largest-contentful-paint",
    "first-contentful-paint",
    "cumulative-layout-shift",
    "total-blocking-time",
  ];
  const names = { "largest-contentful-paint": "LCP", "first-contentful-paint": "FCP", "cumulative-layout-shift": "CLS", "total-blocking-time": "TBT" };
  const out = {};
  for (const id of ids) {
    const a = audits?.[id];
    out[names[id] || id] = a
      ? { value: a.numericValue, unit: a.numericUnit || "ms", display: a.displayValue || "-", score: a.score }
      : { value: "-", unit: "", display: "-", score: null };
  }
  return out;
}

function getTopIssues(audits, limit = 15) {
  if (!audits || typeof audits !== "object") return [];
  return Object.entries(audits)
    .filter(([, a]) => a && a.score != null && a.score < 0.9)
    .map(([id, a]) => ({ id, title: a.title, score: a.score, displayValue: a.displayValue }))
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, limit);
}

function formatSummary(data) {
  const lines = [];
  lines.push(`# PSI 检测摘要`);
  lines.push(`URL: ${data.url || "-"}`);
  lines.push(`获取时间: ${data.fetchedAt || "-"}`);
  lines.push("");

  for (const strategy of ["mobile", "desktop"]) {
    const lh = getLh(data, strategy);
    if (!lh) continue;
    const cat = lh.categories || {};
    lines.push(`## ${strategy === "mobile" ? "移动端" : "桌面端"}`);
    lines.push(
      `评分: 性能 ${scorePct(cat.performance?.score)} | SEO ${scorePct(cat.seo?.score)} | 无障碍 ${scorePct(cat.accessibility?.score)} | 最佳实践 ${scorePct(cat["best-practices"]?.score)}`
    );
    const cwv = getCwv(lh.audits);
    lines.push(
      `Core Web Vitals: LCP ${cwv.LCP.display} | FCP ${cwv.FCP.display} | CLS ${cwv.CLS.display} | TBT ${cwv.TBT.display}`
    );
    const top = getTopIssues(lh.audits);
    if (top.length) {
      lines.push("需改进项 (Top " + top.length + "):");
      top.forEach((t) => lines.push(`  - [${(t.score * 100).toFixed(0)}] ${t.title}: ${t.displayValue || t.id}`));
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  let raw;
  const fileArg = process.argv[2];
  if (fileArg && existsSync(resolve(process.cwd(), fileArg))) {
    raw = readFileSync(resolve(process.cwd(), fileArg), "utf-8");
  } else {
    raw = await readStdin();
  }
  if (!raw || !raw.trim()) {
    console.error("请通过 stdin 或文件路径传入 PSI 结果 JSON。示例: cat psi.json | node extract-summary.mjs");
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("JSON 解析失败:", e?.message);
    process.exit(1);
  }
  console.log(formatSummary(data));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
