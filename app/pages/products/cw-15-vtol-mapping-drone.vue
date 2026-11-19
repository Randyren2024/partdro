<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '~/composables/useLocalePath'
import InquiryForm from '~/components/common/InquiryForm.vue'

const { locale } = useI18n()
const lp = useLocalePath()
const lang = computed(() => String(locale.value || 'en').toLowerCase().split('-')[0])
const messages = {
  en: { eyebrow:'VTOL FIXED-WING PLATFORM', title:'Cover more ground. Capture better data.', lead:'A battery-powered VTOL fixed-wing UAV platform for professional mapping, infrastructure inspection and wide-area monitoring.', cta:'Discuss your mission', sectionEyebrow:'DRONEWORLD PRODUCT OVERVIEW', missionEyebrow:'MISSION PROFILES', configurationEyebrow:'CONFIGURATION', technicalEyebrow:'TECHNICAL OVERVIEW', faqEyebrow:'SUPPORT & PROCUREMENT', faqTitle:'Frequently asked questions', inquiryEyebrow:'MISSION PLANNING', inquiryTitle:'Tell us what you need to accomplish.', inquiryText:'Share your coverage area, required data output, payload and operating environment. Our team will follow up to discuss a suitable configuration.', sourceNote:'Technical information is based on the JOUAV official CW-15 product page. Confirm current specifications, configuration and availability with the manufacturer before procurement.', overview:'Vertical take-off. Fixed-wing coverage.', intro:'Combine flexible vertical take-off and landing with the efficiency of a fixed-wing aircraft. Designed for teams covering large or hard-to-access areas without a conventional runway.', applications:'One platform. Multiple workflows.', app1:'Mapping & surveying', app2:'Infrastructure inspection', app3:'Public safety & monitoring', payload:'Match the aircraft to the task.', payloadText:'Manufacturer-listed payload options include LiDAR, industrial aerial cameras, oblique imaging, gimbal cameras and SAR. Confirm compatibility and endurance for the exact mission configuration.', specs:'Key published specifications', labels:['Maximum payload','Endurance · empty','Endurance · with MG-120E','Cruising speed','Wind resistance','Practical ceiling','Maximum take-off altitude','Fuselage length','Wingspan','Take-off / landing'], values:['3 kg','180 min','120 min','61 km/h','10.8–13.8 m/s','6,500 m','4,500 m','2.06 m','3.54 m','VTOL'], caveat:'Manufacturer-published theoretical figures under specific test conditions. Payload, sensor, software, weather, altitude and mission profile affect actual performance. Confirm the final configuration and acceptance criteria before purchase.', ctaTitle:'Let’s define the right configuration.', ctaText:'Tell us your coverage area, required data output, payload and operating environment. Our team can help scope a suitable UAV configuration and deployment plan.', ctaButton:'Request a CW-15 consultation', visual:'Platform profile schematic', visualNote:'Conceptual illustration only · approved product imagery pending', disclaimer:'DroneWorld product information is prepared from published technical material. Availability, configuration, approvals, training and delivery terms are confirmed individually.' },
  de: { eyebrow:'VTOL-FESTFLÜGELPLATTFORM', title:'Mehr Fläche abdecken. Bessere Daten erfassen.', lead:'Eine batterieelektrische VTOL-Festflügel-UAV-Plattform für Kartierung, Infrastrukturinspektion und großflächige Überwachung.', cta:'Einsatz besprechen', sectionEyebrow:'DRONEWORLD PRODUKTÜBERBLICK', missionEyebrow:'EINSATZPROFILE', configurationEyebrow:'KONFIGURATION', technicalEyebrow:'TECHNISCHER ÜBERBLICK', faqEyebrow:'SUPPORT & BESCHAFFUNG', faqTitle:'Häufig gestellte Fragen', inquiryEyebrow:'EINSATZPLANUNG', inquiryTitle:'Was möchten Sie erreichen?', inquiryText:'Teilen Sie uns Einsatzgebiet, gewünschte Datenausgabe, Nutzlast und Einsatzumgebung mit. Unser Team bespricht mit Ihnen eine passende Konfiguration.', sourceNote:'Technische Angaben basieren auf der offiziellen JOUAV-CW-15-Produktseite. Aktuelle Spezifikationen, Konfiguration und Verfügbarkeit sind vor der Beschaffung mit dem Hersteller zu bestätigen.', overview:'Senkrecht starten. Mit Starrflügel effizient fliegen.', intro:'Die Flexibilität von Senkrechtstart und -landung wird mit der Effizienz eines Starrflüglers kombiniert – für große oder schwer zugängliche Gebiete ohne konventionelle Startbahn.', applications:'Eine Plattform. Viele Arbeitsabläufe.', app1:'Kartierung & Vermessung', app2:'Infrastrukturinspektion', app3:'Öffentliche Sicherheit & Überwachung', payload:'Das Fluggerät auf die Aufgabe abstimmen.', payloadText:'Optionale Nutzlasten laut Hersteller: LiDAR, Industriekameras, Schrägbildkameras, Gimbal-Kameras und SAR. Kompatibilität und Flugzeit müssen für die konkrete Mission bestätigt werden.', specs:'Wichtige veröffentlichte Spezifikationen', labels:['Maximale Nutzlast','Flugzeit · leer','Flugzeit · mit MG-120E','Reisegeschwindigkeit','Windbeständigkeit','Praktische Flughöhe','Max. Startflughöhe','Rumpflänge','Spannweite','Start / Landung'], values:['3 kg','180 Min.','120 Min.','61 km/h','10,8–13,8 m/s','6.500 m','4.500 m','2,06 m','3,54 m','VTOL'], caveat:'Theoretische Herstellerwerte unter bestimmten Testbedingungen. Nutzlast, Sensor, Software, Wetter, Höhe und Missionsprofil beeinflussen die tatsächliche Leistung. Konfiguration und Abnahmekriterien vor dem Kauf bestätigen.', ctaTitle:'Lassen Sie uns die passende Konfiguration festlegen.', ctaText:'Teilen Sie uns Einsatzgebiet, gewünschte Datenausgabe, Nutzlast und Einsatzumgebung mit. Unser Team unterstützt bei Konfiguration und Einsatzplanung.', ctaButton:'CW-15-Beratung anfragen', visual:'Schematische Plattformansicht', visualNote:'Konzeptillustration · finale Produktbilder vorbehaltlich Nutzungsfreigabe', disclaimer:'DroneWorld-Produktinformationen basieren auf veröffentlichten technischen Unterlagen. Verfügbarkeit, Konfiguration, Genehmigungen, Schulung und Lieferbedingungen werden individuell bestätigt.' },
  es: { eyebrow:'PLATAFORMA VTOL DE ALA FIJA', title:'Cubre más terreno. Obtén mejores datos.', lead:'Una plataforma UAV eléctrica VTOL de ala fija para cartografía, inspección de infraestructuras y vigilancia de grandes áreas.', cta:'Habla sobre tu misión', sectionEyebrow:'DESCRIPCIÓN DEL PRODUCTO DRONEWORLD', missionEyebrow:'PERFILES DE MISIÓN', configurationEyebrow:'CONFIGURACIÓN', technicalEyebrow:'RESUMEN TÉCNICO', faqEyebrow:'ASISTENCIA Y ADQUISICIONES', faqTitle:'Preguntas frecuentes', inquiryEyebrow:'PLANIFICACIÓN DE LA MISIÓN', inquiryTitle:'Cuéntanos qué necesitas conseguir.', inquiryText:'Comparte el área de cobertura, los datos requeridos, la carga útil y el entorno operativo. Nuestro equipo te contactará para estudiar una configuración adecuada.', sourceNote:'La información técnica se basa en la página oficial del CW-15 de JOUAV. Confirma con el fabricante las especificaciones, la configuración y la disponibilidad actuales antes de la compra.', overview:'Despegue vertical. Cobertura de ala fija.', intro:'Combina la flexibilidad del despegue y aterrizaje vertical con la eficiencia de un avión de ala fija para cubrir áreas extensas o de difícil acceso sin una pista convencional.', applications:'Una plataforma. Múltiples flujos de trabajo.', app1:'Cartografía y topografía', app2:'Inspección de infraestructuras', app3:'Seguridad pública y vigilancia', payload:'Adapta la aeronave a cada tarea.', payloadText:'Las cargas opcionales enumeradas por el fabricante incluyen LiDAR, cámaras aéreas industriales, imagen oblicua, cámaras gimbal y SAR. Confirma compatibilidad y autonomía para cada misión.', specs:'Especificaciones publicadas principales', labels:['Carga útil máxima','Autonomía · sin carga','Autonomía · con MG-120E','Velocidad de crucero','Resistencia al viento','Techo práctico','Altitud máxima de despegue','Longitud del fuselaje','Envergadura','Despegue / aterrizaje'], values:['3 kg','180 min','120 min','61 km/h','10,8–13,8 m/s','6.500 m','4.500 m','2,06 m','3,54 m','VTOL'], caveat:'Valores teóricos publicados por el fabricante bajo condiciones de prueba específicas. La carga, sensores, software, clima, altitud y perfil de misión afectan al rendimiento real. Confirma la configuración y los criterios de aceptación antes de comprar.', ctaTitle:'Definamos la configuración adecuada.', ctaText:'Cuéntanos el área de cobertura, los datos requeridos, la carga útil y el entorno operativo. Nuestro equipo puede ayudarte a definir la configuración y el despliegue.', ctaButton:'Solicitar asesoramiento sobre CW-15', visual:'Esquema de la plataforma', visualNote:'Gráfico conceptual · imágenes finales pendientes de autorización', disclaimer:'La información de DroneWorld se prepara a partir de documentación técnica publicada. Disponibilidad, configuración, autorizaciones, formación y entrega se confirman individualmente.' },
  fr: { eyebrow:'PLATEFORME VTOL À AILE FIXE', title:'Couvrez plus de terrain. Collectez de meilleures données.', lead:'Une plateforme UAV électrique VTOL à aile fixe destinée à la cartographie, à l’inspection des infrastructures et à la surveillance de vastes zones.', cta:'Parler de votre mission', sectionEyebrow:'PRÉSENTATION DU PRODUIT DRONEWORLD', missionEyebrow:'PROFILS DE MISSION', configurationEyebrow:'CONFIGURATION', technicalEyebrow:'APERÇU TECHNIQUE', faqEyebrow:'ASSISTANCE ET ACHATS', faqTitle:'Questions fréquentes', inquiryEyebrow:'PLANIFICATION DE MISSION', inquiryTitle:'Parlez-nous de vos objectifs.', inquiryText:'Indiquez la zone à couvrir, les données attendues, la charge utile et l’environnement opérationnel. Notre équipe vous contactera pour étudier une configuration adaptée.', sourceNote:'Les informations techniques proviennent de la page officielle du CW-15 de JOUAV. Confirmez les spécifications, la configuration et la disponibilité actuelles auprès du fabricant avant tout achat.', overview:'Décollage vertical. Couverture à aile fixe.', intro:'Associez la flexibilité du décollage et de l’atterrissage verticaux à l’efficacité d’un aéronef à aile fixe pour couvrir de vastes zones ou des sites difficiles d’accès sans piste conventionnelle.', applications:'Une plateforme. Plusieurs flux de travail.', app1:'Cartographie & topographie', app2:'Inspection des infrastructures', app3:'Sécurité publique & surveillance', payload:'Adaptez l’aéronef à la mission.', payloadText:'Les charges utiles proposées comprennent LiDAR, caméras aériennes industrielles, imagerie oblique, nacelles stabilisées et SAR. Compatibilité et autonomie doivent être confirmées pour chaque mission.', specs:'Principales spécifications publiées', labels:['Charge utile maximale','Autonomie · à vide','Autonomie · avec MG-120E','Vitesse de croisière','Résistance au vent','Plafond pratique','Altitude maximale de décollage','Longueur du fuselage','Envergure','Décollage / atterrissage'], values:['3 kg','180 min','120 min','61 km/h','10,8–13,8 m/s','6 500 m','4 500 m','2,06 m','3,54 m','VTOL'], caveat:'Valeurs théoriques publiées par le fabricant dans des conditions d’essai spécifiques. Charge utile, capteurs, logiciel, météo, altitude et profil de mission influencent les performances réelles. Confirmez la configuration et les critères de réception avant achat.', ctaTitle:'Définissons la configuration adaptée.', ctaText:'Indiquez-nous la zone à couvrir, les données attendues, la charge utile et l’environnement opérationnel. Notre équipe peut vous aider à définir la configuration et le déploiement.', ctaButton:'Demander un conseil sur le CW-15', visual:'Schéma de la plateforme', visualNote:'Illustration conceptuelle · visuels définitifs en attente d’autorisation', disclaimer:'Les informations DroneWorld sont préparées à partir de documentation technique publiée. Disponibilité, configuration, autorisations, formation et livraison sont confirmées individuellement.' }
}
const c = computed(() => messages[lang.value as keyof typeof messages] || messages.en)
const faqByLocale = {
  en: [
    { q:'How is the published endurance measured?', a:'The manufacturer lists up to 180 minutes without payload and up to 120 minutes with the MG-120E configuration. These are configuration-specific published figures, not a guarantee for every mission.' },
    { q:'What is the maximum payload?', a:'The published maximum payload is 3 kg. Payload compatibility, power, mounting and endurance should be confirmed for the exact sensor package.' },
    { q:'Can the CW-15 operate without a runway?', a:'Its VTOL architecture supports vertical take-off and landing, reducing dependence on a conventional runway. A suitable clear operating area and safe procedures are still required.' },
    { q:'Which mission payloads are available?', a:'Manufacturer materials list options such as LiDAR, industrial aerial cameras, oblique camera systems, gimbal cameras and SAR. Availability and integration must be confirmed for each configuration.' },
    { q:'Will actual flight time match the published figure?', a:'Not necessarily. Payload, battery condition, weather, wind, altitude, flight profile and operating procedures can affect actual endurance. Confirm acceptance criteria with the supplier.' }
  ],
  de: [
    { q:'Wie wird die angegebene Flugzeit gemessen?', a:'Der Hersteller nennt bis zu 180 Minuten ohne Nutzlast und bis zu 120 Minuten mit der MG-120E-Konfiguration. Diese Werte gelten für bestimmte Konfigurationen und sind keine Garantie für jeden Einsatz.' },
    { q:'Wie hoch ist die maximale Nutzlast?', a:'Die veröffentlichte maximale Nutzlast beträgt 3 kg. Kompatibilität, Stromversorgung, Montage und Flugzeit müssen für das konkrete Sensorsystem bestätigt werden.' },
    { q:'Kann die CW-15 ohne Startbahn betrieben werden?', a:'Die VTOL-Auslegung ermöglicht senkrechten Start und senkrechte Landung. Ein geeigneter freier Betriebsbereich und sichere Verfahren bleiben erforderlich.' },
    { q:'Welche Missionsnutzlasten sind verfügbar?', a:'Der Hersteller nennt unter anderem LiDAR, Industriekameras, Schrägbildkameras, Gimbal-Kameras und SAR. Verfügbarkeit und Integration sind je Konfiguration zu bestätigen.' },
    { q:'Entspricht die tatsächliche Flugzeit dem veröffentlichten Wert?', a:'Nicht unbedingt. Nutzlast, Batteriezustand, Wetter, Wind, Höhe, Flugprofil und Betriebsverfahren beeinflussen die tatsächliche Flugzeit.' }
  ],
  es: [
    { q:'¿Cómo se mide la autonomía publicada?', a:'El fabricante indica hasta 180 minutos sin carga útil y hasta 120 minutos con la configuración MG-120E. Son cifras publicadas para configuraciones concretas, no una garantía para todas las misiones.' },
    { q:'¿Cuál es la carga útil máxima?', a:'La carga útil máxima publicada es de 3 kg. La compatibilidad, alimentación, montaje y autonomía deben confirmarse para cada conjunto de sensores.' },
    { q:'¿Puede operar el CW-15 sin pista?', a:'Su arquitectura VTOL permite el despegue y aterrizaje verticales, reduciendo la dependencia de una pista convencional. Sigue siendo necesaria una zona despejada y procedimientos seguros.' },
    { q:'¿Qué cargas de misión se ofrecen?', a:'El fabricante enumera opciones como LiDAR, cámaras aéreas industriales, cámaras oblicuas, cámaras con gimbal y SAR. La disponibilidad y la integración deben confirmarse para cada configuración.' },
    { q:'¿La autonomía real será igual a la cifra publicada?', a:'No necesariamente. La carga útil, el estado de la batería, el clima, el viento, la altitud, el perfil de vuelo y los procedimientos afectan a la autonomía real.' }
  ],
  fr: [
    { q:'Comment l’autonomie publiée est-elle mesurée ?', a:'Le fabricant indique jusqu’à 180 minutes sans charge utile et jusqu’à 120 minutes avec la configuration MG-120E. Ces chiffres concernent des configurations précises et ne garantissent pas chaque mission.' },
    { q:'Quelle est la charge utile maximale ?', a:'La charge utile maximale publiée est de 3 kg. La compatibilité, l’alimentation, le montage et l’autonomie doivent être confirmés pour chaque ensemble de capteurs.' },
    { q:'Le CW-15 peut-il fonctionner sans piste ?', a:'Son architecture VTOL permet le décollage et l’atterrissage verticaux. Une zone d’exploitation dégagée et des procédures de sécurité restent nécessaires.' },
    { q:'Quelles charges utiles de mission sont proposées ?', a:'Le fabricant cite notamment le LiDAR, les caméras aériennes industrielles, les systèmes de prise de vue oblique, les caméras stabilisées et le SAR. Disponibilité et intégration sont à confirmer.' },
    { q:'L’autonomie réelle correspond-elle à la valeur publiée ?', a:'Pas nécessairement. La charge utile, l’état de la batterie, la météo, le vent, l’altitude, le profil de vol et les procédures influencent l’autonomie réelle.' }
  ]
}
const faq = computed(() => faqByLocale[lang.value as keyof typeof faqByLocale] || faqByLocale.en)
const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      '@id': origin + localizedPath.value + '#product',
      name: 'JOUAV CW-15 Long-Endurance VTOL Fixed-Wing UAV',
      model: 'CW-15',
      brand: { '@type': 'Brand', name: 'JOUAV' },
      manufacturer: { '@type': 'Organization', name: 'JOUAV', url: 'https://www.jouav.com/' },
      description: c.value.lead,
      url: origin + localizedPath.value,
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Maximum payload', value: '3 kg' },
        { '@type': 'PropertyValue', name: 'Endurance without payload', value: '180 min' },
        { '@type': 'PropertyValue', name: 'Endurance with MG-120E', value: '120 min' },
        { '@type': 'PropertyValue', name: 'Cruise speed', value: '61 km/h' },
        { '@type': 'PropertyValue', name: 'Wingspan', value: '3.54 m' },
        { '@type': 'PropertyValue', name: 'Fuselage length', value: '2.06 m' },
        { '@type': 'PropertyValue', name: 'Service ceiling', value: '6,500 m' }
      ]
    },
    {
      '@type': 'FAQPage',
      '@id': origin + localizedPath.value + '#faq',
      mainEntity: faq.value.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' },
        { '@type': 'ListItem', position: 2, name: 'Products', item: origin + '/products' },
        { '@type': 'ListItem', position: 3, name: 'CW-15', item: origin + localizedPath.value }
      ]
    }
  ]
}))
const origin = 'https://www.droneworld.tech'
const path = '/products/cw-15-vtol-mapping-drone'
const localizedPath = computed(() => lang.value === 'en' ? path : '/' + lang.value + path)
const pageTitle = computed(() => 'CW-15 VTOL Fixed-Wing UAV | Mapping & Inspection | DroneWorld')
useHead(() => ({
  title: pageTitle.value,
  htmlAttrs: { lang: lang.value },
  meta: [
    { name:'description', content:c.value.lead },
    { name:'robots', content:'index,follow,max-image-preview:large,max-snippet:-1' },
    { property:'og:type', content:'product' },
    { property:'og:site_name', content:'DroneWorld' },
    { property:'og:title', content:pageTitle.value },
    { property:'og:description', content:c.value.lead },
    { property:'og:url', content:origin + localizedPath.value },
    { property:'og:image', content:origin + '/images/cw-15-technical-illustration.svg' },
    { property:'og:image:alt', content:c.value.visualNote },
    { name:'twitter:image', content:origin + '/images/cw-15-technical-illustration.svg' },
    { name:'twitter:image:alt', content:c.value.visualNote },
    { name:'twitter:card', content:'summary_large_image' }
  ],
  script: [{ key:'cw15-product-jsonld', type:'application/ld+json', innerHTML:JSON.stringify(structuredData.value).replace(/</g, '\\u003c') }],
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
        <a href="#cw15-inquiry" class="button">{{ c.cta }} ↗</a>
        <div class="stats"><div><strong>180 min</strong><span>Maximum endurance · empty</span></div><div><strong>3 kg</strong><span>Payload capacity</span></div><div><strong>61 km/h</strong><span>Cruising speed</span></div></div>
        <p class="note">{{ c.caveat }}</p>
      </div>
      <div class="visual"><img src="/images/cw-15-technical-illustration.svg" alt="Conceptual technical illustration of a VTOL fixed-wing UAV platform" width="900" height="560"><span>{{ c.visual }}</span><small>{{ c.visualNote }}</small></div>
    </div></section>
    <section class="section"><div class="wrap"><p class="eyebrow">{{ c.sectionEyebrow }}</p><h2>{{ c.overview }}</h2><p class="intro">{{ c.intro }}</p>
      <div class="cards"><article><b>01</b><h3>Runway-independent deployment</h3><p>Vertical take-off and landing supports operations from constrained or remote sites.</p></article><article><b>02</b><h3>Mission-specific payloads</h3><p>Modular payload options support mapping, LiDAR, oblique imaging and EO/IR workflows.</p></article><article><b>03</b><h3>Repeatable field operations</h3><p>Pre-flight checks, mission planning and data handling help teams standardise workflows.</p></article></div>
    </div></section>
    <section class="section soft"><div class="wrap"><p class="eyebrow">{{ c.missionEyebrow }}</p><h2>{{ c.applications }}</h2><div class="cards"><article><b>⌁</b><h3>{{ c.app1 }}</h3><p>Collect aerial imagery and geospatial data for corridor mapping, site documentation and land development.</p></article><article><b>⌖</b><h3>{{ c.app2 }}</h3><p>Support inspection planning across power, oil and gas, transport and other linear assets.</p></article><article><b>◉</b><h3>{{ c.app3 }}</h3><p>Provide an aerial perspective for situational awareness, search support and wide-area observation.</p></article></div></div></section>
    <section class="section"><div class="wrap payload"><div><p class="eyebrow">{{ c.configurationEyebrow }}</p><h2>{{ c.payload }}</h2><p class="intro">{{ c.payloadText }}</p></div><div class="tags"><span>LiDAR</span><span>Aerial mapping camera</span><span>Oblique imaging</span><span>EO/IR gimbal</span><span>SAR</span></div></div></section>
    <section class="section soft"><div class="wrap"><p class="eyebrow">{{ c.technicalEyebrow }}</p><h2>{{ c.specs }}</h2><dl class="specs"><div v-for="(label,i) in c.labels" :key="label"><dt>{{ label }}</dt><dd>{{ c.values[i] }}</dd></div></dl><p class="caveat">{{ c.caveat }}</p></div></section>
    <section class="section faq-section"><div class="wrap"><p class="eyebrow">{{ c.faqEyebrow }}</p><h2>{{ c.faqTitle }}</h2><div class="faq-list"><details v-for="item in faq" :key="item.q"><summary>{{ item.q }}</summary><p>{{ item.a }}</p></details></div><p class="source-note">{{ c.sourceNote }} <a href="https://www.jouav.com/products/cw-15.html" target="_blank" rel="noopener noreferrer">JOUAV</a>.</p></div></section>
    <section id="cw15-inquiry" class="section inquiry-section"><div class="wrap inquiry-grid"><div><p class="eyebrow">{{ c.inquiryEyebrow }}</p><h2>{{ c.inquiryTitle }}</h2><p class="intro">{{ c.inquiryText }}</p><p class="note">{{ c.disclaimer }}</p></div><div class="inquiry-panel"><InquiryForm /></div></div></section>
    <div class="wrap disclaimer">{{ c.disclaimer }}</div>
  </main>
</template>

<style scoped>
.cw15-page{--ink:#f2f5f7;--muted:#a8b3bc;--line:rgba(255,255,255,.12);background:#0a1016;color:var(--ink);font-family:Barlow,Arial,sans-serif}.wrap{width:min(1180px,calc(100% - 48px));margin:auto}.hero{padding:76px 0 66px;background:radial-gradient(ellipse at 78% 25%,rgba(31,111,145,.22),transparent 38%),linear-gradient(135deg,#0a1016,#111d27 58%,#0a1016)}.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center}.back{display:inline-block;margin-bottom:34px;color:var(--muted);font-size:13px;text-decoration:none}.eyebrow{margin:0 0 16px;color:#76c5e7;font-size:12px;font-weight:750;letter-spacing:.16em;text-transform:uppercase}.hero h1{margin:0 0 22px;font-size:clamp(42px,5.3vw,70px);font-weight:760;letter-spacing:-.045em;line-height:1.02}.lead,.intro{max-width:720px;color:#c2ccd3;font-size:18px;line-height:1.7}.button{display:inline-flex;min-height:52px;align-items:center;margin:28px 0;padding:0 22px;border-radius:4px;background:#72c6e8;color:#07121a;font-size:14px;font-weight:750;text-decoration:none}.button:hover{background:#9bdbf2}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-top:24px;border-top:1px solid var(--line)}.stats div{display:flex;flex-direction:column;gap:5px}.stats strong{font-size:25px}.stats span{color:var(--muted);font-size:11px;line-height:1.4}.note,.caveat{color:#8796a0;font-size:12px;line-height:1.7}.visual{position:relative;padding:12px;border:1px solid rgba(137,202,229,.2);border-radius:8px;background:#101b24}.visual img{display:block;width:100%;height:auto}.visual>span{position:absolute;left:22px;bottom:42px;padding:8px 10px;background:rgba(5,12,18,.82);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.visual small{display:block;padding:8px 4px 0;color:#81909a;text-align:right}.section{padding:88px 0}.section h2,.cta h2{max-width:800px;margin:0 0 18px;font-size:clamp(32px,4vw,48px);font-weight:730;letter-spacing:-.035em;line-height:1.1}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:38px}.cards article{min-height:190px;padding:26px;border:1px solid var(--line);border-radius:6px;background:#111b24}.cards b{color:#72c6e8;font-size:13px}.cards h3{margin:24px 0 10px;font-size:20px}.cards p{margin:0;color:#aab7c0;font-size:14px;line-height:1.7}.soft{background:#101922}.soft .cards article{background:#0c141c}.payload{display:grid;grid-template-columns:1.2fr .8fr;gap:42px;align-items:center}.tags{display:flex;flex-wrap:wrap;gap:10px}.tags span{padding:12px 14px;border:1px solid rgba(114,198,232,.3);border-radius:3px;color:#c8e8f5;background:rgba(114,198,232,.06);font-size:13px}.specs{display:grid;grid-template-columns:repeat(2,1fr);margin:34px 0 0;border-top:1px solid var(--line);border-left:1px solid var(--line)}.specs div{display:flex;justify-content:space-between;gap:16px;padding:18px 20px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.specs dt{color:#aab7c0;font-size:14px}.specs dd{margin:0;font-weight:700;text-align:right}.faq-list{margin-top:32px;border-top:1px solid var(--line)}.faq-list details{padding:22px 4px;border-bottom:1px solid var(--line)}.faq-list summary{cursor:pointer;font-size:18px;font-weight:700;list-style:none}.faq-list summary::-webkit-details-marker{display:none}.faq-list summary:after{content:'+';float:right;color:#72c6e8;font-size:22px}.faq-list details[open] summary:after{content:'−'}.faq-list details p{max-width:850px;margin:16px 0 0;color:#aab7c0;font-size:15px;line-height:1.8}.source-note{margin-top:28px;color:#8796a0;font-size:12px;line-height:1.7}.source-note a{color:#8bd4f0}.inquiry-section{background:linear-gradient(135deg,#0b131b,#122533)}.inquiry-grid{display:grid;grid-template-columns:1fr .82fr;gap:56px;align-items:center}.inquiry-panel{padding:28px;border:1px solid rgba(137,202,229,.22);border-radius:10px;background:#f7f9fb;color:#111}.inquiry-panel :deep(.inquiry-form){margin:0}.inquiry-panel :deep(.inquiry-form__card){box-shadow:none}.inquiry-panel :deep(.inquiry-form__card h3){color:#10202b}.inquiry-panel :deep(.ant-btn-primary){background:#123c52;border-color:#123c52}.inquiry-panel :deep(.ant-btn-primary:hover){background:#1d5874;border-color:#1d5874}.disclaimer{padding:20px 0 28px;color:#788792;font-size:11px;line-height:1.6}@media(max-width:900px){.hero-grid,.payload,.inquiry-grid{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.cta-inner{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.wrap{width:calc(100% - 32px)}.hero{padding:42px 0}.section{padding:64px 0}.stats{gap:9px}.stats strong{font-size:20px}.stats span{font-size:10px}.specs{grid-template-columns:1fr}.specs div{padding:15px}.hero h1{font-size:42px}}
</style>