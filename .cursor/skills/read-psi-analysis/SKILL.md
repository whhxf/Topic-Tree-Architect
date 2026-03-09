---
name: read-psi-analysis
description: Fetches and analyzes Google PageSpeed Insights (PSI) data for a URL. Use when the user needs to read PSI data, run PageSpeed analysis, get Core Web Vitals (LCP/FCP/CLS/TBT), extract performance/SEO/accessibility scores, get top issues from audits, or integrate PSI into reports or tooling. Trigger terms: PSI、PageSpeed、性能检测、跑分、Core Web Vitals、LCP、FCP、CLS、TBT、runPagespeed、页面速度分析.
---

# 读取并分析 PSI 数据

当用户需要**读取或分析 Google PageSpeed Insights (PSI) 数据**时，按本 skill 执行：调用 API 获取原始数据，再按需提取评分、Core Web Vitals、top issues 等。

## 何时使用

- 用户说：要「读 PSI」「跑 PageSpeed」「做性能分析」「拿 Core Web Vitals」「根据 PSI 生成报告」等。
- 任务涉及：某 URL 的性能/SEO/无障碍/最佳实践评分、LCP/FCP/CLS/TBT、或从 audits 中取「最需改进项」。

## 1. 获取 PSI 原始数据

**API**：`GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed`

**必选参数**：
- `url`：待检测的页面 URL（需含协议，如 `https://example.com`）
- `strategy`：`mobile` 或 `desktop`

**可选**：
- `key`：Google API Key（建议设置，否则有配额限制），环境变量 `GOOGLE_PSI_API_KEY`
- 国内或受限网络：可设置 `HTTPS_PROXY` 或 `HTTP_PROXY`（本地代理常用 `http://127.0.0.1:7890`）

**请求示例**（Node/浏览器）：
```javascript
const params = new URLSearchParams({
  url: "https://example.com",
  strategy: "mobile"
});
params.append("category", "PERFORMANCE");
params.append("category", "SEO");
params.append("category", "ACCESSIBILITY");
params.append("category", "BEST_PRACTICES");
if (apiKey) params.set("key", apiKey);
const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
const data = await res.json();
const lh = data.lighthouseResult; // categories + audits
```

**注意**：PSI 接口可能较慢（数十秒到 2 分钟），建议超时设为 60–120 秒；若走代理，可适当延长（如 240 秒）。

## 2. 数据结构（用于分析）

- `lighthouseResult.categories`：各维度评分，如 `performance`、`seo`、`accessibility`、`best-practices`。每个 `score` 为 0–1，通常展示时乘以 100。
- `lighthouseResult.audits`：键为 audit id，值为 `{ id, title, description?, score, displayValue?, numericValue?, numericUnit?, details? }`。`score` 为 0–1，`null` 表示不适用。

常用 audit id：
- `largest-contentful-paint` (LCP)、`first-contentful-paint` (FCP)、`cumulative-layout-shift` (CLS)、`total-blocking-time` (TBT)
- `document-title`、`meta-description`、`structured-data`（SEO）
- `js-libraries`（可推断建站平台，见 reference）

## 3. 常用提取逻辑

**Core Web Vitals（LCP/FCP/CLS/TBT）**：从 `audits` 中取上述四个 id，读取 `numericValue`、`numericUnit`、`displayValue`，并根据 `score === 1` 判 good、`score === 0` 判 poor、否则 needs-improvement。

**四维评分（0–100）**：  
`categories.performance.score * 100`（同理 seo、accessibility、best-practices），注意 API 返回的 score 为 0–1。

**Top issues**：从 `audits` 中筛 `score != null && score < 0.9`，按 `score` 升序排序，取前 N 条（如 20）即为最需改进的审计项。

**平台/SEO/视频**：从 `audits["js-libraries"]` 的 detected 库可推断 WordPress/Shopify 等；从 `document-title`/`meta-description`/`structured-data` 可知是否有标题/描述/结构化数据；从 `network-rtt` 或 `network-requests` 的 origin/url 可检测视频来源。详见 [reference.md](reference.md)。

## 4. 在本项目中的实现位置

若当前仓库为 **AI-Site-Speed-Master**，直接复用现有模块即可：

