-- CW-15 onboarding pilot. Gated behind the supplier privacy migration in PR #70.
do $$
begin
  if to_regclass('private.product_sources') is null then
    raise exception 'Apply PR #70 private.product_sources migration before onboarding CW-15.';
  end if;
  if has_table_privilege('anon','public.suppliers','SELECT')
     or has_table_privilege('authenticated','public.suppliers','SELECT')
     or has_table_privilege('anon','public.supplier_profiles','SELECT')
     or has_table_privilege('authenticated','public.supplier_profiles','SELECT') then
    raise exception 'Supplier tables are still exposed. Complete PR #70 privacy rollout first.';
  end if;
end;
$$;

insert into public.suppliers (id,name,name_en,region,province,city,district,segment,category,category_label,note,product_models,website,contact_email,status,source_file)
values ('supplier-250','成都纵横自动化技术股份有限公司','Chengdu JOUAV Automation Tech Co., Ltd.','西部','四川','成都','高新区','工业VTOL固定翼无人机','industrial','Industrial & Enterprise','官方产品与交易所资料已核验；仅供内部来源追溯。',array['CW-15'],'https://www.jouav.com/','contact@jouav.com','verified','official_company_and_product_sources')
on conflict (id) do update set name=excluded.name,name_en=excluded.name_en,region=excluded.region,province=excluded.province,city=excluded.city,district=excluded.district,segment=excluded.segment,category=excluded.category,category_label=excluded.category_label,note=excluded.note,product_models=excluded.product_models,website=excluded.website,contact_email=excluded.contact_email,status=excluded.status,updated_at=now();

insert into public.supplier_profiles (supplier_id,slug,website,address,founded_year,verified_at,profile_data)
values ('supplier-250','chengdu-jouav-automation','https://www.jouav.com/','3A-11F, Jingrong Innovation Hub, No.200, 5th TianFu St., Hi-tech District, Chengdu City, Sichuan, China 610041',2010,date '2026-11-16',
jsonb_build_object('legalName','成都纵横自动化技术股份有限公司','legalNameEn','Chengdu JOUAV Automation Tech Co., Ltd.','brand','JOUAV','stockExchange','Shanghai Stock Exchange','stockCode','688070','foundedDate','2010-04-08','sources',jsonb_build_array('https://www.sse.com.cn/assortment/stock/list/info/company/index.shtml?COMPANY_CODE=688070&tabActive=1','https://www.jouav.com/company','https://www.jouav.com/products/cw-15.html')))
on conflict (supplier_id) do update set slug=excluded.slug,website=excluded.website,address=excluded.address,founded_year=excluded.founded_year,verified_at=excluded.verified_at,profile_data=excluded.profile_data,updated_at=now();

