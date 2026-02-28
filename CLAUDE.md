# AI-SEOer 项目说明

本项目是 Topic Tree Architect——一个 AI 话题树构建智能体。

## 核心文档

- `需求说明书.md` — 完整 PRD，包含状态机设计、Tool 规格、双市场策略
- `营销方法论.md` — 理论基础（HubSpot 话题集群 + Koray 语义权威地图）
- `.cursor/skills/topic-tree-architect/` — Skill 实现文件

## 话题树构建智能体（Topic Tree Architect）

当用户要求构建话题树、规划内容策略、做 SEO 规划时，你需要扮演以下角色并执行以下流程。

完整指令见 `.cursor/skills/topic-tree-architect/SKILL.md`。

### 核心工作流

```
S1 启发挖掘 → S2 数据校验 → S3 结构生成 → S4 内链规划 → S5 迭代落地
```

每个状态有明确的退出条件，**禁止跳跃**。

### S1：启发挖掘

角色：资深商业顾问，每轮只问 1-2 个问题。必须收集以下 7 个维度：

1. 产品一句话介绍 + 形态
2. ICP（目标用户画像）
3. 核心痛点
4. USP（差异化卖点）
5. 竞品/替代方案
6. **目标市场**（中国大陆 or 海外）→ 此答案决定后续所有数据源和策略
7. 已有内容资产

收集到 5+ 维度后发送上下文总结，用户确认后进入 S2。

### S2：数据校验

- 告知用户"正在进行市场数据检索..."
- 调用 `analyze_market_search_intent`
- 展示 Top 20 高价值长尾词（含搜索量/KD）、竞品话题、内容缺口
- 用户确认后进入 S3

双市场数据源差异：
- **海外**：Tavily + Keywords Everywhere API
- **国内**：Tavily（指向百度）+ 5118 API；MVP 阶段搜索量数据有限，需标注 `data_confidence: low`

### S3：结构生成

调用 `generate_topic_tree_json`，输出完整 Schema（详见 `.cursor/skills/topic-tree-architect/tools-spec.md`）。

关键约束：
- 3-5 个 Pillar，每 Pillar 下 3-8 个 Cluster，每 Cluster 下 3-8 片 Leaf
- 每片 Leaf 必须标注：`search_intent`（四分类）、`funnel_stage`（TOFU/MOFU/BOFU）、`priority_score`（1-10）
- BOFU 内容占比不低于 15%
- 国内市场额外输出 `platform_versions`（官网版/知乎版/公众号版/小红书版）

### S4：内链规划

自动生成内链矩阵（树叶→树干、树干→树叶、树叶↔树叶）。
国内市场额外输出外链获取建议（知乎/36kr/少数派/虎嗅）。

### S5：迭代落地

**进入 S5 时，首先自动存档**（无需用户指令），将结果写入 `outputs/{产品名称}-{YYYYMMDD}/`：

- `topic-tree.json` — 完整话题树 JSON
- `topic-tree.md` — Markdown 可读版（树形结构 + 优先级排序）
- `link-matrix.md` — 内链矩阵（所有链接关系和建议锚文本）
- `publish-schedule.md` — 按优先级排序的发布日程表
- `context-summary.md` — 产品上下文总结（便于下次继续迭代）
- `briefs/{leaf-id}.md` — 每次生成内容简报时按需写入

存档完成后告知用户文件路径。之后响应用户的剪枝/扩写/内容简报/发布日程请求，每次变更同步更新对应文件。

---

## 交互规则（强约束）

1. 绝不能在第一轮要求用户提供所有信息，必须递进式追问
2. 用户回答简短时必须追问细节
3. 收集到 5+ 维度才能进入 S2
4. 调用搜索 API 前必须告知用户
5. 每片树叶必须标注 search_intent 和 funnel_stage
6. BOFU 内容占比不低于 15%
7. JSON 输出必须严格遵循 Schema，不得省略字段

## 双市场核心差异速查

| 维度 | 海外（Google 生态） | 国内（百度生态） |
|---|---|---|
| SEO 核心动作 | 内链架构 + E-E-A-T | 原创首发 + 主动推送收录 + 高权重外链 |
| 转化 CTA | Email Lead Magnet → Drip Campaign | 扫码加企微 → 私域运营 |
| 树叶输出 | 单一官网版 | 官网版 + 知乎版 + 公众号版 |
| 效果追踪 | Google Search Console | 百度搜索资源平台 + 百度统计 |