- **调用 API**：`lib/psi.ts` → `runPageSpeedInsights(url, strategy, apiKey?)`
- **类型**：`lib/psi.ts` → `PSIResult`、`PSICategory`、`PSIAudit`
- **Core Web Vitals / Top issues**：`lib/psi.ts` → `extractCoreWebVitals(audits)`、`getTopIssues(audits, limit)`
- **平台 / SEO 元数据 / 视频**：`lib/psi-extractors.ts` → `extractPlatformFromPSI(psi)`、`extractSEOMetaFromPSI(psi)`、`extractVideoFromPSI(psi)`
- **测试接口**：`node scripts/test-psi.mjs [网址]`（会读 `.env` 中的 `GOOGLE_PSI_API_KEY`、`HTTPS_PROXY`）

在新项目中无上述文件时，按上面 1–3 的 API 与提取逻辑实现即可；可参考 [reference.md](reference.md) 中的类型与字段说明。

## 5. API Key 获取步骤与 .env 配置

**环境变量示例**：本 skill 提供 **[env.example](env.example)**，列出 PSI 所需变量。使用方式：在运行脚本的目录（如项目根）将 `env.example` 复制为 `.env`，按需填写后保存；**不要将 `.env` 提交到 Git**（加入 `.gitignore`）。

若用户尚未配置 `GOOGLE_PSI_API_KEY`，引导其按 **[psi-api-key.md](psi-api-key.md)** 操作：

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建或选择项目 → 启用「PageSpeed Insights API」
3. 凭据 → 创建 API 密钥 →（可选）限制仅调用 PageSpeed Insights API
4. 将密钥写入 `.env`：复制 [env.example](env.example) 为 `.env`，在 `GOOGLE_PSI_API_KEY=` 后填入密钥；或直接写 `GOOGLE_PSI_API_KEY=你的密钥`。

国内或无法直连 Google 时，在 `.env` 中填写 `HTTPS_PROXY=http://127.0.0.1:7890` 等。变量含义与完整说明见 [psi-api-key.md](psi-api-key.md)。

## 6. 根据 PSI 数据生成大模型优化建议

当用户需要「把 PSI 数据交给大模型得到优化建议」时：

1. 用本 skill 的 **scripts** 或 API 获取 PSI 原始/摘要数据（见下节）。
2. 打开 **[prompt-optimization.md](prompt-optimization.md)**，将其中的 **System Prompt** 与 **User Prompt** 模板复制到对话或代码中。
3. 将 User Prompt 里的 `{payload}` 替换为 PSI 完整 JSON，或 `scripts/extract-summary.mjs` 输出的摘要文本。
4. 调用大模型 API，解析返回的 JSON 即可得到结构化优化建议。

prompt-optimization.md 内提供：通用版（任意网站）、以及面向「外贸独立站小白」的扩展版（含平台感知、视频优化等）。

## 7. 独立脚本（不依赖任何父项目）

本 skill 自带可独立运行的脚本，**面向不一定知道 AI-Site-Speed-Master 的用户**：复制整个 `read-psi-analysis` 目录到任意项目或 `~/.cursor/skills/` 后即可使用。脚本从**当前工作目录**读取 `.env`。

| 脚本 | 作用 |
|------|------|
| **scripts/fetch-psi.mjs** | 拉取指定 URL 的 PSI 数据，输出 JSON（可写文件或 stdout） |
| **scripts/extract-summary.mjs** | 从 PSI JSON 提取摘要（四维评分、CWV、Top issues），适合作为大模型 payload |

**用法示例**（在任意目录，且该目录或上层有 `.env` 时）：

```bash
node /path/to/read-psi-analysis/scripts/fetch-psi.mjs https://example.com --out psi.json
cat psi.json | node /path/to/read-psi-analysis/scripts/extract-summary.mjs
```

详细参数、环境变量与依赖见 **[scripts/README.md](scripts/README.md)**。

## 8. 在 AI-Site-Speed-Master 中的实现位置

若当前仓库为 **AI-Site-Speed-Master**，可优先复用现有模块；否则用上面脚本或按 1–3 节自行实现：

- **调用 API**：`lib/psi.ts` → `runPageSpeedInsights(url, strategy, apiKey?)`
- **类型**：`lib/psi.ts` → `PSIResult`、`PSICategory`、`PSIAudit`
- **Core Web Vitals / Top issues**：`lib/psi.ts` → `extractCoreWebVitals(audits)`、`getTopIssues(audits, limit)`
- **平台 / SEO / 视频**：`lib/psi-extractors.ts` → `extractPlatformFromPSI`、`extractSEOMetaFromPSI`、`extractVideoFromPSI`
- **测试接口**：`node scripts/test-psi.mjs [网址]`（项目根目录下）