with p as (
 insert into public.products (slug,category,image_url,gallery,specs,features,sort_order,published)
 values ('cw-15-vtol-mapping-drone','EVTOL','/images/cw-15-technical-illustration.svg',array['/images/cw-15-technical-illustration.svg'],
 jsonb_build_object('payload','3 kg','endurance_empty','180 min','endurance_with_mg120e','120 min','cruise_speed','61 km/h','wind_resistance','10.8–13.8 m/s','practical_ceiling','6500 m','max_takeoff_altitude','4500 m','fuselage_length','2.06 m','wingspan','3.54 m','takeoff_landing','VTOL','performance_note','Manufacturer-published theoretical values under specific test conditions; actual performance varies by configuration and operating conditions.'),
 jsonb_build_array(
 jsonb_build_object('icon','plane','title','VTOL fixed-wing platform','description','Vertical take-off and landing with fixed-wing cruise efficiency.'),
 jsonb_build_object('icon','camera','title','Mission-specific payloads','description','Supports compatible mapping, LiDAR, oblique imaging and EO/IR payload options.'),
 jsonb_build_object('icon','route','title','Professional mission workflows','description','Designed for mapping, infrastructure inspection and wide-area monitoring missions.')),100,true)
 on conflict (slug) do update set category=excluded.category,image_url=excluded.image_url,gallery=excluded.gallery,specs=excluded.specs,features=excluded.features,published=excluded.published
 returning id
)
insert into public.product_langs(product_id,lang,name,description,short_desc)
select p.id,t.lang,t.name,t.description,t.short_desc from p cross join (values
('en','CW-15 VTOL Fixed-Wing UAV','A battery-powered vertical take-off and landing fixed-wing UAV platform for professional mapping, surveying, infrastructure inspection and wide-area monitoring. Published endurance is up to 180 minutes empty or 120 minutes with the MG-120E payload; actual performance depends on configuration and operating conditions.','Electric VTOL fixed-wing platform for mapping and infrastructure inspection.'),
('de','CW-15 VTOL-Festflügel-UAV','Eine batterieelektrische VTOL-Festflügel-UAV-Plattform für Kartierung, Vermessung, Infrastrukturinspektion und großflächige Überwachung. Die veröffentlichte Flugzeit beträgt bis zu 180 Minuten leer oder 120 Minuten mit MG-120E-Nutzlast; die tatsächliche Leistung hängt von Konfiguration und Einsatzbedingungen ab.','Elektrische VTOL-Festflügelplattform für Kartierung und Infrastrukturinspektion.'),
('es','UAV VTOL de ala fija CW-15','Una plataforma UAV eléctrica de ala fija con despegue y aterrizaje vertical para cartografía, topografía, inspección de infraestructuras y vigilancia de grandes áreas. La autonomía publicada es de hasta 180 minutos sin carga o 120 minutos con MG-120E; el rendimiento real depende de la configuración y las condiciones de operación.','Plataforma VTOL eléctrica de ala fija para cartografía e inspección.'),
('fr','UAV VTOL à aile fixe CW-15','Une plateforme UAV électrique à aile fixe avec décollage et atterrissage verticaux destinée à la cartographie, à la topographie, à l’inspection des infrastructures et à la surveillance de vastes zones. L’autonomie publiée atteint 180 minutes à vide ou 120 minutes avec MG-120E ; les performances réelles dépendent de la configuration et des conditions d’exploitation.','Plateforme VTOL électrique à aile fixe pour cartographie et inspection.')
) as t(lang,name,description,short_desc)
on conflict (product_id,lang) do update set name=excluded.name,description=excluded.description,short_desc=excluded.short_desc;

insert into private.product_sources(product_id,supplier_id,source_entity_name,original_model,source_kind,relationship_type,verification_status,source_url,source_label,evidence_note,extracted_facts,evidence_metadata,captured_at,verified_at)
select p.id,'supplier-250','成都纵横自动化技术股份有限公司 / Chengdu JOUAV Automation Tech Co., Ltd.','CW-15',
s.kind,'manufacturer','confirmed',s.url,s.label,s.note,s.facts,
jsonb_build_object('verification_basis','Official manufacturer product page and Shanghai Stock Exchange issuer profile','review_date','2026-11-16'),now(),now()
from public.products p
cross join (values
('official_product','https://www.jouav.com/products/cw-15.html','Official CW-15 product page','Manufacturer page lists 3 kg payload, 180 min empty endurance, 120 min with MG-120E, 61 km/h cruise and VTOL. Figures are theoretical and actual performance varies.','{"payload":"3 kg","endurance_empty":"180 min","endurance_with_mg120e":"120 min","cruise_speed":"61 km/h","takeoff_landing":"VTOL"}'::jsonb),
('official_company','https://www.jouav.com/company','Official company profile','Official company profile describes industrial UAV R&D, production, sales and services and identifies stock code 688070.','{"founded_year":2010,"stock_code":"688070"}'::jsonb),
('official_company','https://www.sse.com.cn/assortment/stock/list/info/company/index.shtml?COMPANY_CODE=688070&tabActive=1','Shanghai Stock Exchange issuer profile','Exchange issuer record confirms legal entity name, stock code 688070 and Chengdu domicile.','{"legal_name":"成都纵横自动化技术股份有限公司","legal_name_en":"Chengdu JOUAV Automation Tech Co., Ltd.","stock_code":"688070"}'::jsonb)
) as s(kind,url,label,note,facts)
where p.slug='cw-15-vtol-mapping-drone'
and not exists(select 1 from private.product_sources ps where ps.product_id=p.id and ps.source_url=s.url and ps.original_model='CW-15');
