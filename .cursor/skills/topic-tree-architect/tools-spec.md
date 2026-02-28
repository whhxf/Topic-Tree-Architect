# Tool 定义与 JSON Schema 详细规格

## Tool 1: `analyze_market_search_intent`

**输入参数**：

```json
{
  "core_entities": ["string"],      // 产品核心词组，3-8 个，示例：["indie developer tax SaaS", "Stripe VAT"]
  "target_audience": "string",      // 目标用户画像描述
  "target_markets": ["string"],     // 目标市场代码，示例：["US", "EU"] 或 ["CN"]
  "content_language": "string"      // 内容语言，示例："en" 或 "zh-CN"
}
```

**返回数据**：

```json
{
  "high_value_keywords": [
    {
      "keyword": "string",
      "monthly_search_volume": 880,
      "keyword_difficulty": 28,        // 0-100，越低越容易排名
      "search_intent": "informational | commercial | transactional | navigational",
      "cpc": 3.2
    }
  ],
  "competitor_topics": [
    {
      "competitor_url": "string",
      "covered_topics": ["string"],
      "content_gaps": "string"         // 竞品未覆盖的内容机会
    }
  ],
  "trending_questions": ["string"],
  "lsi_keywords": ["string"]
}
```

---

## Tool 2: `generate_topic_tree_json`

**完整输出 Schema**：

```json
{
  "seed": {
    "product_name": "string",
    "core_positioning": "string",
    "target_market": "en-US | zh-CN"
  },
  "pillars": [
    {
      "id": "pillar-001",
      "pillar_title": "string",
      "pillar_description": "string",
      "content_format": "ultimate-guide",
      "estimated_word_count": 3000,
      "clusters": [
        {
          "id": "cluster-001-01",
          "cluster_title": "string",
          "cluster_description": "string",
          "leaves": [
            {
              "id": "leaf-001-01-01",
              "leaf_title": "string",
              "search_intent": "informational | commercial | transactional | navigational",
              "funnel_stage": "TOFU | MOFU | BOFU",
              "content_type": "how-to | comparison | listicle | case-study | tutorial | glossary",
              "target_keyword": "string",
              "monthly_search_volume": 880,
              "keyword_difficulty": 28,
              "priority_score": 8.5,                  // 1-10，综合评分
              "recommended_publish_order": 3,          // 建议发布顺序
              "estimated_word_count": 1500,
              "cta_strategy": {
                "cta_type": "string",                  // 见下方 CTA 类型说明
                "cta_copy": "string"
              },
              "internal_links": {
                "links_to_pillar": "pillar-001",
                "links_to_siblings": ["leaf-001-01-02"]
              },
              "platform_versions": {                   // 仅国内市场（target_market: zh-CN）输出此字段
                "official_site": { "word_count": 1500, "focus": "百度SEO，关键词自然密度" },
                "zhihu": { "word_count": 800, "format": "问答体", "focus": "末尾植入官网链接" },
                "wechat_oa": { "word_count": 1000, "format": "图文", "focus": "末尾引导加企微" },
                "xiaohongshu": { "word_count": 300, "format": "笔记+配图", "focus": "种草，引导互动" }
              }
            }
          ]
        }
      ]
    }
  ],
  "metadata": {
    "total_pillars": 3,
    "total_clusters": 12,
    "total_leaves": 48,
    "funnel_distribution": { "TOFU": 20, "MOFU": 18, "BOFU": 10 },
    "intent_distribution": {
      "informational": 22, "commercial": 14, "transactional": 8, "navigational": 4
    }
  }
}
```

### priority_score 计算逻辑（1-10 分）

| 权重 | 因子 | 说明 |
|---|---|---|
| 30% | 搜索量 | 月搜索量越高越好 |
| 25% | 关键词难度 | KD 越低越好 |
| 25% | 商业意图 | BOFU > MOFU > TOFU |
| 20% | 话题关联度 | 与产品 USP 的语义关联度 |

### search_intent 四分类

| 意图 | 定义 | 典型修饰词 | 漏斗阶段 |
|---|---|---|---|
| informational | 用户想学习了解 | 什么是、如何、为什么 | TOFU |
| commercial | 用户在比较评估 | 最好的、A vs B、评测 | MOFU |
| transactional | 用户准备行动 | 购买、注册、免费试用 | BOFU |
| navigational | 用户寻找特定品牌 | [品牌名] + 登录/官网 | BOFU |

### CTA 类型说明

| 市场 | cta_type 可选值 |
|---|---|
| 海外 | `lead-magnet`, `free-trial`, `demo-request`, `newsletter` |
| 国内 | `wechat-follow`, `enterprise-wechat`, `resource-download`, `trial` |

---

## Tool 3: `generate_content_brief`

**输入参数**：

```json
{
  "leaf_id": "leaf-001-01-01",
  "leaf_title": "string",
  "cluster_context": "string",
  "pillar_context": "string",
  "target_keyword": "string",
  "search_intent": "string",
  "content_type": "string"
}
```

**返回数据**：

```json
{
  "title_suggestions": ["标题方案A", "标题方案B"],
  "outline": {
    "h2_sections": [
      {
        "heading": "string",
        "h3_subsections": ["string"],
        "key_points": ["string"]
      }
    ]
  },
  "required_entities": ["string"],
  "lsi_keywords": ["string"],
  "recommended_word_count": 1500,
  "internal_links_to_include": [
    {
      "target_id": "pillar-001",
      "anchor_text": "string",
      "placement": "string"
    }
  ],
  "cta_placement": {
    "position": "string",
    "cta_copy": "string"
  },
  "serp_competitor_analysis": {
    "top_3_ranking_pages": [
      {
        "url": "string",
        "word_count": 2200,
        "h2_count": 8,
        "content_gaps": "string"
      }
    ]
  }
}
```

---

## Tool 4: `import_existing_sitemap`（可选，S4 阶段）

**输入参数**：

```json
{
  "sitemap_url": "https://example.com/sitemap.xml",
  "topic_tree_id": "string"
}
```

**返回数据**：

```json
{
  "mapped_pages": [
    {
      "existing_url": "string",
      "page_title": "string",
      "mapped_to_node": "leaf-001-01-01",
      "match_confidence": 0.85
    }
  ],
  "orphan_pages": ["string"],
  "missing_content": ["string"],
  "cannibalization_warnings": [
    {
      "pages": ["url-1", "url-2"],
      "competing_keyword": "string",
      "recommendation": "string"
    }
  ]
}
```
