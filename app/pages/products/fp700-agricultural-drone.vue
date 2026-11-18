<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '~/composables/useLocalePath'

const { locale } = useI18n()
const lp = useLocalePath()
const lang = computed(() => String(locale.value || 'en').toLowerCase().split('-')[0])
const messages = {
  en: {
    eyebrow:'PRECISION AGRICULTURAL UAV',
    title:'Built for orchards. Tuned for rows.',
    lead:'A 70 kg-class agricultural drone platform for precision spraying and spreading in orchards, vineyards, row crops and specialty crops.',
    cta:'Discuss your blocks',
    overview:'Precision where the canopy is dense.',
    intro:'The FP700 is specified for growers who need controlled, repeatable application inside dense canopies and narrow rows. Dual batteries and a compact 70 kg airframe keep turnarounds short without sacrificing dose accuracy.',
    applications:'Three crop patterns. One platform.',
    app1:'Orchard & vineyard spraying',
    app2:'Row-crop protection',
    app3:'Granular fertiliser spreading',
    payload:'Application control over raw capacity.',
    payloadText:'Precision spraying is decided by droplet spectrum and coverage inside the canopy, not by tank size alone. The FP700 pairs a 60 L spray circuit with an optional 80 L spreader, so one airframe serves both liquid and granular programmes.',
    specs:'Key published specifications',
    labels:['Max payload','Spray tank','Spreading tank','Battery'],
    values:['70 kg','60 L','80 L (optional)','Dual 20,000 mAh'],
    caveat:'Published theoretical figures under specific test conditions. Payload, configuration, canopy structure, temperature, wind and mission profile affect actual performance. Confirm the final configuration and acceptance criteria before purchase.',
    ctaTitle:'Let’s tune the platform to your blocks.',
    ctaText:'Tell us the crop structure, row spacing, canopy density and application window. Our team can help define nozzle, rate and flight parameters, plus the operator training plan.',
    ctaButton:'Request an FP700 consultation',
    visual:'Platform profile schematic',
    visualNote:'Conceptual illustration only · approved product imagery pending',
    disclaimer:'DroneWorld product information is prepared from published technical material. Availability, configuration, approvals, training and delivery terms are confirmed individually.'
  },
  de: {
    eyebrow:'PRÄZISIONS-LANDWIRTSCHAFTS-DROHNE',
    title:'Für Obstgärten gebaut. Für Reihen abgestimmt.',
    lead:'Eine landwirtschaftliche Drohnenplattform der 70-kg-Klasse für präzises Sprühen und Streuen in Obst- und Weinbau, Reihenkulturen und Sonderkulturen.',
    cta:'Einsatz besprechen',
    overview:'Präzision bei dichter Krone.',
    intro:'Die FP700 ist für Betriebe ausgelegt, die eine kontrollierte, reproduzierbare Ausbringung in dichten Kronen und engen Reihen benötigen. Zwei Akkus und eine kompakte 70-kg-Zelle halten die Umlaufzeiten kurz, ohne die Dosiergenauigkeit zu beeinträchtigen.',
    applications:'Drei Kulturformen. Eine Plattform.',
    app1:'Sprühen in Obst- und Weinbau',
    app2:'Pflanzenschutz in Reihenkulturen',
    app3:'Granulatdüngung',
    payload:'Anwendungsqualität statt reiner Kapazität.',
    payloadText:'Präzises Sprühen entscheidet sich über Tropfenspektrum und Benetzung in der Krone, nicht nur über die Tankgröße. Die FP700 kombiniert einen 60-l-Sprühkreis mit einem optionalen 80-l-Streuer, sodass eine Zelle sowohl flüssige als auch granulare Programme abdeckt.',
    specs:'Wichtige veröffentlichte Spezifikationen',
    labels:['Maximale Nutzlast','Sprühtank','Streutank','Akku'],
    values:['70 kg','60 l','80 l (optional)','Zwei 20.000 mAh'],
    caveat:'Theoretische Herstellerangaben unter bestimmten Testbedingungen. Nutzlast, Konfiguration, Kronenstruktur, Temperatur, Wind und Missionsprofil beeinflussen die tatsächliche Leistung. Konfiguration und Abnahmekriterien vor dem Kauf bestätigen.',
    ctaTitle:'Stimmen wir die Plattform auf Ihre Flächen ab.',
    ctaText:'Nennen Sie Kulturstruktur, Reihenabstand, Kronendichte und Ausbringungsfenster. Unser Team unterstützt bei Düse, Ausbringmenge, Flugparametern und Schulungsplan.',
    ctaButton:'FP700-Beratung anfragen',
    visual:'Schematische Plattformansicht',
    visualNote:'Konzeptillustration · finale Produktbilder vorbehaltlich Nutzungsfreigabe',
    disclaimer:'DroneWorld-Produktinformationen basieren auf veröffentlichten technischen Unterlagen. Verfügbarkeit, Konfiguration, Genehmigungen, Schulung und Lieferbedingungen werden individuell bestätigt.'
  },
  es: {
    eyebrow:'UAV AGRÍCOLA DE PRECISIÓN',
    title:'Hecho para huertos. Ajustado para hileras.',
    lead:'Plataforma de dron agrícola de clase 70 kg para pulverización y esparcido de precisión en frutales, viñedos, cultivos en hileras y cultivos especiales.',
    cta:'Habla de tus parcelas',
    overview:'Precisión donde la copa es densa.',
    intro:'El FP700 está pensado para productores que necesitan una aplicación controlada y repetible dentro de copas densas y calles estrechas. Las baterías dobles y una célula compacta de 70 kg acortan los tiempos de recambio sin sacrificar precisión de dosis.',
    applications:'Tres patrones de cultivo. Una plataforma.',
    app1:'Pulverización en frutales y viñedos',
    app2:'Protección de cultivos en hileras',
    app3:'Esparcido de fertilizante granulado',
    payload:'Control de aplicación antes que capacidad bruta.',
    payloadText:'La pulverización de precisión depende del espectro de gota y de la cobertura dentro de la copa, no solo del tamaño del depósito. El FP700 combina un circuito de pulverización de 60 l con un esparcidor opcional de 80 l, de modo que una misma célula cubre programas líquidos y granulados.',
    specs:'Especificaciones publicadas principales',
    labels:['Carga útil máxima','Depósito de pulverización','Depósito de esparcido','Batería'],
    values:['70 kg','60 l','80 l (opcional)','Doble 20.000 mAh'],
    caveat:'Valores teóricos publicados bajo condiciones de prueba específicas. La carga, la configuración, la estructura de la copa, la temperatura, el viento y el perfil de misión afectan al rendimiento real. Confirma la configuración y los criterios de aceptación antes de comprar.',
    ctaTitle:'Ajustemos la plataforma a tus parcelas.',
    ctaText:'Cuéntanos la estructura del cultivo, el espaciado entre hileras, la densidad de copa y la ventana de aplicación. Nuestro equipo puede definir boquilla, dosis y parámetros de vuelo, además del plan de formación.',
    ctaButton:'Solicitar asesoramiento sobre el FP700',
    visual:'Esquema de la plataforma',
    visualNote:'Ilustración conceptual · imágenes finales pendientes de autorización',
    disclaimer:'La información de DroneWorld se prepara a partir de documentación técnica publicada. Disponibilidad, configuración, autorizaciones, formación y entrega se confirman individualmente.'
  },
  fr: {
    eyebrow:'UAV AGRICOLE DE PRÉCISION',
    title:'Conçu pour les vergers. Réglé pour les rangs.',
    lead:'Une plateforme de drone agricole de classe 70 kg pour la pulvérisation et l’épandage de précision en vergers, vignobles, cultures en rangs et cultures spéciales.',
    cta:'Parler de vos parcelles',
    overview:'La précision là où le couvert est dense.',
    intro:'Le FP700 s’adresse aux exploitations qui recherchent une application contrôlée et répétable au cœur de couverts denses et de rangs étroits. La double batterie et une cellule compacte de 70 kg réduisent les temps de rotation sans compromettre la précision de dose.',
    applications:'Trois schémas de culture. Une plateforme.',
    app1:'Pulvérisation vergers & vignes',
    app2:'Protection des cultures en rangs',
    app3:'Épandage d’engrais granulés',
    payload:'La maîtrise de l’application avant la capacité brute.',
    payloadText:'La pulvérisation de précision se joue sur le spectre de gouttes et la couverture à l’intérieur du feuillage, pas seulement sur le volume de cuve. Le FP700 associe un circuit de pulvérisation de 60 l à un épandeur optionnel de 80 l : une même cellule couvre les programmes liquides et granulaires.',
    specs:'Principales spécifications publiées',
    labels:['Charge utile maximale','Réservoir de pulvérisation','Réservoir d’épandage','Batterie'],
    values:['70 kg','60 l','80 l (en option)','Double 20 000 mAh'],
    caveat:'Valeurs théoriques publiées dans des conditions d’essai spécifiques. Charge utile, configuration, structure du feuillage, température, vent et profil de mission influencent les performances réelles. Confirmez la configuration et les critères de réception avant achat.',
    ctaTitle:'Réglons la plateforme sur vos parcelles.',
    ctaText:'Décrivez la structure de la culture, l’interligne, la densité du feuillage et la fenêtre d’application. Notre équipe peut définir buses, dose et paramètres de vol, ainsi que le plan de formation des opérateurs.',
    ctaButton:'Demander un conseil sur le FP700',
    visual:'Schéma de la plateforme',
    visualNote:'Illustration conceptuelle · visuels définitifs en attente d’autorisation',
    disclaimer:'Les informations DroneWorld sont préparées à partir de documentation technique publiée. Disponibilité, configuration, autorisations, formation et livraison sont confirmées individuellement.'
  }
}
const c = computed(() => messages[lang.value as keyof typeof messages] || messages.en)
const origin = 'https://www.droneworld.tech'
const path = '/products/fp700-agricultural-drone'
const localizedPath = computed(() => lang.value === 'en' ? path : '/' + lang.value + path)
const pageTitle = computed(() => 'FP700 Agricultural Drone | 70 kg Payload | DroneWorld')
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
        <NuxtLink :to="{ path: lp('/contact'), query:{ product:'FP700', source:'product-landing' } }" class="button">{{ c.cta }} ↗</NuxtLink>
        <div class="stats"><div><strong>70 kg</strong><span>Max payload</span></div><div><strong>60 L</strong><span>Spray tank</span></div><div><strong>80 L</strong><span>Spreading tank (optional)</span></div></div>
        <p class="note">{{ c.caveat }}</p>
      </div>
      <div class="visual"><img src="/images/fp700-conceptual.svg" alt="Conceptual technical illustration of a precision agricultural drone platform" width="1200" height="800"><span>{{ c.visual }}</span><small>{{ c.visualNote }}</small></div>
    </div></section>
    <section class="section"><div class="wrap"><p class="eyebrow">DRONEWORLD PRODUCT OVERVIEW</p><h2>{{ c.overview }}</h2><p class="intro">{{ c.intro }}</p>
      <div class="cards"><article><b>01</b><h3>Canopy-focused application</h3><p>Airflow and droplet settings are tuned for penetration rather than flat-field coverage.</p></article><article><b>02</b><h3>Compact 70 kg airframe</h3><p>A smaller footprint suits terraces, narrow rows and tight headlands.</p></article><article><b>03</b><h3>Liquid or granular in one platform</h3><p>Switch between a 60 L spray circuit and an optional 80 L spreader without changing airframe.</p></article></div>
    </div></section>
    <section class="section soft"><div class="wrap"><p class="eyebrow">MISSION PROFILES</p><h2>{{ c.applications }}</h2><div class="cards"><article><b>⌁</b><h3>{{ c.app1 }}</h3><p>Place product inside dense canopies and along trellised rows where ground sprayers struggle to reach.</p></article><article><b>⌖</b><h3>{{ c.app2 }}</h3><p>Maintain coverage on narrow row spacings and short application windows after rain or at growth stages.</p></article><article><b>◉</b><h3>{{ c.app3 }}</h3><p>Apply granular fertiliser at a metered rate to orchard rows, terraces and smaller blocks.</p></article></div></div></section>
    <section class="section"><div class="wrap payload"><div><p class="eyebrow">CONFIGURATION</p><h2>{{ c.payload }}</h2><p class="intro">{{ c.payloadText }}</p></div><div class="tags"><span>Orchard spray kit</span><span>Row-crop nozzles</span><span>80 L spreader</span><span>Dual battery set</span></div></div></section>
    <section class="section soft"><div class="wrap"><p class="eyebrow">TECHNICAL OVERVIEW</p><h2>{{ c.specs }}</h2><dl class="specs"><div v-for="(label,i) in c.labels" :key="label"><dt>{{ label }}</dt><dd>{{ c.values[i] }}</dd></div></dl><p class="caveat">{{ c.caveat }}</p></div></section>
    <section class="cta"><div class="wrap cta-inner"><div><p class="eyebrow">PLAN YOUR NEXT MISSION</p><h2>{{ c.ctaTitle }}</h2><p>{{ c.ctaText }}</p></div><NuxtLink :to="{ path: lp('/contact'), query:{ product:'FP700', source:'product-landing' } }" class="button light">{{ c.ctaButton }} ↗</NuxtLink></div></section>
    <div class="wrap disclaimer">{{ c.disclaimer }}</div>
  </main>
