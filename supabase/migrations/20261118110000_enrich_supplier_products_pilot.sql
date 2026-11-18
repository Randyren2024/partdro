-- 第三阶段试点：为 3 个供应商产品补齐已核验规格与来源证据
--
-- 试点型号：TD550（无人直升机）、A80（农业）、FP700 / 丰鹏700（农业）
-- 规格全部来自厂商官方页面，未做推测；发布状态保持 false，待图片与文案复核后再放开。

-- ---------- TD550 ----------
update public.products set
  image_url = '/images/td550-conceptual.svg',
  gallery = array['/images/td550-conceptual.svg'],
  specs = $json${
    "max_takeoff_weight": "600 kg (sea level) / 550 kg (5,000 m)",
    "max_payload": "200 kg (sea level) / 120 kg (5,000 m)",
    "max_level_speed": "180 km/h",
    "cruise_speed": "120–140 km/h",
    "operating_radius": "200 km (radio line of sight)",
    "service_ceiling": "6,500 m",
    "takeoff_landing_altitude": "5,000 m",
    "wind_resistance": "Level 6 (12 m/s); gust resistance 18 m/s",
    "powerplant": "Supercharged piston aero-engine",
    "performance_note": "Manufacturer-published figures from the official product page. Payload and altitude figures are alternative configurations, not simultaneous maxima; actual performance varies with mission profile."
  }$json$::jsonb,
  features = $json$[
    {"icon":"plane","title":"Coaxial unmanned helicopter","description":"Coaxial rotor layout with a supercharged piston engine for heavy-lift operations."},
    {"icon":"altitude","title":"High-altitude capability","description":"Take-off and landing up to 5,000 m with 120 kg payload at altitude."},
    {"icon":"shield","title":"Redundant flight control","description":"Dual-redundancy flight control, redundant navigation and emergency return-to-base functions."}
  ]$json$::jsonb
where slug = 'td550';

-- ---------- A80 ----------
update public.products set
  image_url = '/images/a80-conceptual.svg',
  gallery = array['/images/a80-conceptual.svg'],
  specs = $json${
    "max_payload": "80 kg",
    "spray_tank": "75 L",
    "spread_tank": "150 L",
    "max_flow_rate": "40 L/min",
    "max_discharge_rate": "400 L/min (medium-granule urea)",
    "spray_width": "10 m",
    "spread_width": "10 m",
    "droplet_size": "30–500 µm",
    "spray_accuracy": "Within 5%",
    "radar": "LiDAR + mmWave phased-array radar",
    "battery": "34,000 mAh 18S high-voltage smart battery",
    "performance_note": "Manufacturer-published figures from the official product page. Spraying, spreading and lifting are alternative mission configurations; endurance depends on payload and battery option."
  }$json$::jsonb,
  features = $json$[
    {"icon":"spray","title":"Spray, spread, lift","description":"One airframe with separable modules for spraying, spreading, seeding and cargo lifting."},
    {"icon":"camera","title":"Dual radar sensing","description":"360° LiDAR plus mmWave phased-array radar for terrain following and obstacle avoidance."},
    {"icon":"battery","title":"High-voltage power system","description":"34,000 mAh 18S battery with three charging options for continuous field work."}
  ]$json$::jsonb
where slug = 'a80-agricultural-drone';

-- ---------- FP700 / 丰鹏700 ----------
update public.products set
  image_url = '/images/fp700-conceptual.svg',
  gallery = array['/images/fp700-conceptual.svg'],
  specs = $json${
    "max_payload": "70 kg",
    "spray_tank": "60 L",
    "spread_tank": "80 L (optional)",
    "battery": "Dual 20,000 mAh battery system",
    "performance_note": "Manufacturer-published figures from the official TopXGun product material. Spraying and spreading are alternative configurations; actual performance varies with crop, terrain and conditions."
  }$json$::jsonb,
  features = $json$[
    {"icon":"spray","title":"Precision spraying","description":"60 L spray tank with metered flow for orchards, row crops and specialty crops."},
    {"icon":"route","title":"Flexible spreading","description":"Optional 80 L spreader for granular application across varied terrain."},
    {"icon":"battery","title":"Dual-battery system","description":"Two 20,000 mAh packs support consecutive missions with quick swaps."}
  ]$json$::jsonb
where slug = 'fp700-agricultural-drone';

-- ---------- 来源证据：官方产品页 ----------
update private.product_sources set
  source_kind = 'official_product',
  source_url = 'https://www.uatair.com/en/product/info/59.html',
  source_label = 'Official TD550 product page (UATAIR)',
  verification_status = 'confirmed',
  verified_at = now(),
  captured_at = coalesce(captured_at, now()),
  evidence_note = 'Max take-off weight 600 kg at sea level / 550 kg at 5,000 m; payload 200 kg / 120 kg; max level speed 180 km/h; cruise 120–140 km/h; operating radius 200 km; service ceiling 6,500 m; take-off/landing altitude 5,000 m.',
  extracted_facts = $json${
    "max_takeoff_weight_sea_level": "600 kg",
    "max_takeoff_weight_5000m": "550 kg",
    "max_payload_sea_level": "200 kg",
    "max_payload_5000m": "120 kg",
    "max_level_speed": "180 km/h",
    "cruise_speed": "120–140 km/h",
    "operating_radius": "200 km",
    "service_ceiling": "6500 m",
    "takeoff_landing_altitude": "5000 m"
  }$json$::jsonb,
  evidence_metadata = jsonb_build_object('verification_basis', 'Official manufacturer product page', 'review_date', '2026-11-18')
where original_model = 'TD550';

update private.product_sources set
  source_kind = 'official_product',
  source_url = 'https://www.topxgunag.com/a80-agricultural-drone',
  source_label = 'Official A80 product page (TopXGun)',
  verification_status = 'confirmed',
  verified_at = now(),
  captured_at = coalesce(captured_at, now()),
  evidence_note = '75 L spray tank, 150 L spread tank, 80 kg max payload, 40 L/min max flow rate, 30–500 µm droplets, 10 m spray and spread width, LiDAR + mmWave radar, 34,000 mAh 18S battery.',
  extracted_facts = $json${
    "max_payload": "80 kg",
    "spray_tank": "75 L",
    "spread_tank": "150 L",
    "max_flow_rate": "40 L/min",
    "spray_width": "10 m",
    "spread_width": "10 m",
    "battery": "34000 mAh 18S"
  }$json$::jsonb,
  evidence_metadata = jsonb_build_object('verification_basis', 'Official manufacturer product page', 'review_date', '2026-11-18')
where supplier_id = 'supplier-201' and original_model = 'A80';

update private.product_sources set
  source_kind = 'official_product',
  source_url = 'https://www.topxgunag.com/fp700-takes-flight-across-europe-bringing-smart-farming-solutions-to-the-field',
  source_label = 'Official FP700 product material (TopXGun)',
  verification_status = 'confirmed',
  verified_at = now(),
  captured_at = coalesce(captured_at, now()),
  evidence_note = '60 L spray tank, 70 kg max payload, 80 L spreader capacity (optional), dual 20,000 mAh battery system. Official page listing detailed specification table is not published; figures taken from the manufacturer product announcement.',
  extracted_facts = $json${
    "max_payload": "70 kg",
    "spray_tank": "60 L",
    "spread_tank": "80 L (optional)",
    "battery": "dual 20000 mAh"
  }$json$::jsonb,
  evidence_metadata = jsonb_build_object('verification_basis', 'Official manufacturer product announcement (no standalone spec table published)', 'review_date', '2026-11-18')
where supplier_id = 'supplier-201' and original_model = '丰鹏700';
