<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '~/composables/useLocalePath'

const { locale } = useI18n()
const lp = useLocalePath()
const lang = computed(() => String(locale.value || 'en').toLowerCase().split('-')[0])
const messages = {
  en: {
    eyebrow:'COAXIAL UNMANNED HELICOPTER',
    title:'Heavy lift. Where roads end.',
    lead:'A coaxial unmanned helicopter platform built for emergency response, firefighting and heavy logistics — carrying substantial payloads to altitude and holding position with precision.',
    cta:'Discuss your mission',
    overview:'Heavy-lift reach without a runway.',
    intro:'The TD550 uses a coaxial rotor layout to deliver helicopter-class lift in a compact unmanned airframe. It takes off vertically from unprepared ground, holds its position for precision work and returns with the payload margin that emergency and logistics missions demand.',
    applications:'One airframe. Three demanding roles.',
    app1:'Emergency response & firefighting',
    app2:'Heavy cargo & logistics',
    app3:'Reconnaissance & surveillance',
    payload:'Built around the payload.',
    payloadText:'The platform is specified around the mission kit: firefighting payloads, cargo hooks and sling loads, or EO/IR surveillance turrets. Tell us the load, the operating altitude and the turnaround you need, and we scope the configuration with you.',
    specs:'Key published specifications',
    labels:['Max take-off weight','Max payload','Max level speed','Cruise speed','Operating radius','Service ceiling','Take-off / landing altitude','Wind resistance'],
    values:['600 kg (sea level) / 550 kg (5,000 m)','200 kg (sea level) / 120 kg (5,000 m)','180 km/h','120–140 km/h','200 km','6,500 m','5,000 m','Level 6 (12 m/s)'],
    caveat:'Published theoretical figures under specific test conditions. Payload, configuration, altitude, temperature, wind and mission profile affect actual performance. Confirm the final configuration and acceptance criteria before purchase.',
    ctaTitle:'Let’s define the right configuration.',
    ctaText:'Share your mission profile — payload, operating altitude, site conditions and required response time. Our team can help scope a TD550 configuration, training plan and deployment schedule.',
    ctaButton:'Request a TD550 consultation',
    visual:'Platform profile schematic',
    visualNote:'Conceptual illustration only · approved product imagery pending',
    disclaimer:'DroneWorld product information is prepared from published technical material. Availability, configuration, approvals, training and delivery terms are confirmed individually.'
  },
  de: {
    eyebrow:'KOAXIALER UNBEMANNTER HUBSCHRAUBER',
    title:'Schwere Last. Wo Straßen enden.',
    lead:'Eine koaxiale unbemannte Hubschrauberplattform für Notfallversorgung, Brandbekämpfung und schwere Logistik – hohe Nutzlasten in großer Höhe und präziser Schwebeflug.',
    cta:'Einsatz besprechen',
    overview:'Schwerlast-Reichweite ohne Startbahn.',
    intro:'Der TD550 nutzt ein koaxiales Rotorkonzept und erreicht Hubschrauber-Auftrieb in einer kompakten unbemannten Zelle. Er startet senkrecht von unbefestigtem Boden, hält die Position für präzise Arbeiten und bringt die Nutzlastreserve zurück, die Einsatz- und Logistikmissionen verlangen.',
    applications:'Eine Zelle. Drei anspruchsvolle Rollen.',
    app1:'Notfallversorgung & Brandbekämpfung',
    app2:'Schwerlast & Logistik',
    app3:'Aufklärung & Überwachung',
    payload:'Die Nutzlast bestimmt die Auslegung.',
    payloadText:'Die Plattform wird um das Missionskit herum spezifiziert: Löschkomponenten, Lastenhaken und Außenlasten oder EO/IR-Überwachungsköpfe. Nennen Sie Last, Einsatzhöhe und gewünschte Umlaufzeit – wir legen die Konfiguration gemeinsam fest.',
    specs:'Wichtige veröffentlichte Spezifikationen',
    labels:['Max. Startgewicht','Maximale Nutzlast','Max. Horizontalgeschwindigkeit','Reisegeschwindigkeit','Einsatzradius','Dienstgipfelhöhe','Start- / Landehöhe','Windbeständigkeit'],
    values:['600 kg (Meereshöhe) / 550 kg (5.000 m)','200 kg (Meereshöhe) / 120 kg (5.000 m)','180 km/h','120–140 km/h','200 km','6.500 m','5.000 m','Stufe 6 (12 m/s)'],
    caveat:'Theoretische Herstellerangaben unter bestimmten Testbedingungen. Nutzlast, Konfiguration, Höhe, Temperatur, Wind und Missionsprofil beeinflussen die tatsächliche Leistung. Konfiguration und Abnahmekriterien vor dem Kauf bestätigen.',
    ctaTitle:'Lassen Sie uns die passende Konfiguration festlegen.',
    ctaText:'Teilen Sie uns Missionsprofil, Nutzlast, Einsatzhöhe, Standortbedingungen und geforderte Reaktionszeit mit. Unser Team unterstützt bei Konfiguration, Schulung und Einsatzplanung.',
    ctaButton:'TD550-Beratung anfragen',
    visual:'Schematische Plattformansicht',
    visualNote:'Konzeptillustration · finale Produktbilder vorbehaltlich Nutzungsfreigabe',
    disclaimer:'DroneWorld-Produktinformationen basieren auf veröffentlichten technischen Unterlagen. Verfügbarkeit, Konfiguration, Genehmigungen, Schulung und Lieferbedingungen werden individuell bestätigt.'
  },
  es: {
    eyebrow:'HELICÓPTERO NO TRIPULADO COAXIAL',
    title:'Gran carga. Donde terminan las carreteras.',
    lead:'Plataforma de helicóptero no tripulado coaxial para emergencias, extinción de incendios y logística pesada: gran carga útil en altura y vuelo estacionario de precisión.',
    cta:'Habla sobre tu misión',
    overview:'Alcance de gran carga sin pista.',
    intro:'El TD550 emplea una configuración de rotores coaxiales para ofrecer sustentación de helicóptero en una célula no tripulada compacta. Despega verticalmente desde terreno sin preparar, mantiene la posición para trabajos de precisión y regresa con el margen de carga que exigen las misiones de emergencia y logística.',
    applications:'Una aeronave. Tres funciones exigentes.',
    app1:'Emergencias y extinción de incendios',
    app2:'Carga pesada y logística',
    app3:'Reconocimiento y vigilancia',
    payload:'La carga útil define la configuración.',
    payloadText:'La plataforma se especifica en torno al kit de misión: equipos de extinción, ganchos de carga y cargas externalizadas, o torretas EO/IR. Indícanos la carga, la altitud de operación y el ritmo de rotación necesario y definimos la configuración contigo.',
    specs:'Especificaciones publicadas principales',
    labels:['Peso máximo al despegue','Carga útil máxima','Velocidad máxima en vuelo horizontal','Velocidad de crucero','Radio de operación','Techo de servicio','Altitud de despegue / aterrizaje','Resistencia al viento'],
    values:['600 kg (nivel del mar) / 550 kg (5.000 m)','200 kg (nivel del mar) / 120 kg (5.000 m)','180 km/h','120–140 km/h','200 km','6.500 m','5.000 m','Nivel 6 (12 m/s)'],
    caveat:'Valores teóricos publicados bajo condiciones de prueba específicas. La carga, la configuración, la altitud, la temperatura, el viento y el perfil de misión afectan al rendimiento real. Confirma la configuración y los criterios de aceptación antes de comprar.',
    ctaTitle:'Definamos la configuración adecuada.',
    ctaText:'Comparte tu perfil de misión: carga útil, altitud de operación, condiciones del emplazamiento y tiempo de respuesta requerido. Nuestro equipo te ayudará a definir la configuración, la formación y el despliegue.',
    ctaButton:'Solicitar asesoramiento sobre el TD550',
    visual:'Esquema de la plataforma',
    visualNote:'Ilustración conceptual · imágenes finales pendientes de autorización',
    disclaimer:'La información de DroneWorld se prepara a partir de documentación técnica publicada. Disponibilidad, configuración, autorizaciones, formación y entrega se confirman individualmente.'
  },
  fr: {
    eyebrow:'HÉLICOPTÈRE SANS PILOTE COAXIAL',
    title:'Charge lourde. Là où les routes s’arrêtent.',
    lead:'Une plateforme hélicoptère sans pilote coaxial conçue pour les secours, la lutte contre les incendies et la logistique lourde : forte charge utile en altitude et vol stationnaire de précision.',
    cta:'Parler de votre mission',
    overview:'Une capacité de levage sans piste.',
    intro:'Le TD550 repose sur une architecture de rotors coaxiaux pour offrir une portance de type hélicoptère dans une cellule sans pilote compacte. Il décolle verticalement depuis un terrain non préparé, tient sa position pour les travaux de précision et revient avec la marge de charge qu’exigent les missions de secours et de logistique.',
    applications:'Une cellule. Trois rôles exigeants.',
    app1:'Secours & lutte contre les incendies',
    app2:'Fret lourd & logistique',
    app3:'Reconnaissance & surveillance',
    payload:'La charge utile définit la configuration.',
    payloadText:'La plateforme est spécifiée autour du kit de mission : moyens de lutte incendie, crochets de charge et élingues, ou tourelles EO/IR. Indiquez-nous la charge, l’altitude d’opération et le cadencement souhaité : nous définissons la configuration avec vous.',
    specs:'Principales spécifications publiées',
    labels:['Masse maximale au décollage','Charge utile maximale','Vitesse maximale en palier','Vitesse de croisière','Rayon d’action','Plafond de service','Altitude de décollage / atterrissage','Résistance au vent'],
    values:['600 kg (niveau de la mer) / 550 kg (5 000 m)','200 kg (niveau de la mer) / 120 kg (5 000 m)','180 km/h','120–140 km/h','200 km','6 500 m','5 000 m','Niveau 6 (12 m/s)'],
    caveat:'Valeurs théoriques publiées dans des conditions d’essai spécifiques. Charge utile, configuration, altitude, température, vent et profil de mission influencent les performances réelles. Confirmez la configuration et les critères de réception avant achat.',
    ctaTitle:'Définissons la configuration adaptée.',
    ctaText:'Décrivez votre profil de mission : charge utile, altitude d’opération, conditions du site et délai d’intervention requis. Notre équipe vous aidera à définir la configuration, la formation et le calendrier de déploiement.',
    ctaButton:'Demander un conseil sur le TD550',
    visual:'Schéma de la plateforme',
    visualNote:'Illustration conceptuelle · visuels définitifs en attente d’autorisation',
    disclaimer:'Les informations DroneWorld sont préparées à partir de documentation technique publiée. Disponibilité, configuration, autorisations, formation et livraison sont confirmées individuellement.'
  }
}
const c = computed(() => messages[lang.value as keyof typeof messages] || messages.en)
const origin = 'https://www.droneworld.tech'
const path = '/products/td550'
const localizedPath = computed(() => lang.value === 'en' ? path : '/' + lang.value + path)
const pageTitle = computed(() => 'TD550 Coaxial Unmanned Helicopter | Heavy-Lift UAV | DroneWorld')
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
        <NuxtLink :to="{ path: lp('/contact'), query:{ product:'TD550', source:'product-landing' } }" class="button">{{ c.cta }} ↗</NuxtLink>
        <div class="stats"><div><strong>600 kg</strong><span>Max take-off weight · sea level</span></div><div><strong>200 kg</strong><span>Max payload · sea level</span></div><div><strong>6,500 m</strong><span>Service ceiling</span></div></div>
        <p class="note">{{ c.caveat }}</p>
      </div>
      <div class="visual"><img src="/images/td550-conceptual.svg" alt="Conceptual technical illustration of a coaxial unmanned helicopter platform" width="1200" height="800"><span>{{ c.visual }}</span><small>{{ c.visualNote }}</small></div>
    </div></section>
    <section class="section"><div class="wrap"><p class="eyebrow">DRONEWORLD PRODUCT OVERVIEW</p><h2>{{ c.overview }}</h2><p class="intro">{{ c.intro }}</p>
      <div class="cards"><article><b>01</b><h3>Vertical launch from unprepared ground</h3><p>The coaxial layout removes the need for a runway, a launcher or a prepared pad.</p></article><article><b>02</b><h3>Helicopter-class lift margin</h3><p>Payload reserves sized for firefighting kits, sling loads and heavy sensor packages.</p></article><article><b>03</b><h3>Precision hover for field work</h3><p>Stable station-keeping supports winching, drop-off and close-range inspection tasks.</p></article></div>
    </div></section>
    <section class="section soft"><div class="wrap"><p class="eyebrow">MISSION PROFILES</p><h2>{{ c.applications }}</h2><div class="cards"><article><b>⌁</b><h3>{{ c.app1 }}</h3><p>Deliver extinguishing agents, drop equipment and support situational awareness where ground access is blocked.</p></article><article><b>⌖</b><h3>{{ c.app2 }}</h3><p>Move spare parts, medical supplies or tools between depots and remote sites on demand.</p></article><article><b>◉</b><h3>{{ c.app3 }}</h3><p>Carry EO/IR payloads for search support, perimeter monitoring and wide-area observation.</p></article></div></div></section>
    <section class="section"><div class="wrap payload"><div><p class="eyebrow">CONFIGURATION</p><h2>{{ c.payload }}</h2><p class="intro">{{ c.payloadText }}</p></div><div class="tags"><span>Firefighting kit</span><span>Cargo hook</span><span>Sling load</span><span>EO/IR turret</span><span>Logistics pod</span></div></div></section>
    <section class="section soft"><div class="wrap"><p class="eyebrow">TECHNICAL OVERVIEW</p><h2>{{ c.specs }}</h2><dl class="specs"><div v-for="(label,i) in c.labels" :key="label"><dt>{{ label }}</dt><dd>{{ c.values[i] }}</dd></div></dl><p class="caveat">{{ c.caveat }}</p></div></section>
    <section class="cta"><div class="wrap cta-inner"><div><p class="eyebrow">PLAN YOUR NEXT MISSION</p><h2>{{ c.ctaTitle }}</h2><p>{{ c.ctaText }}</p></div><NuxtLink :to="{ path: lp('/contact'), query:{ product:'TD550', source:'product-landing' } }" class="button light">{{ c.ctaButton }} ↗</NuxtLink></div></section>
    <div class="wrap disclaimer">{{ c.disclaimer }}</div>
  </main>
