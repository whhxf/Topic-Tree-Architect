# 脚本说明

本目录下的脚本**完全独立**，不依赖 AI-Site-Speed-Master 或任何父项目。将整个 `read-psi-analysis` skill 目录复制到任意项目或 `~/.cursor/skills/` 后，在任意目录运行即可（会从**当前工作目录**读取 `.env`）。

## 环境变量与 .env 示例

**首次使用建议**：用本 skill 自带的 **env.example** 生成 `.env`。

1. 进入你要运行脚本的目录（如项目根目录）。
2. 复制 skill 内的示例：  
   `cp /path/to/read-psi-analysis/env.example .env`  
   （若 skill 在项目里：`cp .cursor/skills/read-psi-analysis/env.example .env`）
3. 编辑 `.env`：在 `GOOGLE_PSI_API_KEY=` 后填 API Key；需要代理时在 `HTTPS_PROXY=` 后填代理地址。
4. 将 `.env` 加入 `.gitignore`，不要提交到 Git。

**变量说明**（完整示例见 [../env.example](../env.example)）：

| 变量 | 说明 |
|------|------|
| `GOOGLE_PSI_API_KEY` | PageSpeed Insights API Key，推荐设置。获取步骤见 [../psi-api-key.md](../psi-api-key.md) |
| `HTTPS_PROXY` / `HTTP_PROXY` | 代理 URL，国内或无法直连 Google 时使用（如 `http://127.0.0.1:7890`） |

## fetch-psi.mjs

拉取指定 URL 的 PSI 数据，输出 JSON。

```bash
# 从当前目录运行（.env 在当前目录）
node /path/to/read-psi-analysis/scripts/fetch-psi.mjs https://example.com

# 仅移动端，并保存到文件
node scripts/fetch-psi.mjs https://example.com --strategy mobile --out psi-mobile.json

# 仅桌面端
node scripts/fetch-psi.mjs https://example.com --strategy desktop
```

**参数**：

- 第一个参数：待检测的 URL（必填）。
- `--strategy mobile|desktop|both`：检测端，默认 `both`（同时跑 mobile 和 desktop）。
- `--out <文件>`：将结果写入文件；不写则输出到 stdout。

**输出格式**：`{ url, fetchedAt, mobile?, desktop? }`，其中 `mobile`/`desktop` 为 `{ categories, audits }` 或出错时 `{ error }`。该 JSON 可直接作为大模型提示词中的 payload，或交给 `extract-summary.mjs` 生成摘要。

## extract-summary.mjs

从 PSI 结果 JSON 中提取可读摘要（四维评分、Core Web Vitals、Top issues），适合放入大模型 prompt 以节省 token，或供人快速查看。

```bash
# 从文件读取
node scripts/extract-summary.mjs psi-result.json

# 从 stdin 读取
cat psi-result.json | node scripts/extract-summary.mjs
```

输出为纯文本，可直接复制到 [prompt-optimization.md](../prompt-optimization.md) 中的 `{payload}` 占位符。

## 依赖

- **Node.js** 18+（使用原生 `fetch`）。
- **使用代理时（国内或受限网络）必须安装 undici**，否则脚本无法走代理，会回退直连并大概率报错（如 `fetch failed`）。
  - 本 skill 根目录已提供 **package.json**（含 undici），在 skill 根目录执行一次即可：
    ```bash
    cd /path/to/read-psi-analysis
    npm install
    ```
  - 或在运行脚本所在项目的根目录执行 `npm i undici`，保证 Node 能解析到该包。
- 若未安装 undici 且设置了 `HTTPS_PROXY`，脚本会打印：`未安装 undici 或代理无效，使用直连`，然后使用直连（国内通常失败）。

## 国内/代理环境排错

| 现象 | 原因 | 处理 |
|------|------|------|
| `未安装 undici 或代理无效，使用直连` 后 `[mobile] 失败: fetch failed` | 未安装 undici，代理未生效，直连 Google 失败 | 在 skill 目录执行 `npm install`，确保有 undici |
| 请求一直无响应或超时 | 未配置代理或代理不可用 | 在**.env** 中设置 `HTTPS_PROXY=http://127.0.0.1:你的端口`，并确保代理软件已开启 |
| 脚本读不到 .env 里的代理 | 脚本从**当前工作目录**读 .env | 从放有 `.env` 的目录运行脚本（如 `cd read-psi-analysis` 再执行），或把 .env 放到执行命令时的工作目录 |
