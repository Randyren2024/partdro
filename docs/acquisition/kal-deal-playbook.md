# Kal / KALZ Group — D15R 成交 + 分销 playbook

> 状态（2026-10-25）：已报价 D15R（2 块备用电池 + 双喷嘴 + 专业版），等加拿大执照；客户主动提出可做 service + distribution；接近成交。
> 商业：预计订单金额约 **USD 10,000**，本月内成交取决于认证；分销区域加拿大；首单 1 台；后续叙利亚 5 台（**必须先做出口管制/制裁筛查，不并入加拿大分销报价**）。
> 价格阶梯：见 `docs/acquisition/distributor-pricing-framework.md`（首单不降到底价，用培训/备件/返利换承诺；独家绑定年度采购）。
> 来源：Google CPC → `/products/d15r`（GA4 事后回溯；无 gclid）。
> 注意：本文不记录客户地址、电话等 PII；具体报价以已发出的 quotation 为准。

## 1. 客户已经暴露的四个决策点

| 决策点 | 客户原话/行为 | 我们的动作 |
|---|---|---|
| 执照/合规 | “working on licensing next week” | 提供加拿大注册/执照所需资料清单 + 机型/电池合规文件；主动问走哪条路径 |
| 运费/时效 | 问了海运与电池运输 | 明确 Incoterms（港到港 vs 门到门）、时效、电池必须分运的原因与文件 |
| 价格/配置 | 要 2 块备用电池、双喷嘴、专业版 | 报价单锁定配置与有效期；用“整机 + 备件 + 培训”打包，不裸降价 |
| 分销 | “I can do both if you have a good deal to distribute” | 单独给分销 pilot：区域、首单量、价格阶梯、培训/备件、区域保护里程碑 |

## 1.1 已知商业参数（2026-10-25）

- 首单：**1 台**，预计订单金额约 **USD 10,000**（D15R + 2 备用电池 + 双喷嘴 + 专业版）。
- 时间：**本月内**，取决于加拿大认证。
- 区域：**加拿大**；客户主动提出 service + distribution。
- 后续：**叙利亚 5 台**——单独项目，先做出口管制/制裁/最终用户筛查，确认合规前不报价、不承诺交期。
- 价格：首单维持已报价，不主动降到底价；分销价从第 2 台或 12 个月 5 台承诺开始。详见 `distributor-pricing-framework.md`。

## 2. 未来 7 天的成交动作

1. **先解决执照，而不是催单。** 问清是 Transport Canada RPAS 注册、SFOC、还是公司运营授权；按对方路径提供资料包（机型规格、电池 UN38.3/MSDS、保险、培训大纲、备件清单）。
2. **把报价变成“可签的订单”。** 明确报价 30 天有效、30% 定金锁排期、70% 发货前、海运港到港、电池分运；给一个明确的下单截止日。
3. **把分销从口头意向变成 pilot。** 首单 1 台维持 $10,000 + 培训/备件/优先支持；签 12 个月 5 台意向 → 10% off（$9,000/台）；10 台 → 15% off（$8,500/台）；独家只在达到年度最低采购后谈。
4. **叙利亚 5 台单独合规。** 不并入加拿大分销报价；先完成出口管制/制裁筛查与最终用户/用途确认，再谈项目报价。
5. **固定跟进节奏。** 每 3–4 天一次、每次带一个新价值（合规文件、物流方案、分销条款），直到拿到 PO/定金或明确丢单原因。
6. **记录结果。** Supabase 已回填：`lead_status=quoted`、`product_slug=d15r`、`utm_source=google`、`utm_medium=cpc`、`quote_value=10000 USD`、`next_follow_up_at=2026-10-28`；成交后回填 `won_at`。

## 3. 可直接改发的英文回复（WhatsApp / Email）

```text
Hi Kal,

Thanks for the update — understood on the licensing. Getting that in order before delivery is the right call.

To help you move faster, I can put together a Canada launch pack this week:
- D15R spec sheet plus the battery/transport documents (UN38.3/MSDS) you'll likely need for registration and insurance
- A short checklist of what the licensing authority typically asks for
- Confirmed sea-freight and battery-shipping options, with realistic timelines
- A distributor pilot proposal: initial volume, territory, pricing tiers, training and spare-parts support

A few questions so I can tailor it:
1. Which licensing/registration route are you going through (Transport Canada RPAS / SFOC / company operations)?
2. For distribution, what annual volume and territory would you want to cover?
3. Would a first order plus a 90-day pilot work for you?

The current quotation is valid for [X] days. If helpful, let's do a 20-minute call this week to align the licensing and distribution plan. I'll keep a production slot reserved for you.

Best,
Randy
```

## 4. 外部裁判 / 通过标准

- **成交**：收到 PO 或定金，或书面确认下单；不是“口头 soon”。
- **分销**：签 pilot 协议或书面确认首单量、区域、价格阶梯。
- **数据**：Supabase 有 `quoted/won` 状态与报价金额；Ads 侧有离线转化（gclid 或 email-based enhanced conversions）。
- **学习**：记录客户对运费/电池/执照/分销的真实异议，反哺 D15R 页面与广告文案。

## 5. 风险与护栏

- **不要承诺未确认的交期/价格/独家条款。** 所有条款以正式 quotation/合同为准。
- **电池运输**：不得把电池与整机混报；必须按危险品/航空限制分运，文件齐全。
- **分销**：先 pilot 再谈 exclusivity；区域保护与最低采购量绑定。
- **PII**：客户地址/电话只在必要渠道使用，不写入公开文档或第三方工具。
- **不要因为接近成交就放松归因**：这是第一条可验证的 D15R 路径，必须把来源、报价、成交完整记录，作为后续 CAC/LTV 的基准。