</template>

<style scoped>
.cw15-page{--ink:#f2f5f7;--muted:#a8b3bc;--line:rgba(255,255,255,.12);background:#0a1016;color:var(--ink);font-family:Barlow,Arial,sans-serif}.wrap{width:min(1180px,calc(100% - 48px));margin:auto}.hero{padding:76px 0 66px;background:radial-gradient(ellipse at 78% 25%,rgba(31,111,145,.22),transparent 38%),linear-gradient(135deg,#0a1016,#111d27 58%,#0a1016)}.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center}.back{display:inline-block;margin-bottom:34px;color:var(--muted);font-size:13px;text-decoration:none}.eyebrow{margin:0 0 16px;color:#76c5e7;font-size:12px;font-weight:750;letter-spacing:.16em;text-transform:uppercase}.hero h1{margin:0 0 22px;font-size:clamp(42px,5.3vw,70px);font-weight:760;letter-spacing:-.045em;line-height:1.02}.lead,.intro{max-width:720px;color:#c2ccd3;font-size:18px;line-height:1.7}.button{display:inline-flex;min-height:52px;align-items:center;margin:28px 0;padding:0 22px;border-radius:4px;background:#72c6e8;color:#07121a;font-size:14px;font-weight:750;text-decoration:none}.button:hover{background:#9bdbf2}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-top:24px;border-top:1px solid var(--line)}.stats div{display:flex;flex-direction:column;gap:5px}.stats strong{font-size:25px}.stats span{color:var(--muted);font-size:11px;line-height:1.4}.note,.caveat{color:#8796a0;font-size:12px;line-height:1.7}.visual{position:relative;padding:12px;border:1px solid rgba(137,202,229,.2);border-radius:8px;background:#101b24}.visual img{display:block;width:100%;height:auto}.visual>span{position:absolute;left:22px;bottom:42px;padding:8px 10px;background:rgba(5,12,18,.82);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.visual small{display:block;padding:8px 4px 0;color:#81909a;text-align:right}.section{padding:88px 0}.section h2,.cta h2{max-width:800px;margin:0 0 18px;font-size:clamp(32px,4vw,48px);font-weight:730;letter-spacing:-.035em;line-height:1.1}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:38px}.cards article{min-height:190px;padding:26px;border:1px solid var(--line);border-radius:6px;background:#111b24}.cards b{color:#72c6e8;font-size:13px}.cards h3{margin:24px 0 10px;font-size:20px}.cards p{margin:0;color:#aab7c0;font-size:14px;line-height:1.7}.soft{background:#101922}.soft .cards article{background:#0c141c}.payload{display:grid;grid-template-columns:1.2fr .8fr;gap:42px;align-items:center}.tags{display:flex;flex-wrap:wrap;gap:10px}.tags span{padding:12px 14px;border:1px solid rgba(114,198,232,.3);border-radius:3px;color:#c8e8f5;background:rgba(114,198,232,.06);font-size:13px}.specs{display:grid;grid-template-columns:repeat(2,1fr);margin:34px 0 0;border-top:1px solid var(--line);border-left:1px solid var(--line)}.specs div{display:flex;justify-content:space-between;gap:16px;padding:18px 20px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.specs dt{color:#aab7c0;font-size:14px}.specs dd{margin:0;font-weight:700;text-align:right}.cta{padding:76px 0;background:linear-gradient(110deg,#17394b,#0e2634)}.cta-inner{display:flex;align-items:center;justify-content:space-between;gap:44px}.cta-inner>div{max-width:700px}.cta-inner p:last-child{color:#c0d0d9;line-height:1.7}.button.light{flex-shrink:0;background:#e8f5fa}.disclaimer{padding:20px 0 28px;color:#788792;font-size:11px;line-height:1.6}@media(max-width:900px){.hero-grid,.payload{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.cta-inner{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.wrap{width:calc(100% - 32px)}.hero{padding:42px 0}.section{padding:64px 0}.stats{gap:9px}.stats strong{font-size:20px}.stats span{font-size:10px}.specs{grid-template-columns:1fr}.specs div{padding:15px}.hero h1{font-size:42px}}
</style>
