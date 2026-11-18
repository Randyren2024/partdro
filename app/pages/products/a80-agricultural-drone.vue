<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '~/composables/useLocalePath'

const { locale } = useI18n()
const lp = useLocalePath()
const lang = computed(() => String(locale.value || 'en').toLowerCase().split('-')[0])
const messages = {
  en: {
    eyebrow:'MULTI-ROLE AGRICULTURAL UAV',
    title:'One airframe. Four jobs.',
    lead:'An 80 kg-class agricultural drone platform for spraying, granular spreading, seeding and cargo lifting — configured per season instead of per crop.',
    cta:'Scope your operation',
    overview:'Change the attachment, not the fleet.',
    intro:'The A80 is built around a single airframe with interchangeable liquid, granular and cargo interfaces. One platform covers spray programmes, fertiliser spreading, seeding and utility lifting, which simplifies training, spares and fleet planning.',
    applications:'Spray, spread, seed, lift.',
    app1:'Crop spraying',
    app2:'Granular spreading & seeding',
    app3:'Cargo lifting',
    payload:'Configured for the season.',
    payloadText:'Liquid, granular and lifting interfaces share one airframe. Radar-assisted terrain following and obstacle sensing support low-altitude work over uneven fields. Confirm nozzle set, application rate and flight planning against your agronomic requirements.',
    specs:'Key published specifications',
    labels:['Max payload','Spray tank','Spreading tank','Max flow rate','Max discharge rate','Spray width','Spreading width','Droplet size','Radar','Battery'],
    values:['80 kg','75 L','150 L','40 L/min','400 L/min','10 m','10 m','30–500 µm','LiDAR + mmWave phased-array','34,000 mAh 18S'],
    caveat:'Published theoretical figures under specific test conditions. Payload, application rate, altitude, temperature, wind and field shape affect actual coverage and flight time. Confirm the final configuration and acceptance criteria before purchase.',
    ctaTitle:'Let’s size the platform to your acreage.',
    ctaText:'Tell us the crop, field size, application rate and season window. Our team can help define the tank and spreader configuration, battery logistics and operator training plan.',
    ctaButton:'Request an A80 consultation',
    visual:'Platform profile schematic',
    visualNote:'Conceptual illustration only · approved product imagery pending',
    disclaimer:'DroneWorld product information is prepared from published technical material. Availability, configuration, approvals, training and delivery terms are confirmed individually.'
  },
  de: {
    eyebrow:'MEHRZWECK-LANDWIRTSCHAFTS-DROHNE',
    title:'Eine Zelle. Vier Aufgaben.',
    lead:'Eine landwirtschaftliche Drohnenplattform der 80-kg-Klasse für Sprühen, Granulatstreuen, Säen und Lastentransport – saisonal konfiguriert statt pro Kultur.',
    cta:'Einsatz planen',
    overview:'Anbaugerät wechseln, nicht den Fuhrpark.',
    intro:'Die A80 basiert auf einer einzigen Zelle mit austauschbaren Schnittstellen für Flüssigkeit, Granulat und Lasten. Eine Plattform deckt Sprühprogramme, Düngerstreuen, Saatgutausbringung und Transportaufgaben ab – das vereinfacht Schulung, Ersatzteile und Flottenplanung.',
    applications:'Sprühen, streuen, säen, heben.',
    app1:'Pflanzenschutz & Sprühen',
    app2:'Granulatstreuen & Säen',
    app3:'Lastentransport',
    payload:'Für die Saison konfiguriert.',
    payloadText:'Flüssig-, Granulat- und Lastschnittstellen nutzen eine Zelle. Radar gestützte Geländefolgung und Hinderniserkennung unterstützen den Tiefflug auf unebenen Flächen. Düsensatz, Ausbringmenge und Flugplanung müssen mit Ihren agronomischen Anforderungen abgeglichen werden.',
    specs:'Wichtige veröffentlichte Spezifikationen',
    labels:['Maximale Nutzlast','Sprühtank','Streutank','Max. Durchflussrate','Max. Ausbringmenge','Sprühbreite','Streubreite','Tröpfchengröße','Radar','Akku'],
    values:['80 kg','75 l','150 l','40 l/min','400 l/min','10 m','10 m','30–500 µm','LiDAR + mmWave-Phased-Array','34.000 mAh 18S'],
    caveat:'Theoretische Herstellerangaben unter bestimmten Testbedingungen. Nutzlast, Ausbringmenge, Höhe, Temperatur, Wind und Feldzuschnitt beeinflussen Flächenleistung und Flugzeit. Konfiguration und Abnahmekriterien vor dem Kauf bestätigen.',
    ctaTitle:'Lassen Sie uns die Plattform auf Ihre Fläche abstimmen.',
    ctaText:'Nennen Sie Kultur, Feldgröße, Ausbringmenge und Saisonfenster. Unser Team unterstützt bei Tank- und Streuerkonfiguration, Akku-Logistik und Schulungsplan.',
    ctaButton:'A80-Beratung anfragen',
    visual:'Schematische Plattformansicht',
    visualNote:'Konzeptillustration · finale Produktbilder vorbehaltlich Nutzungsfreigabe',
    disclaimer:'DroneWorld-Produktinformationen basieren auf veröffentlichten technischen Unterlagen. Verfügbarkeit, Konfiguration, Genehmigungen, Schulung und Lieferbedingungen werden individuell bestätigt.'
  },
  es: {
    eyebrow:'UAV AGRÍCOLA MULTIFUNCIÓN',
    title:'Una aeronave. Cuatro tareas.',
    lead:'Plataforma de dron agrícola de clase 80 kg para pulverización, esparcido de granulados, siembra y elevación de carga, configurada por temporada y no por cultivo.',
    cta:'Planifica tu operación',
    overview:'Cambia el accesorio, no la flota.',
    intro:'El A80 se articula sobre una única célula con interfaces intercambiables para líquidos, granulados y carga. Una sola plataforma cubre los programas de pulverización, el esparcido de fertilizante, la siembra y el transporte de material, lo que simplifica la formación, los repuestos y la planificación de flota.',
    applications:'Pulverizar, esparcir, sembrar, elevar.',
    app1:'Pulverización de cultivos',
    app2:'Esparcido de granulados y siembra',
    app3:'Elevación de carga',
    payload:'Configurado para cada temporada.',
    payloadText:'Las interfaces de líquido, granulado y carga comparten una sola célula. El seguimiento de terreno asistido por radar y la detección de obstáculos facilitan el vuelo a baja altura en parcelas irregulares. Confirma el juego de boquillas, la dosis y la planificación de vuelo frente a tus requisitos agronómicos.',
    specs:'Especificaciones publicadas principales',
    labels:['Carga útil máxima','Depósito de pulverización','Depósito de esparcido','Caudal máximo','Caudal de descarga máximo','Ancho de pulverización','Ancho de esparcido','Tamaño de gota','Radar','Batería'],
    values:['80 kg','75 l','150 l','40 l/min','400 l/min','10 m','10 m','30–500 µm','LiDAR + array en fase mmWave','34.000 mAh 18S'],
    caveat:'Valores teóricos publicados bajo condiciones de prueba específicas. La carga, la dosis de aplicación, la altitud, la temperatura, el viento y la forma de la parcela afectan a la cobertura y la autonomía reales. Confirma la configuración y los criterios de aceptación antes de comprar.',
    ctaTitle:'Ajustemos la plataforma a tu superficie.',
    ctaText:'Indícanos el cultivo, el tamaño de la parcela, la dosis de aplicación y la ventana de temporada. Nuestro equipo puede definir la configuración de depósito y esparcidor, la logística de baterías y el plan de formación.',
    ctaButton:'Solicitar asesoramiento sobre el A80',
    visual:'Esquema de la plataforma',
    visualNote:'Ilustración conceptual · imágenes finales pendientes de autorización',
    disclaimer:'La información de DroneWorld se prepara a partir de documentación técnica publicada. Disponibilidad, configuración, autorizaciones, formación y entrega se confirman individualmente.'
  },
  fr: {
    eyebrow:'UAV AGRICOLE POLYVALENT',
    title:'Une cellule. Quatre missions.',
    lead:'Une plateforme de drone agricole de classe 80 kg pour la pulvérisation, l’épandage de granulés, le semis et le levage de charges, configurée par saison plutôt que par culture.',
    cta:'Cadrer votre exploitation',
    overview:'Changer l’outil, pas la flotte.',
    intro:'L’A80 repose sur une cellule unique dotée d’interfaces interchangeables pour liquides, granulés et charges. Une seule plateforme couvre les programmes de pulvérisation, l’épandage d’engrais, le semis et le transport de matériel, ce qui simplifie la formation, les pièces de rechange et la gestion de flotte.',
    applications:'Pulvériser, épandre, semer, lever.',
    app1:'Pulvérisation des cultures',
    app2:'Épandage de granulés & semis',
    app3:'Levage de charges',
    payload:'Configuré pour la saison.',
    payloadText:'Les interfaces liquide, granulé et levage partagent une même cellule. Le suivi de terrain assisté par radar et la détection d’obstacles facilitent le vol à basse altitude sur des parcelles irrégulières. Validez la rampe de buses, la dose et le plan de vol au regard de vos exigences agronomiques.',
    specs:'Principales spécifications publiées',
    labels:['Charge utile maximale','Réservoir de pulvérisation','Réservoir d’épandage','Débit maximal','Débit de décharge maximal','Largeur de pulvérisation','Largeur d’épandage','Taille des gouttes','Radar','Batterie'],
    values:['80 kg','75 l','150 l','40 l/min','400 l/min','10 m','10 m','30–500 µm','LiDAR + réseau phasé mmWave','34 000 mAh 18S'],
    caveat:'Valeurs théoriques publiées dans des conditions d’essai spécifiques. Charge utile, dose appliquée, altitude, température, vent et forme de la parcelle influencent la couverture et l’autonomie réelles. Confirmez la configuration et les critères de réception avant achat.',
    ctaTitle:'Dimensionnons la plateforme à votre surface.',
    ctaText:'Indiquez-nous la culture, la taille des parcelles, la dose d’application et la fenêtre saisonnière. Notre équipe peut définir la configuration cuve et épandeur, la logistique des batteries et le plan de formation.',
    ctaButton:'Demander un conseil sur l’A80',
    visual:'Schéma de la plateforme',
    visualNote:'Illustration conceptuelle · visuels définitifs en attente d’autorisation',
    disclaimer:'Les informations DroneWorld sont préparées à partir de documentation technique publiée. Disponibilité, configuration, autorisations, formation et livraison sont confirmées individuellement.'
  }
}
const c = computed(() => messages[lang.value as keyof typeof messages] || messages.en)
const origin = 'https://www.droneworld.tech'
const path = '/products/a80-agricultural-drone'
const localizedPath = computed(() => lang.value === 'en' ? path : '/' + lang.value + path)
const pageTitle = computed(() => 'A80 Agricultural Drone | 80 kg Payload | DroneWorld')
useHead(() => ({
  title: pageTitle.value,
  htmlAttrs: { lang: lang.value },
  meta: [
    { name:'description', content:c.value.lead },
    { name:'robots', content:'noindex,follow' },
    { property:'og:type', content:'product' },
    { property:'og:site_name', content:'DroneWorld' },
    { property:'og:title', content:pageTitle.value },
    { property:'og:description', content:c.value.lead },
    { property:'og:url', content:origin + localizedPath.value },
    { name:'twitter:card', content:'summary' }
  ],
  link: [
    { rel:'canonical', href:origin + localizedPath.value },
    ...(['en','de','es','fr'].map(code => ({ rel:'alternate', hreflang:code, href:origin + (code === 'en' ? path : '/' + code + path) }))),
    { rel:'alternate', hreflang:'x-default', href:origin + path }
  ]
}))
</script>

