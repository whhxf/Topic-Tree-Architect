# PSI 数据结构与提取规则参考

## 1. API 响应结构

`GET runPagespeed` 返回 JSON，分析用部分在 `lighthouseResult`：

```ts
interface LighthouseResult {
  categories: Record<string, { id: string; title: string; score: number }>;  // score 0-1
  audits: Record<string, PSIAudit>;
}
interface PSIAudit {
  id: string;
  title: string;
  description?: string;
  score?: number | null;  // 0-1, null 表示不适用
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
  details?: { items?: unknown[]; debugData?: { stacks?: Array<{ id?: string; version?: string }> } };
}
```

## 2. 常用 categories 与 audits id

| 用途 | id |
|------|-----|
| 性能 | `performance` |
| SEO | `seo` |
| 无障碍 | `accessibility` |
| 最佳实践 | `best-practices` |

| 指标 | audit id |
|------|----------|
| LCP | `largest-contentful-paint` |
| FCP | `first-contentful-paint` |
| CLS | `cumulative-layout-shift` |
| TBT | `total-blocking-time` |
| 文档标题 | `document-title` |
| Meta 描述 | `meta-description` |
| 结构化数据 | `structured-data` |
| JS 库（平台推断） | `js-libraries` |
| 网络 RTT | `network-rtt` |
| 网络请求 | `network-requests` |

## 3. Core Web Vitals 提取

对每个 id：`largest-contentful-paint`、`first-contentful-paint`、`cumulative-layout-shift`、`total-blocking-time`：

- 从 `audits[id]` 取 `numericValue`、`numericUnit`（默认 `"ms"`）、`displayValue`。
- rating：`score === 1` → good，`score === 0` → poor，否则 needs-improvement。

## 4. Top issues

筛选 `audits` 中 `score != null && score < 0.9`，按 `score` 升序，取前 N 条（如 20）。每条保留 id、title、score、displayValue 等即可。

## 5. 平台推断（来自 js-libraries）

从 `audits["js-libraries"].details.debugData.stacks` 或 `details.items` 中收集库 id（小写）。若出现 `wordpress`、`woocommerce`、`shopify`、`shoplazza`、`shopline`、`magento`、`bigcommerce`、`wix`、`squarespace` 等，可映射为对应建站平台名称。

## 6. SEO 元数据（来自 audits）

- 有标题：`document-title.score === 1`（或 true）
- 有描述：`meta-description.score === 1`
- 有结构化数据：`structured-data.details.items` 存在且长度 > 0

PSI 不返回具体 title/description 文案，仅能判断「有/无」。

## 7. 视频来源检测

从 `network-rtt.details.items[].origin` 与 `network-requests.details.items[].url` 拼接为字符串，小写后匹配关键词，例如：`youtube.com`/`youtu.be` → YouTube，`vimeo.com` → Vimeo，`kingswayvideo.com`/`polyv.net` → Kingsway/保利威。

## 8. 评分换算

API 返回的 category score 为 0–1，展示为 0–100 时：`Math.round(score * 100)`。
