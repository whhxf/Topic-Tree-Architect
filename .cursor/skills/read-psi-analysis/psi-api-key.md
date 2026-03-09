# Google PageSpeed Insights API Key 获取步骤

调用 PageSpeed Insights API 时建议带上 API Key，否则会受未认证配额限制。以下为获取步骤。

## 1. 打开 Google Cloud 控制台

访问：**[https://console.cloud.google.com/](https://console.cloud.google.com/)**

使用 Google 账号登录。

## 2. 创建或选择项目

- 若无项目：点击顶栏「选择项目」→「新建项目」→ 输入项目名称（如 `psi-tools`）→ 创建。
- 若已有项目：直接选择即可。

## 3. 启用 PageSpeed Insights API

1. 在左侧菜单选择 **「API 和服务」→「库」**（或搜索「API 库」）。
2. 在搜索框输入 **PageSpeed Insights**。
3. 在结果中点击 **「PageSpeed Insights API」**。
4. 点击 **「启用」**。

## 4. 创建 API 密钥

1. 左侧菜单 **「API 和服务」→「凭据」**。
2. 点击 **「+ 创建凭据」** → 选择 **「API 密钥」**。
3. 弹出框中会显示新密钥，可复制保存。
4. （推荐）点击「限制密钥」：
   - **应用限制**：选「无」或「IP 地址」等按需限制。
   - **API 限制**：选「限制密钥」→ 仅勾选 **「PageSpeed Insights API」**，保存。

## 5. 配置到环境

将密钥配置到环境变量，供本 skill 的脚本或你自己的代码使用。

**推荐：用本 skill 自带的示例文件**

1. 在本 skill 目录下找到 **env.example** 文件。
2. 复制为 **.env**（放在你要运行脚本的目录下，例如项目根目录）：  
   `cp env.example .env` 或手动复制后重命名。
3. 打开 `.env`，在 `GOOGLE_PSI_API_KEY=` 等号后填入你的 API 密钥；需要代理时填写 `HTTPS_PROXY=`。
4. 保存。**不要将 `.env` 提交到 Git**，建议在 `.gitignore` 中加入 `.env`。

**方式 B：手动创建 `.env`**

在运行脚本的目录（如项目根目录）创建 `.env`，内容示例：

```
GOOGLE_PSI_API_KEY=你的API密钥
HTTPS_PROXY=http://127.0.0.1:7890
```

各变量含义见 [env.example](env.example)。

**方式 C：终端当前会话**

```bash
export GOOGLE_PSI_API_KEY=你的API密钥
```

然后再运行 `node scripts/fetch-psi.mjs https://example.com` 等命令。

## 6. 配额说明

- 免费额度：**每天 25,000 次请求**，个人或小团队使用通常足够。
- 查看用量：控制台 → 「API 和服务」→「配额」→ 选择 PageSpeed Insights API。

## 7. 国内或无法直连 Google 时

若所在网络无法直接访问 Google：

1. 使用可访问 Google 的代理。
2. 在 `.env` 中设置代理（若用 env.example 复制来的 `.env`，在 `HTTPS_PROXY=` 后填代理地址即可），例如：

   ```
   HTTPS_PROXY=http://127.0.0.1:7890
   ```

脚本会优先读取 `HTTPS_PROXY` 或 `HTTP_PROXY`，再请求 PSI API。

---

## 8. .env 示例文件说明

本 skill 提供 **env.example**，列出 PSI 相关环境变量及简要说明。使用步骤：

1. 将 **env.example** 复制为 **.env**（放在你运行 `fetch-psi.mjs` 等脚本的目录，通常是项目根目录）。
2. 编辑 `.env`，按需填写 `GOOGLE_PSI_API_KEY`、`HTTPS_PROXY` 等，保存。
3. 确保 `.env` 已加入 `.gitignore`，不要提交到版本库。

变量含义与获取方式见上文各节；完整示例内容见 skill 根目录下的 [env.example](env.example)。