<template>
  <main class="cw15-page">
    <section class="hero"><div class="wrap hero-grid">
      <div><NuxtLink :to="lp('/products')" class="back">← Products</NuxtLink><p class="eyebrow">{{ c.eyebrow }}</p><h1>{{ c.title }}</h1><p class="lead">{{ c.lead }}</p>
        <NuxtLink :to="{ path: lp('/contact'), query:{ product:'A80', source:'product-landing' } }" class="button">{{ c.cta }} ↗</NuxtLink>
        <div class="stats"><div><strong>80 kg</strong><span>Max payload</span></div><div><strong>75 L</strong><span>Spray tank</span></div><div><strong>150 L</strong><span>Spreading tank</span></div></div>
        <p class="note">{{ c.caveat }}</p>
      </div>
      <div class="visual"><img src="/images/a80-conceptual.svg" alt="Conceptual technical illustration of an agricultural multirole drone platform" width="1200" height="800"><span>{{ c.visual }}</span><small>{{ c.visualNote }}</small></div>
    </div></section>
    <section class="section"><div class="wrap"><p class="eyebrow">DRONEWORLD PRODUCT OVERVIEW</p><h2>{{ c.overview }}</h2><p class="intro">{{ c.intro }}</p>
      <div class="cards"><article><b>01</b><h3>Interchangeable mission interfaces</h3><p>Liquid, granular and lifting attachments share a single mounting and flight controller.</p></article><article><b>02</b><h3>Low-altitude terrain following</h3><p>Radar-assisted height control keeps the application pattern consistent over uneven ground.</p></article><article><b>03</b><h3>Battery logistics that fit the day</h3><p>Swappable high-capacity packs support consecutive work blocks without long charging stops.</p></article></div>
    </div></section>
    <section class="section soft"><div class="wrap"><p class="eyebrow">MISSION PROFILES</p><h2>{{ c.applications }}</h2><div class="cards"><article><b>⌁</b><h3>{{ c.app1 }}</h3><p>Apply crop protection products with a controlled droplet spectrum across a working width of ten metres.</p></article><article><b>⌖</b><h3>{{ c.app2 }}</h3><p>Distribute granular fertiliser or seed at a metered rate, including on fields too wet for ground equipment.</p></article><article><b>◉</b><h3>{{ c.app3 }}</h3><p>Move inputs, spare parts or harvested samples between field edges and the farm base.</p></article></div></div></section>
    <section class="section"><div class="wrap payload"><div><p class="eyebrow">CONFIGURATION</p><h2>{{ c.payload }}</h2><p class="intro">{{ c.payloadText }}</p></div><div class="tags"><span>Spray kit</span><span>Granular spreader</span><span>Seeding kit</span><span>Cargo hook</span></div></div></section>
    <section class="section soft"><div class="wrap"><p class="eyebrow">TECHNICAL OVERVIEW</p><h2>{{ c.specs }}</h2><dl class="specs"><div v-for="(label,i) in c.labels" :key="label"><dt>{{ label }}</dt><dd>{{ c.values[i] }}</dd></div></dl><p class="caveat">{{ c.caveat }}</p></div></section>
    <section class="cta"><div class="wrap cta-inner"><div><p class="eyebrow">PLAN YOUR NEXT MISSION</p><h2>{{ c.ctaTitle }}</h2><p>{{ c.ctaText }}</p></div><NuxtLink :to="{ path: lp('/contact'), query:{ product:'A80', source:'product-landing' } }" class="button light">{{ c.ctaButton }} ↗</NuxtLink></div></section>
    <div class="wrap disclaimer">{{ c.disclaimer }}</div>
  </main>