## 9. 环境变量小结与 .env 示例

脚本与 API 调用会从**当前工作目录**读取 `.env`。本 skill 提供 **env.example**：复制为 `.env` 后按需填写即可。

| 变量 | 说明 |
|------|------|
| `GOOGLE_PSI_API_KEY` | PageSpeed Insights API Key（推荐），获取见 [psi-api-key.md](psi-api-key.md) |
| `HTTPS_PROXY` / `HTTP_PROXY` | 代理 URL（国内或受限网络时使用，如 `http://127.0.0.1:7890`） |

完整示例与注释见 [env.example](env.example)；首次使用步骤见 [scripts/README.md](scripts/README.md)。

## 10. 输出建议

进行分析时，可结构化输出：
- 目标 URL、strategy（mobile/desktop）
- 四维评分（performance / seo / accessibility / best-practices）
- Core Web Vitals（LCP、FCP、CLS、TBT 及 rating）
- Top N 条需改进的 audits（id、title、score、displayValue）
- 若需要：平台推断、SEO 元数据有无、视频来源检测（见 reference）

详细 API 响应字段与提取规则见 [reference.md](reference.md)。

---

## 11. 国内/代理环境：代理与 undici 依赖（走通说明）

在**无法直连 Google** 的网络（如国内）下，必须通过代理访问 PSI API。本技能脚本在检测到 `HTTPS_PROXY`/`HTTP_PROXY` 时会使用 **undici** 的 `ProxyAgent` 走代理；若未安装 undici，会回退为直连并**大概率请求失败**（如 `fetch failed`）。

### 现象

- 控制台出现：`未安装 undici 或代理无效，使用直连`，随后 `[mobile] 失败: fetch failed`。
- 或直连时因网络不可达导致超时/失败。

### 原因

- 脚本逻辑：若设置了代理，会 `import("undici")` 并用 `ProxyAgent(proxyUrl)` 发起请求；若 undici 未安装则 catch 后回退到 `globalThis.fetch`（不走代理），在国内环境下直连 Google 会失败。

### 解决步骤（推荐）

1. **安装 undici**  
   本 skill 目录下已提供 **package.json**（含 undici 依赖），在 skill 根目录执行一次即可：
   ```bash
   cd /path/to/read-psi-analysis
   npm install
   ```
   若将 skill 复制到其他项目且该项目无 node_modules，同样在该 skill 目录下执行 `npm install`，保证脚本能解析到 undici。

2. **配置 .env 中的代理**  
   在**运行脚本时的当前工作目录**下放置 `.env`（或复制 [env.example](env.example) 为 `.env`），填写实际代理地址，例如：
   ```
   HTTPS_PROXY=http://127.0.0.1:7897
   GOOGLE_PSI_API_KEY=你的API密钥
   ```
   代理端口以本机代理软件为准（如 7890、7897 等）。

3. **从含 .env 的目录运行脚本**  
   脚本从 `process.cwd()` 读取 `.env`。推荐二选一：
   - **方式 A**：在 skill 目录下放 `.env`，然后始终在该目录执行：
     ```bash
     cd /path/to/read-psi-analysis
     node scripts/fetch-psi.mjs "https://example.com" --strategy both --out psi-result.json
     ```
   - **方式 B**：在项目根目录放 `.env`，在项目根执行并传入脚本路径：
     ```bash
     node .cursor/skills/read-psi-analysis/scripts/fetch-psi.mjs "https://example.com" --out psi.json
     ```

4. **验证**  
   若代理与 undici 均生效，会看到类似输出且无报错：
   ```
   [mobile] 请求 PSI... (超时 240s)
   [mobile] 成功
   ```

### 小结

| 项目       | 说明 |
|------------|------|
| 代理变量   | `HTTPS_PROXY` 或 `HTTP_PROXY`，如 `http://127.0.0.1:7897` |
| 代理依赖   | **必须安装 undici**，脚本才能走代理；本 skill 提供 package.json，在 skill 目录 `npm install` 即可 |
| .env 位置  | 脚本按**当前工作目录**读取 `.env`，需在运行脚本的目录或上层放置 |
| 超时       | 走代理时脚本已使用更长超时（240s），无需额外配置 |
