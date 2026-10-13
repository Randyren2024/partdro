# D50R 光伏清洗无人机上架 Partdro（与 D15R 并列）

## Context
- 用户要求将 **D50R 光伏智能清洗无人机** 上架，源页面 `https://www.jsirobot.com/en/D50RChanPinJieShao`（品牌 JIUSI 九思智能 → 全部改写为 Partdro）
- 走 product-page-from-source 8 阶段流程；Phase 1-3 已完成：
  - **Phase 1 内容已抓取**：50L 水箱、全流程自动化（清洁+航线规划）、标准高压喷头、集成飞控、双RTK+前向避障雷达、多场景应用；惠州渔光互补案例（10万㎡/20MW、人工<900㎡/人/天 vs D50R 5500㎡/日、18天完工缩短60%+、发电量提升12-15%、8-10MPa 清水冲洗、0°喷头定点去顽渍、双喷杆0-45°摆动、单架次138㎡、每小时起降5次）
  - **Phase 2 决策**：slug=`d50r`，category=`cleaning`，published=true
  - **Phase 3 图片已完成**：`public/images/d50r/` 5 张可用（hero.jpg 渲染图、tank.png 50L水箱特写、gcs-ui.png 中文地面站UI、nozzle-angle.png 喷头角度图、controller.png 遥控器）；gallery-1~4/small-1~3 为源站社交图标和品牌logo，已删除
- **架构（复制 c15 模式）**：ProductDetailView 通用模板 + 静态 i18n 四语言 `d50r` 命名空间 + Supabase `landing_content` en 行只存 `__layout`/`__images` 覆盖（c15-en.json 是现成模板）

## 已知约束
- sections 组件的图片键：hero.mainImg / designed.img / intelligence.img / multiangle.img / scenarios.{0-3}.img（覆盖键必须用全键名 `d50r.xxx`，与 imgEdit 查找一致）
- applications/kit/spray 区块不启用：applications 依赖 d15r 硬编码图片集（非 d15r 显示 placeholder）、kit.img 文件名硬编码、spray 需编造喷头角度数据
- video 区块可放入布局：无 URL 时 VideoSection 对访客自动隐藏（`v-if="videoResolved || editMode"`），用户后续可在编辑器里贴 YouTube 链接
- i18n 文本禁用 vue-i18n 特殊字符 `@ { } |`
- sections 数据条数按 c15 惯例：strip 5、why 6 卡、designed 3、output 5 行+note、intelligence 4、safety 3、multiangle 4、compare 6 行、scenarios 4、specs ~14

## 剩余工作

### Phase 4: 代码生成
1. **i18n 四语言**（en/es/de/fr.json 文件末尾各追加 `d50r` 树，与 fp800 的插入方式相同）：
   - 13 个区块：hero / strip / why / designed / output / intelligence / safety / multiangle / compare / scenarios / video / specs / cta
   - hero: kicker `Partdro Solar Cleaning Drone Series D50R`、title1 `Photovoltaic Intelligent Cleaning,`、title2 `Built for solar plants.`、stats（50L 水箱 / 双RTK / 5500㎡每日）
   - 数值仅用已证实数据（50L、8-10MPa、0-45°、双RTK、138㎡/架次、5500㎡/日、18天、12-15%），不编造
   - es/de/fr 为 en 树的对应翻译（参照 c15-i18n.mjs 的翻译质量）
2. **`src/composables/useLandingContent.ts`**：`EDITABLE_NAMESPACES` 数组加 `'d50r'`（使 loadAndMerge 拉取其 landing_content 行、管理编辑器可用）
3. **新建 `scripts/d50r-content.mjs`**（参照 c500-content.mjs 的插入逻辑 + c15-en.json 的媒体行结构）：
   - `products` 插入 `{ slug:'d50r', category:'cleaning', sort_order: D15R行的sort_order+1（被占用则用max+1，先查 D15R 行确认 category）, published:true, image_url:'/images/d50r/hero.jpg' }`
   - `product_langs` 四语言 upsert（en: `Partdro D50R Solar Cleaning Drone` + short_desc）
   - `landing_content` en 行 upsert：`__layout`（13 区块顺序）+ `__images`（`d50r.hero.mainImg`→`hero.jpg`、`d50r.designed.img`→`tank.png`、`d50r.intelligence.img`→`gcs-ui.png`、`d50r.multiangle.img`→`nozzle-angle.png`）——**scenarios.0-3.img 暂不设置**（回退 placeholder.svg，Phase 8 补）
   - 使用 `.env` 的 `SUPABASE_SERVICE_ROLE_KEY`（仅本地 Node，同 c500/c15 脚本）

### Phase 5: 构建
- `npm run build`（即类型检查），失败则修

### Phase 6-7: 截图 + 审计
- 新建 `scripts/screenshot-d50r.mjs`（复制 screenshot-c15.mjs 改 URL 为 `/products/d50r`）
- 对当前 dev server（5173）截图 hero/full/逐区块，Read 逐区块审计（hero 文案、图片匹配、specs 数值、CTA 等）
- 预期已知现象：scenarios 4 卡显示 placeholder、video 区块对访客不可见

### Phase 8: 修复 + 图片本地化（最后执行）
- 先修审计发现的代码/数据问题 → 重新截图
- 执行 pending image-mod list：
  1. `gcs-ui.png` → nano-banana 英文化地面站 UI（失败回退 bailian qwen-image），每次生成后 Read 验证拼写/样式
  2. 生成 4 张光伏清洗场景图（大型地面电站 / 工商业屋顶 / 渔光互补 / 住宅屋顶，photorealistic drone-cleaning-PV），存入 `public/images/d50r/scenario-*.png` 并 upsert `d50r.scenarios.{0-3}.img` 到 en 行 `__images`
- 重新截图确认

### 收尾
- `/products?category=cleaning` 列表页截图确认 D50R 与 D15R 并列展示

## 验证
1. `npm run build` 通过
2. `/products/d50r` 全区块截图逐张审计通过（无占位符/破图/未证实数值）
3. `/products?category=cleaning` 列表显示 D15R + D50R
4. 图片：gcs-ui 英文化完成；4 张场景图生成且与卡题匹配