</template>

<style scoped>
.cw15-page{--ink:#f2f5f7;--muted:#a8b3bc;--line:rgba(255,255,255,.12);background:#0a1016;color:var(--ink);font-family:Barlow,Arial,sans-serif}.wrap{width:min(1180px,calc(100% - 48px));margin:auto}.hero{padding:76px 0 66px;background:radial-gradient(ellipse at 78% 25%,rgba(31,111,145,.22),transparent 38%),linear-gradient(135deg,#0a1016,#111d27 58%,#0a1016)}.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center}.back{display:inline-block;margin-bottom:34px;color:var(--muted);font-size:13px;text-decoration:none}.eyebrow{margin:0 0 16px;color:#76c5e7;font-size:12px;font-weight:750;letter-spacing:.16em;text-transform:uppercase}.hero h1{margin:0 0 22px;font-size:clamp(42px,5.3vw,70px);font-weight:760;letter-spacing:-.045em;line-height:1.02}.lead,.intro{max-width:720px;color:#c2ccd3;font-size:18px;line-height:1.7}.button{display:inline-flex;min-height:52px;align-items:center;margin:28px 0;padding:0 22px;border-radius:4px;background:#72c6e8;color:#07121a;font-size:14px;font-weight:750;text-decoration:none}.button:hover{background:#9bdbf2}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-top:24px;border-top:1px solid var(--line)}.stats div{display:flex;flex-direction:column;gap:5px}.stats strong{font-size:25px}.stats span{color:var(--muted);font-size:11px;line-height:1.4}.note,.caveat{color:#8796a0;font-size:12px;line-height:1.7}.visual{position:relative;padding:12px;border:1px solid rgba(137,202,229,.2);border-radius:8px;background:#101b24}.visual img{display:block;width:100%;height:auto}.visual>span{position:absolute;left:22px;bottom:42px;padding:8px 10px;background:rgba(5,12,18,.82);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.visual small{display:block;padding:8px 4px 0;color:#81909a;text-align:right}.section{padding:88px 0}.section h2,.cta h2{max-width:800px;margin:0 0 18px;font-size:clamp(32px,4vw,48px);font-weight:730;letter-spacing:-.035em;line-height:1.1}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:38px}.cards article{min-height:190px;padding:26px;border:1px solid var(--line);border-radius:6px;background:#111b24}.cards b{color:#72c6e8;font-size:13px}.cards h3{margin:24px 0 10px;font-size:20px}.cards p{margin:0;color:#aab7c0;font-size:14px;line-height:1.7}.soft{background:#101922}.soft .cards article{background:#0c141c}.payload{display:grid;grid-template-columns:1.2fr .8fr;gap:42px;align-items:center}.tags{display:flex;flex-wrap:wrap;gap:10px}.tags span{padding:12px 14px;border:1px solid rgba(114,198,232,.3);border-radius:3px;color:#c8e8f5;background:rgba(114,198,232,.06);font-size:13px}.specs{display:grid;grid-template-columns:repeat(2,1fr);margin:34px 0 0;border-top:1px solid var(--line);border-left:1px solid var(--line)}.specs div{display:flex;justify-content:space-between;gap:16px;padding:18px 20px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.specs dt{color:#aab7c0;font-size:14px}.specs dd{margin:0;font-weight:700;text-align:right}.cta{padding:76px 0;background:linear-gradient(110deg,#17394b,#0e2634)}.cta-inner{display:flex;align-items:center;justify-content:space-between;gap:44px}.cta-inner>div{max-width:700px}.cta-inner p:last-child{color:#c0d0d9;line-height:1.7}.button.light{flex-shrink:0;background:#e8f5fa}.disclaimer{padding:20px 0 28px;color:#788792;font-size:11px;line-height:1.6}@media(max-width:900px){.hero-grid,.payload{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.cta-inner{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.wrap{width:calc(100% - 32px)}.hero{padding:42px 0}.section{padding:64px 0}.stats{gap:9px}.stats strong{font-size:20px}.stats span{font-size:10px}.specs{grid-template-columns:1fr}.specs div{padding:15px}.hero h1{font-size:42px}}
</style>