</template>

<style scoped>
.cw15-page{--ink:#f2f5f7;--muted:#a8b3bc;--line:rgba(255,255,255,.12);background:#0a1016;color:var(--ink);font-family:Barlow,Arial,sans-serif}.wrap{width:min(1180px,calc(100% - 48px));margin:auto}.hero{padding:76px 0 66px;background:radial-gradient(ellipse at 78% 25%,rgba(31,111,145,.22),transparent 38%),linear-gradient(135deg,#0a1016,#111d27 58%,#0a1016)}.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center}.back{display:inline-block;margin-bottom:34px;color:var(--muted);font-size:13px;text-decoration:none}.eyebrow{margin:0 0 16px;color:#76c5e7;font-size:12px;font-weight:750;letter-spacing:.16em;text-transform:uppercase}.hero h1{margin:0 0 22px;font-size:clamp(42px,5.3vw,70px);font-weight:760;letter-spacing:-.045em;line-height:1.02}.lead,.intro{max-width:720px;color:#c2ccd3;font-size:18px;line-height:1.7}.button{display:inline-flex;min-height:52px;align-items:center;margin:28px 0;padding:0 22px;border-radius:4px;background:#72c6e8;color:#07121a;font-size:14px;font-weight:750;text-decoration:none}.button:hover{background:#9bdbf2}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-top:24px;border-top:1px solid var(--line)}.stats div{display:flex;flex-direction:column;gap:5px}.stats strong{font-size:25px}.stats span{color:var(--muted);font-size:11px;line-height:1.4}.note,.caveat{color:#8796a0;font-size:12px;line-height:1.7}.visual{position:relative;padding:12px;border:1px solid rgba(137,202,229,.2);border-radius:8px;background:#101b24}.visual img{display:block;width:100%;height:auto}.visual>span{position:absolute;left:22px;bottom:42px;padding:8px 10px;background:rgba(5,12,18,.82);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.visual small{display:block;padding:8px 4px 0;color:#81909a;text-align:right}.section{padding:88px 0}.section h2,.cta h2{max-width:800px;margin:0 0 18px;font-size:clamp(32px,4vw,48px);font-weight:730;letter-spacing:-.035em;line-height:1.1}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:38px}.cards article{min-height:190px;padding:26px;border:1px solid var(--line);border-radius:6px;background:#111b24}.cards b{color:#72c6e8;font-size:13px}.cards h3{margin:24px 0 10px;font-size:20px}.cards p{margin:0;color:#aab7c0;font-size:14px;line-height:1.7}.soft{background:#101922}.soft .cards article{background:#0c141c}.payload{display:grid;grid-template-columns:1.2fr .8fr;gap:42px;align-items:center}.tags{display:flex;flex-wrap:wrap;gap:10px}.tags span{padding:12px 14px;border:1px solid rgba(114,198,232,.3);border-radius:3px;color:#c8e8f5;background:rgba(114,198,232,.06);font-size:13px}.specs{display:grid;grid-template-columns:repeat(2,1fr);margin:34px 0 0;border-top:1px solid var(--line);border-left:1px solid var(--line)}.specs div{display:flex;justify-content:space-between;gap:16px;padding:18px 20px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.specs dt{color:#aab7c0;font-size:14px}.specs dd{margin:0;font-weight:700;text-align:right}.cta{padding:76px 0;background:linear-gradient(110deg,#17394b,#0e2634)}.cta-inner{display:flex;align-items:center;justify-content:space-between;gap:44px}.cta-inner>div{max-width:700px}.cta-inner p:last-child{color:#c0d0d9;line-height:1.7}.button.light{flex-shrink:0;background:#e8f5fa}.disclaimer{padding:20px 0 28px;color:#788792;font-size:11px;line-height:1.6}@media(max-width:900px){.hero-grid,.payload{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.cta-inner{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.wrap{width:calc(100% - 32px)}.hero{padding:42px 0}.section{padding:64px 0}.stats{gap:9px}.stats strong{font-size:20px}.stats span{font-size:10px}.specs{grid-template-columns:1fr}.specs div{padding:15px}.hero h1{font-size:42px}}
</style>
