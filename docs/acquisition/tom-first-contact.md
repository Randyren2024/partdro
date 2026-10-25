# Tom Kruger / Hussar — C500 首封跟进

> 状态：2026-10-22 询盘，**尚未联系**；高意向重载客户。
> 原话：“We are already in heavy lift operations, licensed and authorised. We seek a new, ultra heavy lifter like the C-500. Would like to learn more about it.”
> 来源：`/products/c500-delivery-drone`（无 gclid/utm）；`lead_profile` 可信度 high。
> 注意：本文不记录客户邮箱/电话；发送前由负责人确认收件人与合规。

## 1. 目标

1. 24 小时内拿到回复；
2. 用 3–5 个问题判断是否合格（载荷、航线、地形、机队、时间表、预算）；
3. 约 20 分钟电话，发 C500 技术资料；
4. 在 Supabase 回填 `lead_status=contacted` + `first_responded_at` + `next_follow_up_at`。

## 2. 可直接改发的首封邮件

```text
Subject: C500 ultra heavy-lift — technical pack for Hussar

Hi Tom,

Thanks for reaching out, and good to hear you're already operating heavy-lift missions with the right licensing in place.

The C500 is our 240 kg-class heavy-lift platform:
- 240 kg single-aircraft payload (160 kg at 6,000 m altitude)
- up to 720 kg with four-aircraft cluster lifting
- 35 km range, 6,000 m service ceiling
- electric smart winch, 9-camera vision + LiDAR + dual mmWave radar
- IP55, -20°C to 50°C, level-6 wind resistance

To recommend the right configuration and give you a useful quote, could you share:
1. Typical payload and route (one-way distance, terrain, altitude)?
2. What you fly today, and what the C500 would replace or add?
3. Required winch/attachment type and typical sortie frequency?
4. Delivery timeline and any local certification requirements?
5. Preferred shipping destination/incoterms?

I can send the full spec sheet and arrange a 20-minute call with our heavy-lift engineer this week. If you reply with the above, I'll come back with a configuration and an indicative quote.

Best,
Randy
```

## 3. 内部动作

- **先做合规筛查**：客户是安全/防务公司，需确认最终用户/最终用途、出口管制与南非当地要求；在合规结论前不做价格/交期承诺。
- 查 `lead_profile` 里的官网/LinkedIn，确认 Tom 的角色与采购权。
- 准备 C500 datasheet、payload/altitude 表、绞盘/挂载说明、南非/非洲交付案例（如有）。
- 记录：`lead_status=contacted`、`first_responded_at=now()`、`next_follow_up_at=+2 days`；回复后按 2/5/10 天节奏跟进。
- 如果无回复：48 小时后换渠道（电话/WhatsApp/LinkedIn），不要只发邮件。

## 4. 外部裁判

- 通过：收到回复并约到电话；拿到载荷/航线/时间表；进入 `qualified`。
- 失败：10 天内无回复且多渠道触达无效 → `lost`，原因记为「无法联系」。
- 不要用「发送成功」当成功；用回复/会议/报价当裁判。
