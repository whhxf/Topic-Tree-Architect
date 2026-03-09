# read-psi-analysis Skill

在需要**读取并分析 Google PageSpeed Insights (PSI) 数据**时使用本 skill：调用 API、解析评分与 Core Web Vitals、取 top issues，并可把 PSI 数据交给大模型生成优化建议。**不依赖任何父项目**，复制到任意项目或 `~/.cursor/skills/` 即可使用。

## 安装到其他项目

任选其一：

1. **项目级**：将本目录 `read-psi-analysis` 复制到目标项目的 `.cursor/skills/` 下。  
   例如：`cp -r .cursor/skills/read-psi-analysis /path/to/other-project/.cursor/skills/`

2. **用户级**：复制到 `~/.cursor/skills/`，则所有项目可用。  
   例如：`cp -r .cursor/skills/read-psi-analysis ~/.cursor/skills/`

## 使用方式

在 Cursor 中直接说需求即可，例如：

- 「帮我读一下 https://example.com 的 PSI 数据」
- 「用 PageSpeed 跑一下这个站，给我 Core Web Vitals」
- 「根据 PSI 结果让大模型给优化建议」
- 「我还没有 PSI API Key，怎么申请？」

Agent 会按 SKILL.md 执行；需要跑脚本时，会使用本 skill 自带的 **scripts/**（不依赖 AI-Site-Speed-Master）。

## 环境变量与 .env 示例

脚本从**当前工作目录**读取 `.env`。本 skill 提供 **env.example**：

- 在运行脚本的目录执行：`cp env.example .env`（若 skill 在项目内：`cp .cursor/skills/read-psi-analysis/env.example .env`）
- 编辑 `.env`：填写 `GOOGLE_PSI_API_KEY`（获取见 [psi-api-key.md](psi-api-key.md)）；**国内或无法直连 Google 时务必填写 `HTTPS_PROXY`**（如 `http://127.0.0.1:7897`）
- **不要将 `.env` 提交到 Git**，请加入 `.gitignore`

变量含义见 [env.example](env.example) 内注释，详细说明见 [psi-api-key.md](psi-api-key.md) 与 [SKILL.md](SKILL.md)。

## 国内网络 / 使用代理

在无法直连 Google 的环境下，需同时满足两点脚本才能成功拉取 PSI：

1. **.env 中配置代理**：`HTTPS_PROXY=http://127.0.0.1:你的端口`
2. **安装 undici**：脚本通过 undici 走代理。本 skill 已含 **package.json**，在 skill 根目录执行 `npm install` 即可。

若出现 `fetch failed` 或「未安装 undici，使用直连」，请按 [SKILL.md 第 11 节](SKILL.md#11-国内代理环境代理与-undici-依赖走通说明) 或 [scripts/README.md 依赖与排错](scripts/README.md#依赖) 排查。

## 文件说明

| 文件 | 说明 |
|------|------|
| **SKILL.md** | 主说明与触发条件；含「国内/代理环境」走通说明（第 11 节），必读 |
| **package.json** | 脚本依赖（含 undici）；在 skill 目录 `npm install` 后即可在代理环境下使用 |
| **env.example** | .env 示例：PSI API Key、代理等变量及注释，复制为 .env 后使用 |
| **reference.md** | API 与数据结构、提取规则详解 |
| **psi-api-key.md** | Google PSI API Key 获取步骤与 .env 配置说明 |
| **prompt-optimization.md** | 根据 PSI 数据生成大模型优化建议的提示词模板（System + User） |
| **scripts/** | 独立可执行脚本：fetch-psi.mjs、extract-summary.mjs，见 [scripts/README.md](scripts/README.md) |
| **README.md** | 本安装与使用说明 |
