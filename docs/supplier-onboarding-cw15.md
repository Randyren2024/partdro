# Supplier onboarding pilot: CW-15 VTOL fixed-wing UAV

**Status:** supplier screened; landing page implemented as a preview draft; database migration prepared but gated behind PR #70.  
**Internal only:** supplier identity, legal entity details, source URLs and evidence notes must never appear in public UI, metadata, sitemap, structured data or client payloads.

## Supplier screening

Selected legal entity: 成都纵横自动化技术股份有限公司 / Chengdu JOUAV Automation Tech Co., Ltd.  
Brand/domain: JOUAV — https://www.jouav.com/  
Headquarters: Chengdu, Sichuan, China. Founded 2010-04-08. Shanghai Stock Exchange code 688070.

Evidence:
- Shanghai Stock Exchange issuer record: https://www.sse.com.cn/assortment/stock/list/info/company/index.shtml?COMPANY_CODE=688070&tabActive=1
- Official company profile: https://www.jouav.com/company
- Official CW-15 product page: https://www.jouav.com/products/cw-15.html
- Official product showcase: https://www.jouav.com/news/innoex-2025-in-hongkong.html

The exchange record independently confirms the legal entity and stock code. The official manufacturer page confirms the product identity, specifications and use cases.

## Product facts approved for first draft

CW-15 Electric VTOL Fixed-Wing UAV:
- Maximum payload: 3 kg
- Endurance: 180 minutes empty; 120 minutes with MG-120E
- Cruising speed: 61 km/h
- Wind resistance: 10.8–13.8 m/s
- Practical ceiling: 6,500 m
- Maximum take-off altitude: 4,500 m
- Fuselage length: 2.06 m; wingspan: 3.54 m
- Take-off and landing: VTOL
- Manufacturer-listed payload options: LiDAR, industrial aerial cameras, oblique camera systems, gimbal cameras and SAR.

Copy controls:
- Never present 180 minutes as loaded endurance.
- Never imply 3 kg payload and 180 minutes are simultaneous performance.
- Treat published figures as theoretical/test-condition data, not guaranteed field performance.
- Confirm exact payload compatibility, battery, software, environment and mission profile before quoting.

## DroneWorld positioning

Use cases: mapping and surveying; linear infrastructure inspection; public safety and wide-area monitoring. Public copy presents DroneWorld as the commercial interface and does not claim DroneWorld manufactures the aircraft.

## Media rights

The official product page has aircraft imagery, but no reproduction or redistribution permission has been established. This implementation does not copy or hotlink those images. The preview uses a clearly labelled conceptual schematic, not a product photograph or scale-accurate drawing.

Before indexing the page:
- obtain written permission or approved media assets;
- confirm channels, territories, duration and modification rights;
- obtain current product photos, video, brochure, payload images and configuration list;
- replace the conceptual graphic and update image alt text / Open Graph assets.

## Database and privacy workflow

The migration adds internal supplier supplier-250, an internal profile, one product with four language rows, and private evidence rows in private.product_sources. It refuses to run unless PR #70 has created private.product_sources and anon/authenticated have lost SELECT access to public.suppliers and public.supplier_profiles.

Do not run before the PR #70 privacy rollout. Do not expose supplier identity in public product APIs or frontend code.

## Landing page

Route: /products/cw-15-vtol-mapping-drone  
Locales: en, de, es, fr.  
The page is noindex,follow until approved imagery and commercial configuration are available. The contact CTA routes to DroneWorld contact with product context.

## Acceptance checklist

- [ ] PR #70 merged and migration applied.
- [ ] Supplier tables unreadable to anon/authenticated.
- [ ] Apply CW-15 migration only after the security gate passes.
- [ ] Confirm catalogue card and direct route in all four locales.
- [ ] Verify mobile layout, SSR metadata and structured data.
- [ ] Confirm no supplier identity, supplier ID, source URL or upstream domain appears in public HTML, JSON-LD, sitemap, APIs or network payloads.
- [ ] Obtain approved imagery and confirm commercial configuration.
- [ ] Replace conceptual illustration, switch robots to index,follow and add route to sitemap.
- [ ] Test contact form product context and inquiry capture.
