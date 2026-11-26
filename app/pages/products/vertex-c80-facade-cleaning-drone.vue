<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '~/composables/useLocalePath'
import InquiryForm from '~/components/common/InquiryForm.vue'

const { locale } = useI18n()
const lp = useLocalePath()
const lang = computed(() => String(locale.value || 'en').toLowerCase().split('-')[0])
const messages = {
  en: {
    seoTitle: 'EAUAV Vertex C80/C80P Facade Cleaning Drone | DroneWorld', homeLabel: 'Home', productsLabel: 'Products',
    eyebrow: 'WATER-FED FACADE CLEANING SYSTEM', title: 'Revolutionize facade cleaning with drones.',
    lead: 'The EAUAV Vertex C80/C80P is a complete hose-fed cleaning drone system for glass facades, high-rise windows, exterior walls, billboards, roofs and selected rooftop solar — for buildings up to 120 m.',
    cta: 'Request a quote', backLabel: 'Products',
    stat1: 'Endurance per charge', stat2: 'Max project height (C80P)', stat3: 'Fast cleaning rate',
    visual: 'Vertex C80 cleaning a high-rise glass facade', visualNote: 'Battery-powered flight, water supplied from a ground pump through a hose.',
    caveat: 'Published figures are configuration- and condition-dependent. Confirm the delivered configuration, pump, hose and compliance requirements before procurement.',
    sectionEyebrow: 'DRONEWORLD PRODUCT OVERVIEW', overview: 'What is the EAUAV Vertex C80/C80P?',
    intro: 'A CE-certified water-fed facade cleaning drone system for commercial building cleaning. The drone flies on battery while water or approved cleaning solution is supplied from a ground pump through a hose. C80 suits routine facade and roof cleaning; C80P supports high-rise projects up to 120 m. Projects above 120 m are reviewed case by case.',
    feature1Title: 'Safer workflow', feature1Desc: 'Reduce rope-access exposure and keep crews off suspended platforms with pilot-supervised flight.',
    feature2Title: 'Faster setup', feature2Desc: 'Start cleaning without scaffolding — a lean pilot plus ground-crew workflow shortens setup time.',
    feature3Title: 'Lower job cost', feature3Desc: 'Cover more exterior surface with a smaller crew and build margin into every project.',
    archEyebrow: 'WATER-FED ARCHITECTURE', archTitle: 'How the water-fed C80/C80P system works',
    archIntro: 'Water, detergent and pump weight stay on the ground. The drone flies on battery and carries only the spray boom and nozzles, making the aircraft lighter and more practical for close-to-building cleaning.',
    arch1: 'Water source', arch1Desc: 'Tap, tank, truck or approved cleaning solution source.',
    arch2: 'Ground pump', arch2Desc: 'Pressurizes water for facade cleaning.',
    arch3: 'Water hose', arch3Desc: 'Supplies water to the drone spray boom.',
    arch4: 'C80 drone', arch4Desc: 'Flies on battery and carries the spray system.',
    arch5: 'Pilot control', arch5Desc: 'Controls flight, standoff, nozzle mode and pump start/stop.',
    arch6: 'Ground crew', arch6Desc: 'Manages hose, pump, water source and safety perimeter.',
    cleanEyebrow: 'AERO-CLEANSE™ SYSTEM', cleanTitle: 'What makes Vertex C80/C80P work',
    cleanIntro: 'Three core layers — the drone platform, the battery-powered flight system and the Aero-Cleanse™ cleaning system — connect the ground pump, hose, spray boom, foam nozzle and pressure nozzles into one practical workflow.',
    nozzleTitle: 'Interchangeable nozzles', nozzleDesc: 'Foam, 0°, 15°, 25° and 40° fan nozzles cover detergent application, stubborn spots, narrow strips, general cleaning and low-pressure coverage.',
    enduranceTitle: '45-minute long endurance', enduranceDesc: 'High-capacity, quick-swap intelligent batteries deliver up to 45 minutes of flight. A 2–3 battery rotation keeps cyclical operations running with minimal downtime.',
    modesEyebrow: 'INTELLIGENT FLIGHT MODES', modesTitle: 'Pilot-supervised intelligent flight modes',
    modesIntro: 'The pilot stays in control and can pause, override or stop spraying at any time.',
    mode1Title: 'Manual mode', mode1Desc: 'Full manual control for spot cleaning, edges, corners, balconies, stains and detailed touch-ups.',
    mode2Title: 'Assisted A-B route', mode2Desc: 'Semi-automatic vertical cleaning passes for regular flat facades under pilot supervision.',
    mode3Title: 'Pilot-supervised area mode', mode3Desc: 'Mark boundary points, set route spacing and speed, then run repeated cleaning passes with pilot oversight.',
    safetyEyebrow: 'SAFETY FEATURES', safetyTitle: 'Safety for close-to-building cleaning',
    safetyIntro: 'Facade cleaning is close-to-building flight near glass, corners, protrusions, hose loads and pedestrians. C80/C80P is designed with pilot-supervised safety features for professional workflows.',
    safety1Title: 'Reliable GNSS/RTK positioning', safety1Desc: 'Dual GNSS/RTK architecture, high-gain mushroom antennas and centimeter-level positioning improve close-to-facade reliability in challenging urban environments.',
    safety2Title: 'Auto standoff and FPV assistance', safety2Desc: 'Auto standoff assistance and the FPV gimbal view help maintain a configurable distance from the facade and reduce pilot workload.',
    safety3Title: 'Configurable failsafes and optional parachute', safety3Desc: 'Hover, Ascend or Return-to-Home can be configured for low battery or signal loss. Optional parachute integration adds risk mitigation.',
    upgradeEyebrow: '2026 NEW FEATURES', upgradeTitle: '2026 upgrades that solve real cleaning problems',
    upgradeIntro: 'The 2026 system is upgraded around real jobsite problems: weak satellite signals, nozzle changes, pilot–ground communication, compliance documents, maintenance and taller projects.',
    up1Title: 'Enhanced GNSS/RTK stability', up1Desc: 'Dual high-gain antennas improve positioning in narrow streets, urban canyons and low-satellite conditions.',
    up2Title: 'Foam + pressure switching in the air', up2Desc: 'Switch between foam and pressure rinse without landing for nozzle changes.',
    up3Title: 'Remote pump start/stop', up3Desc: 'The pilot starts or stops the ground pump from the remote controller.',
    up4Title: 'C80P power upgrade to 120 m', up4Desc: 'A stronger power configuration supports high-rise facade projects up to 120 m.',
    up5Title: 'Remote ID ready', up5Desc: 'Standard support for markets moving toward real-time drone identification.',
    up6Title: 'Optional parachute integration', up6Desc: 'Additional risk mitigation for projects or markets that require it.',
    appEyebrow: 'SURFACE-SPECIFIC CLEANING', appTitle: 'Clean more than glass',
    appIntro: 'Foam application, pressure rinse, fan nozzles and soft-wash workflows let operators adjust to glass, coated metal, stone, concrete, billboards, roofs and selected rooftop solar.',
    specsEyebrow: 'TECHNICAL OVERVIEW', specsTitle: 'Facade cleaning drone technical specifications',
    specsNote: 'Final delivered configuration may vary by pump, hose, GNSS/RTK, Remote ID, parachute, battery plan and local compliance requirements. C80P projects near 120 m may require site-specific hose planning, pump placement or extended hose configuration.',
    labels: ['Model', 'Wheelbase', 'Dimensions', 'Weight & protection', 'Operating envelope', 'Water supply & hose', 'Nozzles & standoff', 'Cleaning productivity', 'Project height', 'Flight modes & controller', 'Positioning & compliance', 'Battery & charging', 'Endurance'],
    values: [
      'EAUAV Vertex C80/C80P facade cleaning drone',
      '1500 mm',
      'Folded 740 × 740 × 610 mm; unfolded 1060 × 1060 × 610 mm (props folded) / 2420 × 2420 × 610 mm (props unfolded)',
      '< 15 kg; IP65 rating',
      'Max speed < 10 m/s; wind resistance 11 m/s; -10°C to 40°C; 0–90% humidity',
      'Standard hose 100 m; max pump pressure up to 200 bar / 3000 psi; spray flow 15 L/min',
      '0° / 15° / 25° / 40° fan + foam nozzle; standoff typically 2–3 m',
      'Deep cleaning up to 500 m²/hr; light cleaning up to 1,000 m²/hr; 400–500 m² per charge',
      'C80 up to 80 m; C80P up to 120 m; above 120 m case-by-case review',
      'Manual / A-B Route / Area Mode; 7-inch screen remote controller',
      'GNSS / RTK support; Remote ID standard/market-ready; parachute optional',
      '14S 46000 mAh battery; about 40 min with fast charger',
      'Approx. 45 min, condition-dependent; 2–3 battery rotation recommended'
    ],
    faqEyebrow: 'SUPPORT & PROCUREMENT', faqTitle: 'Frequently asked questions',
    sourceNote: 'Technical information is based on the EAUAV official Vertex C80/C80P product page. Confirm current specifications, configuration and availability with the manufacturer before procurement.',
    inquiryEyebrow: 'PROJECT PLANNING', inquiryTitle: 'Tell us about your building and surface.',
    inquiryText: 'Share your building height, surface type, water access, hose route and documentation needs. Our team will follow up to prepare a project-fit quotation.',
    disclaimer: 'Local flight permissions, operating approvals, insurance and site SOP remain the operator’s responsibility.'
  },
  de: {
    seoTitle: 'EAUAV Vertex C80/C80P Fassadenreinigungsdrohne | DroneWorld', homeLabel: 'Startseite', productsLabel: 'Produkte',
    eyebrow: 'WASSERGEFÜRTES FASSADENREINIGUNGSSYSTEM', title: 'Revolutionieren Sie die Fassadenreinigung mit Drohnen.',
    lead: 'Das EAUAV Vertex C80/C80P ist ein komplettes, wassergeführtes Reinigungsdrohnensystem für Glasfassaden, Hochhausfenster, Außenwände, Werbetafeln, Dächer und ausgewählte Dach-Solaranlagen — für Gebäude bis 120 m.',
    cta: 'Angebot anfordern', backLabel: 'Produkte',
    stat1: 'Flugzeit pro Ladung', stat2: 'Max. Projekthöhe (C80P)', stat3: 'Schnelle Reinigungsrate',
    visual: 'Vertex C80 reinigt eine Hochhaus-Glasfassade', visualNote: 'Batteriebetriebener Flug, Wasser über eine Bodenpumpe und einen Schlauch geliefert.',
    caveat: 'Veröffentlichte Werte hängen von Konfiguration und Bedingungen ab. Bestätigen Sie die gelieferte Konfiguration, Pumpe, Schlauch und Compliance-Anforderungen vor der Beschaffung.',
    sectionEyebrow: 'DRONEWORLD PRODUKTÜBERBLICK', overview: 'Was ist das EAUAV Vertex C80/C80P?',
    intro: 'Ein CE-zertifiziertes, wassergeführtes Fassadenreinigungsdrohnensystem für die gewerbliche Gebäudereinigung. Die Drohne fliegt batteriebetrieben, während Wasser oder zugelassene Reinigungslösung von einer Bodenpumpe über einen Schlauch geliefert wird. C80 eignet sich für die routinemäßige Fassaden- und Dachreinigung; C80P unterstützt Hochhausprojekte bis 120 m. Projekte über 120 m werden einzeln geprüft.',
    feature1Title: 'Sichererer Ablauf', feature1Desc: 'Reduzieren Sie die Exposition durch Seilzugang und halten Sie Teams von Hängeplattformen fern.',
    feature2Title: 'Schnellerer Aufbau', feature2Desc: 'Beginnen Sie ohne Gerüst — ein schlanker Pilot plus Bodencrew verkürzt die Aufbauzeit.',
    feature3Title: 'Geringere Projektkosten', feature3Desc: 'Decken Sie mehr Fläche mit kleinerer Crew ab und steigern Sie die Marge.',
    archEyebrow: 'WASSERGEFÜHRTE ARCHITEKTUR', archTitle: 'So funktioniert das wassergeführte C80/C80P-System',
    archIntro: 'Wasser, Reinigungsmittel und Pumpengewicht bleiben am Boden. Die Drohne fliegt batteriebetrieben und trägt nur Ausleger und Düsen, was das Fluggerät leichter und praktischer macht.',
    arch1: 'Wasserquelle', arch1Desc: 'Leitung, Tank, Lkw oder zugelassene Reinigungslösung.',
    arch2: 'Bodenpumpe', arch2Desc: 'Erzeugt Druck für die Fassadenreinigung.',
    arch3: 'Wasserschlauch', arch3Desc: 'Versorgt den Sprühausleger der Drohne.',
    arch4: 'C80-Drohne', arch4Desc: 'Fliegt batteriebetrieben und trägt das Sprühsystem.',
    arch5: 'Pilotensteuerung', arch5Desc: 'Steuert Flug, Abstand, Düsenmodus und Pumpenstart/-stopp.',
    arch6: 'Bodencrew', arch6Desc: 'Verwaltet Schlauch, Pumpe, Wasserquelle und Sicherheitszone.',
    cleanEyebrow: 'AERO-CLEANSE™-SYSTEM', cleanTitle: 'Was das Vertex C80/C80P antreibt',
    cleanIntro: 'Drei Kernebenen — Drohnenplattform, batteriebetriebenes Flugsystem und Aero-Cleanse™-Reinigungsystem — verbinden Bodenpumpe, Schlauch, Ausleger, Schaumbüse und Druckdüsen zu einem praktischen Ablauf.',
    nozzleTitle: 'Wechselbare Düsen', nozzleDesc: 'Schäume-, 0°-, 15°-, 25°- und 40°-Fächerdüsen decken Reinigungsmittel, hartnäckige Stellen, schmale Streifen, allgemeine Reinigung und Niederdruck ab.',
    enduranceTitle: '45 Minuten lange Flugzeit', enduranceDesc: 'Hochleistungs-Schnellwechselbatterien liefern bis zu 45 Minuten Flug. Ein 2–3-Batterie-Rotationsplan hält den Betrieb mit minimalen Ausfallzeiten aufrecht.',
    modesEyebrow: 'INTELLIGENTE FLUGMODI', modesTitle: 'Pilotüberwachte intelligente Flugmodi',
    modesIntro: 'Der Pilot behält die Kontrolle und kann jederzeit pausieren, eingreifen oder das Sprühen stoppen.',
    mode1Title: 'Manueller Modus', mode1Desc: 'Volle manuelle Kontrolle für Punktreinigung, Kanten, Ecken, Balkone und Detailkorrekturen.',
    mode2Title: 'Unterstützter A-B-Pass', mode2Desc: 'Halbautomatische vertikale Reinigungsdurchgänge für regelmäßige flache Fassaden unter Pilotaufsicht.',
    mode3Title: 'Pilotüberwachter Flächenmodus', mode3Desc: 'Grenzpunkte markieren, Routenabstand und Tempo setzen und wiederholte Durchgänge mit Pilotaufsicht fahren.',
    safetyEyebrow: 'SICHERHEITSFUNKTIONEN', safetyTitle: 'Sicherheit bei der Reinigung nahe am Gebäude',
    safetyIntro: 'Die Fassadenreinigung erfolgt nah am Gebäude in der Nähe von Glas, Ecken, Vorsprüngen, Schlauchlasten und Fußgängern. C80/C80P bietet pilotüberwachte Sicherheitsfunktionen.',
    safety1Title: 'Zuverlässige GNSS/RTK-Positionierung', safety1Desc: 'Dual-GNSS/RTK-Architektur, Hochgewinn-Antennen und zentimetergenaue Positionierung verbessern die Zuverlässigkeit in anspruchsvollen Stadtumgebungen.',
    safety2Title: 'Auto-Abstand und FPV-Unterstützung', safety2Desc: 'Auto-Abstandshilfe und FPV-Gimbalansicht helfen, einen konfigurierbaren Abstand zur Fassade zu halten.',
    safety3Title: 'Konfigurierbare Failsafes und optionaler Fallschirm', safety3Desc: 'Hover, Steigen oder Rückflug können für niedrigen Akku oder Signalverlust konfiguriert werden. Ein optionaler Fallschirm bietet zusätzliche Risikominderung.',
    upgradeEyebrow: 'NEU 2026', upgradeTitle: '2026-Upgrades für echte Reinigungsprobleme',
    upgradeIntro: 'Das 2026-System wurde um reale Baustellenprobleme herum verbessert: schwache Satellitensignale, Düsenwechsel, Kommunikation, Compliance-Dokumente, Wartung und höhere Projekte.',
    up1Title: 'Verbesserte GNSS/RTK-Stabilität', up1Desc: 'Duale Hochgewinn-Antennen verbessern die Positionierung in engen Straßen und urbanen Schluchten.',
    up2Title: 'Schaum + Druckwechsel in der Luft', up2Desc: 'Wechseln Sie ohne Landung zwischen Schaum und Druckspülung.',
    up3Title: 'Fernstart/-stopp der Pumpe', up3Desc: 'Der Pilot startet oder stoppt die Bodenpumpe über die Fernsteuerung.',
    up4Title: 'C80P-Leistungsupgrade auf 120 m', up4Desc: 'Eine stärkere Leistungskonfiguration unterstützt Hochhausprojekte bis 120 m.',
    up5Title: 'Remote ID bereit', up5Desc: 'Standardunterstützung für Märkte mit Echtzeit-Drohnenidentifikation.',
    up6Title: 'Optionale Fallschirm-Integration', up6Desc: 'Zusätzliche Risikominderung für Projekte oder Märkte, die dies erfordern.',
    appEyebrow: 'OBERFLÄCHENSPEZIFISCHE REINIGUNG', appTitle: 'Mehr als Glas reinigen',
    appIntro: 'Schaum, Druckspülung, Fächerdüsen und Soft-Wash-Abläufe ermöglichen die Anpassung an Glas, beschichtetes Metall, Stein, Beton, Werbetafeln, Dächer und ausgewählte Dach-Solaranlagen.',
    specsEyebrow: 'TECHNISCHER ÜBERBLICK', specsTitle: 'Technische Spezifikationen der Fassadenreinigungsdrohne',
    specsNote: 'Die endgültige Konfiguration kann je nach Pumpe, Schlauch, GNSS/RTK, Remote ID, Fallschirm, Batterieplan und lokalen Anforderungen variieren. C80P-Projekte nahe 120 m können eine standortspezifische Schlauchplanung erfordern.',
    labels: ['Modell', 'Radstand', 'Abmessungen', 'Gewicht & Schutz', 'Betriebsbereich', 'Wasserversorgung & Schlauch', 'Düsen & Abstand', 'Reinigungsleistung', 'Projekthöhe', 'Flugmodi & Steuerung', 'Positionierung & Compliance', 'Batterie & Laden', 'Flugzeit'],
    values: [
      'EAUAV Vertex C80/C80P Fassadenreinigungsdrohne',
      '1500 mm',
      'Gefaltet 740 × 740 × 610 mm; entfaltet 1060 × 1060 × 610 mm / 2420 × 2420 × 610 mm',
      '< 15 kg; IP65',
      'Max. Tempo < 10 m/s; Wind 11 m/s; -10°C bis 40°C; 0–90% Luftfeuchte',
      'Schlauch 100 m; max. Pumpendruck bis 200 bar / 3000 psi; 15 L/min',
      '0° / 15° / 25° / 40° Fächer + Schaumbüse; Abstand ca. 2–3 m',
      'Tiefenreinigung bis 500 m²/h; leicht bis 1.000 m²/h; 400–500 m² pro Ladung',
      'C80 bis 80 m; C80P bis 120 m; über 120 m Einzelfallprüfung',
      'Manuell / A-B-Route / Flächenmodus; 7-Zoll-Fernsteuerung',
      'GNSS / RTK; Remote ID Standard; Fallschirm optional',
      '14S 46000 mAh; ca. 40 Min. mit Schnellladegerät',
      'Ca. 45 Min.; 2–3-Batterie-Rotation empfohlen'
    ],
    faqEyebrow: 'SUPPORT & BESCHAFFUNG', faqTitle: 'Häufig gestellte Fragen',
    sourceNote: 'Technische Angaben basieren auf der offiziellen EAUAV-Vertex-C80/C80P-Produktseite. Aktuelle Spezifikationen, Konfiguration und Verfügbarkeit sind mit dem Hersteller zu bestätigen.',
    inquiryEyebrow: 'PROJEKTPLANUNG', inquiryTitle: 'Erzählen Sie uns von Gebäude und Oberfläche.',
    inquiryText: 'Teilen Sie uns Gebäudehöhe, Oberflächentyp, Wasserzugang, Schlauchroute und Dokumentationsbedarf mit. Unser Team erstellt ein passendes Angebot.',
    disclaimer: 'Lokale Fluggenehmigungen, Betriebszulassungen, Versicherung und Standort-SOP liegen in der Verantwortung des Betreibers.'
  },
  es: {
    seoTitle: 'EAUAV Vertex C80/C80P Dron de limpieza de fachadas | DroneWorld', homeLabel: 'Inicio', productsLabel: 'Productos',
    eyebrow: 'SISTEMA DE LIMPIEZA DE FACHADAS CON AGUA', title: 'Revoluciona la limpieza de fachadas con drones.',
    lead: 'El EAUAV Vertex C80/C80P es un sistema completo de limpieza de fachadas alimentado por agua para fachadas de vidrio, ventanas de altura, muros exteriores, vallas publicitarias, cubiertas y determinados proyectos solares en azoteas, para edificios de hasta 120 m.',
    cta: 'Solicitar presupuesto', backLabel: 'Productos',
    stat1: 'Autonomía por carga', stat2: 'Altura máx. de proyecto (C80P)', stat3: 'Rendimiento de limpieza rápida',
    visual: 'Vertex C80 limpiando una fachada de vidrio de gran altura', visualNote: 'Vuelo por batería, agua suministrada desde una bomba en tierra por una manguera.',
    caveat: 'Las cifras publicadas dependen de la configuración y las condiciones. Confirme la configuración entregada, la bomba, la manguera y los requisitos de cumplimiento antes de comprar.',
    sectionEyebrow: 'DESCRIPCIÓN DEL PRODUCTO DRONEWORLD', overview: '¿Qué es el EAUAV Vertex C80/C80P?',
    intro: 'Un sistema de limpieza de fachadas con agua certificado CE para la limpieza comercial de edificios. El dron vuela con batería mientras el agua o la solución de limpieza aprobada se suministra desde una bomba en tierra por una manguera. C80 se adapta a la limpieza rutinaria de fachadas y cubiertas; C80P admite proyectos de gran altura hasta 120 m. Los proyectos de más de 120 m se revisan caso por caso.',
    feature1Title: 'Flujo más seguro', feature1Desc: 'Reduzca la exposición al acceso por cuerda y mantenga a los equipos fuera de plataformas suspendidas.',
    feature2Title: 'Montaje más rápido', feature2Desc: 'Empiece a limpiar sin andamios: un piloto ágil más equipo de tierra acorta el montaje.',
    feature3Title: 'Menor coste de trabajo', feature3Desc: 'Cubra más superficie con menos personal y amplíe el margen de cada proyecto.',
    archEyebrow: 'ARQUITECTURA CON AGUA', archTitle: 'Cómo funciona el sistema C80/C80P con agua',
    archIntro: 'El agua, el detergente y el peso de la bomba permanecen en tierra. El dron vuela con batería y solo lleva el brazo y las boquillas, lo que lo hace más ligero y práctico.',
    arch1: 'Fuente de agua', arch1Desc: 'Grifo, tanque, camión o solución de limpieza aprobada.',
    arch2: 'Bomba en tierra', arch2Desc: 'Presuriza el agua para la limpieza de fachadas.',
    arch3: 'Manguera de agua', arch3Desc: 'Suministra agua al brazo rociador del dron.',
    arch4: 'Dron C80', arch4Desc: 'Vuela con batería y lleva el sistema de rociado.',
    arch5: 'Control del piloto', arch5Desc: 'Controla vuelo, distancia, modo de boquilla y arranque/parada de bomba.',
    arch6: 'Equipo de tierra', arch6Desc: 'Gestiona manguera, bomba, fuente de agua y perímetro de seguridad.',
    cleanEyebrow: 'SISTEMA AERO-CLEANSE™', cleanTitle: 'Qué hace funcionar al Vertex C80/C80P',
    cleanIntro: 'Tres capas — plataforma del dron, sistema de vuelo por batería y sistema de limpieza Aero-Cleanse™ — conectan bomba, manguera, brazo, boquilla de espuma y boquillas de presión en un flujo práctico.',
    nozzleTitle: 'Boquillas intercambiables', nozzleDesc: 'Boquillas de espuma, 0°, 15°, 25° y 40° cubren detergente, manchas, franjas estrechas, limpieza general y baja presión.',
    enduranceTitle: '45 minutos de autonomía', enduranceDesc: 'Baterías inteligentes de intercambio rápido ofrecen hasta 45 minutos de vuelo. Una rotación de 2–3 baterías mantiene la operación con mínimo tiempo de inactividad.',
    modesEyebrow: 'MODOS DE VUELO INTELIGENTES', modesTitle: 'Modos de vuelo inteligentes supervisados por el piloto',
    modesIntro: 'El piloto mantiene el control y puede pausar, anular o detener el rociado en cualquier momento.',
    mode1Title: 'Modo manual', mode1Desc: 'Control manual total para limpieza puntual, bordes, esquinas, balcones y retoques.',
    mode2Title: 'Ruta A-B asistida', mode2Desc: 'Pasadas verticales semic automáticas para fachadas planas regulares bajo supervisión.',
    mode3Title: 'Modo de área supervisado', mode3Desc: 'Marque puntos límite, ajuste separación y velocidad y ejecute pasadas repetidas con supervisión.',
    safetyEyebrow: 'FUNCIONES DE SEGURIDAD', safetyTitle: 'Seguridad en la limpieza cerca del edificio',
    safetyIntro: 'La limpieza de fachadas es un vuelo cercano al edificio, junto a vidrio, esquinas, salientes, carga de manguera y peatones. C80/C80P incluye funciones de seguridad supervisadas por el piloto.',
    safety1Title: 'Posicionamiento GNSS/RTK fiable', safety1Desc: 'Arquitectura dual GNSS/RTK, antenas de alta ganancia y posicionamiento centimétrico mejoran la fiabilidad en entornos urbanos difíciles.',
    safety2Title: 'Distancia automática y asistencia FPV', safety2Desc: 'La asistencia de distancia y la vista FPV ayudan a mantener una distancia configurable de la fachada.',
    safety3Title: 'Failsafes configurables y paracaídas opcional', safety3Desc: 'Hover, Ascender o Return-to-Home se configuran ante batería baja o pérdida de señal. El paracaídas opcional añade mitigación.',
    upgradeEyebrow: 'NOVEDADES 2026', upgradeTitle: 'Mejoras 2026 que resuelven problemas reales',
    upgradeIntro: 'El sistema 2026 se mejora en torno a problemas reales: señales débiles, cambios de boquilla, comunicación, documentación, mantenimiento y proyectos más altos.',
    up1Title: 'Estabilidad GNSS/RTK mejorada', up1Desc: 'Antenas duales de alta ganancia mejoran el posicionamiento en calles estrechas y cañones urbanos.',
    up2Title: 'Cambio espuma + presión en el aire', up2Desc: 'Cambie entre espuma y enjuague a presión sin aterrizar.',
    up3Title: 'Arranque/parada remoto de bomba', up3Desc: 'El piloto arranca o detiene la bomba desde el mando.',
    up4Title: 'Mejora de potencia C80P a 120 m', up4Desc: 'Una configuración más potente admite proyectos de gran altura hasta 120 m.',
    up5Title: 'Remote ID listo', up5Desc: 'Soporte estándar para mercados con identificación en tiempo real.',
    up6Title: 'Integración opcional de paracaídas', up6Desc: 'Mitigación adicional para proyectos o mercados que lo requieran.',
    appEyebrow: 'LIMPIEZA SEGÚN SUPERFICIE', appTitle: 'Limpie más que vidrio',
    appIntro: 'Espuma, enjuague a presión, boquillas en abanico y flujos soft-wash permiten adaptarse a vidrio, metal pintado, piedra, hormigón, vallas, cubiertas y solar en azoteas.',
    specsEyebrow: 'RESUMEN TÉCNICO', specsTitle: 'Especificaciones técnicas del dron de limpieza de fachadas',
    specsNote: 'La configuración final puede variar según bomba, manguera, GNSS/RTK, Remote ID, paracaídas, plan de baterías y cumplimiento local. Los proyectos C80P cerca de 120 m pueden requerir planificación específica de manguera.',
    labels: ['Modelo', 'Distancia entre ruedas', 'Dimensiones', 'Peso y protección', 'Entorno operativo', 'Agua y manguera', 'Boquillas y distancia', 'Productividad', 'Altura de proyecto', 'Modos y mando', 'Posicionamiento y cumplimiento', 'Batería y carga', 'Autonomía'],
    values: [
      'Dron de limpieza de fachadas EAUAV Vertex C80/C80P',
      '1500 mm',
      'Plegado 740 × 740 × 610 mm; desplegado 1060 × 1060 × 610 mm / 2420 × 2420 × 610 mm',
      '< 15 kg; IP65',
      'Vel. máx. < 10 m/s; viento 11 m/s; -10°C a 40°C; 0–90% humedad',
      'Manguera 100 m; presión máx. hasta 200 bar / 3000 psi; 15 L/min',
      '0° / 15° / 25° / 40° abanico + espuma; distancia ~2–3 m',
      'Limpieza profunda hasta 500 m²/h; ligera hasta 1.000 m²/h; 400–500 m² por carga',
      'C80 hasta 80 m; C80P hasta 120 m; >120 m revisión caso por caso',
      'Manual / Ruta A-B / Área; mando de pantalla de 7 pulgadas',
      'GNSS / RTK; Remote ID estándar; paracaídas opcional',
      'Batería 14S 46000 mAh; ~40 min con cargador rápido',
      'Aprox. 45 min; rotación de 2–3 baterías recomendada'
    ],
    faqEyebrow: 'SOPORTE Y ADQUISICIONES', faqTitle: 'Preguntas frecuentes',
    sourceNote: 'La información técnica se basa en la página oficial de EAUAV Vertex C80/C80P. Confirme especificaciones, configuración y disponibilidad con el fabricante.',
    inquiryEyebrow: 'PLANIFICACIÓN DEL PROYECTO', inquiryTitle: 'Cuéntanos sobre tu edificio y superficie.',
    inquiryText: 'Comparte altura del edificio, tipo de superficie, acceso al agua, ruta de manguera y necesidades de documentación. Prepararemos un presupuesto a medida.',
    disclaimer: 'Los permisos de vuelo locales, las aprobaciones, el seguro y el SOP del sitio son responsabilidad del operador.'
  },
  fr: {
    seoTitle: 'EAUAV Vertex C80/C80P Drone de nettoyage de façades | DroneWorld', homeLabel: 'Accueil', productsLabel: 'Produits',
    eyebrow: 'SYSTÈME DE NETTOYAGE DE FAÇADES À EAU', title: 'Révolutionnez le nettoyage de façades avec les drones.',
    lead: 'L’EAUAV Vertex C80/C80P est un système complet de nettoyage de façades alimenté en eau pour vitrages, fenêtres en hauteur, murs extérieurs, panneaux d’affichage, toitures et certains projets solaires en toiture — pour des bâtiments jusqu’à 120 m.',
    cta: 'Demander un devis', backLabel: 'Produits',
    stat1: 'Autonomie par charge', stat2: 'Hauteur max. (C80P)', stat3: 'Débit de nettoyage rapide',
    visual: 'Vertex C80 nettoyant une façade vitrée de grande hauteur', visualNote: 'Vol sur batterie, eau fournie depuis une pompe au sol par un tuyau.',
    caveat: 'Les chiffres publiés dépendent de la configuration et des conditions. Confirmez la configuration livrée, la pompe, le tuyau et les exigences de conformité avant l’achat.',
    sectionEyebrow: 'APERÇU DU PRODUIT DRONEWORLD', overview: 'Qu’est-ce que l’EAUAV Vertex C80/C80P ?',
    intro: 'Un système de nettoyage de façades à eau certifié CE pour l’entretien commercial des bâtiments. Le drone vole sur batterie tandis que l’eau ou la solution de nettoyage approuvée est fournie par une pompe au sol via un tuyau. Le C80 convient au nettoyage courant de façades et de toitures ; le C80P prend en charge les projets en hauteur jusqu’à 120 m. Au-delà de 120 m, étude au cas par cas.',
    feature1Title: 'Flux plus sûr', feature1Desc: 'Réduisez l’exposition à l’accès sur corde et gardez les équipes hors des plateformes suspendues.',
    feature2Title: 'Installation plus rapide', feature2Desc: 'Commencez sans échafaudage — un pilote et une équipe au sol réduisent le temps d’installation.',
    feature3Title: 'Coût de chantier réduit', feature3Desc: 'Couvrez plus de surface avec moins de personnel et augmentez votre marge.',
    archEyebrow: 'ARCHITECTURE À EAU', archTitle: 'Comment fonctionne le système C80/C80P à eau',
    archIntro: 'L’eau, le détergent et le poids de la pompe restent au sol. Le drone vole sur batterie et ne porte que le bras et les buses, ce qui le rend plus léger et pratique.',
    arch1: 'Source d’eau', arch1Desc: 'Robinet, réservoir, camion ou solution de nettoyage approuvée.',
    arch2: 'Pompe au sol', arch2Desc: 'Met l’eau sous pression pour le nettoyage de façades.',
    arch3: 'Tuyau d’eau', arch3Desc: 'Alimente le bras de pulvérisation du drone.',
    arch4: 'Drone C80', arch4Desc: 'Vole sur batterie et porte le système de pulvérisation.',
    arch5: 'Contrôle du pilote', arch5Desc: 'Contrôle le vol, la distance, le mode de buse et le démarrage/arrêt de la pompe.',
    arch6: 'Équipe au sol', arch6Desc: 'Gère le tuyau, la pompe, la source d’eau et le périmètre de sécurité.',
    cleanEyebrow: 'SYSTÈME AERO-CLEANSE™', cleanTitle: 'Ce qui fait fonctionner le Vertex C80/C80P',
    cleanIntro: 'Trois couches — plateforme du drone, système de vol sur batterie et système de nettoyage Aero-Cleanse™ — relient pompe, tuyau, bras, buse mousse et buses de pression en un flux pratique.',
    nozzleTitle: 'Buses interchangeables', nozzleDesc: 'Buses mousse, 0°, 15°, 25° et 40° couvrent détergent, taches, bandes étroites, nettoyage général et basse pression.',
    enduranceTitle: '45 minutes d’autonomie', enduranceDesc: 'Des batteries intelligentes à échange rapide offrent jusqu’à 45 minutes de vol. Une rotation de 2–3 batteries maintient l’activité avec un temps d’arrêt minimal.',
    modesEyebrow: 'MODES DE VOL INTELLIGENTS', modesTitle: 'Modes de vol intelligents supervisés par le pilote',
    modesIntro: 'Le pilote garde le contrôle et peut suspendre, annuler ou arrêter la pulvérisation à tout moment.',
    mode1Title: 'Mode manuel', mode1Desc: 'Contrôle manuel complet pour le nettoyage ponctuel, les bords, coins, balcons et retouches.',
    mode2Title: 'Trajet A-B assisté', mode2Desc: 'Passages verticaux semi-automatiques pour façades plates régulières sous supervision.',
    mode3Title: 'Mode zone supervisé', mode3Desc: 'Marquez les points de limite, réglez l’espacement et la vitesse, puis exécutez des passages répétés.',
    safetyEyebrow: 'FONCTIONS DE SÉCURITÉ', safetyTitle: 'Sécurité pour le nettoyage près du bâtiment',
    safetyIntro: 'Le nettoyage de façades est un vol près du bâtiment, à proximité du verre, des angles, des saillies, des charges de tuyau et des piétons. Le C80/C80P intègre des fonctions de sécurité supervisées par le pilote.',
    safety1Title: 'Positionnement GNSS/RTK fiable', safety1Desc: 'Architecture double GNSS/RTK, antennes à gain élevé et positionnement centimétrique améliorent la fiabilité en milieu urbain difficile.',
    safety2Title: 'Distance automatique et aide FPV', safety2Desc: 'L’aide à la distance et la vue FPV aident à maintenir une distance configurable de la façade.',
    safety3Title: 'Failsafes configurables et parachute optionnel', safety3Desc: 'Hover, Ascension ou Retour au point de départ se configurent en cas de batterie faible ou de perte de signal. Le parachute optionnel ajoute une atténuation.',
    upgradeEyebrow: 'NOUVEAUTÉS 2026', upgradeTitle: 'Améliorations 2026 pour de vrais problèmes',
    upgradeIntro: 'Le système 2026 est amélioré autour de problèmes réels : signaux faibles, changements de buse, communication, documents, maintenance et projets plus hauts.',
    up1Title: 'Stabilité GNSS/RTK améliorée', up1Desc: 'Antennes doubles à gain élevé améliorant le positionnement en rues étroites et canyons urbains.',
    up2Title: 'Bascule mousse + pression en vol', up2Desc: 'Passez de la mousse au rinçage sous pression sans atterrir.',
    up3Title: 'Démarrage/arrêt de pompe à distance', up3Desc: 'Le pilote démarre ou arrête la pompe depuis la radiocommande.',
    up4Title: 'Montée en puissance C80P à 120 m', up4Desc: 'Une configuration plus puissante prend en charge les projets jusqu’à 120 m.',
    up5Title: 'Remote ID prêt', up5Desc: 'Prise en charge standard pour les marchés exigeant une identification en temps réel.',
    up6Title: 'Intégration parachute optionnelle', up6Desc: 'Atténuation supplémentaire pour les projets ou marchés qui l’exigent.',
    appEyebrow: 'NETTOYAGE PAR SURFACE', appTitle: 'Nettoyez plus que du verre',
    appIntro: 'Mousse, rinçage sous pression, buses en éventail et flux soft-wash permettent de s’adapter au verre, métal peint, pierre, béton, panneaux, toitures et solaire en toiture.',
    specsEyebrow: 'APERÇU TECHNIQUE', specsTitle: 'Spécifications techniques du drone de nettoyage de façades',
    specsNote: 'La configuration finale peut varier selon la pompe, le tuyau, le GNSS/RTK, le Remote ID, le parachute, le plan de batteries et la conformité locale. Les projets C80P proches de 120 m peuvent nécessiter une planification de tuyau spécifique.',
    labels: ['Modèle', 'Empattement', 'Dimensions', 'Poids et protection', 'Enveloppe opérationnelle', 'Eau et tuyau', 'Buses et distance', 'Productivité', 'Hauteur de projet', 'Modes et radiocommande', 'Positionnement et conformité', 'Batterie et charge', 'Autonomie'],
    values: [
      'Drone de nettoyage de façades EAUAV Vertex C80/C80P',
      '1500 mm',
      'Plié 740 × 740 × 610 mm ; déployé 1060 × 1060 × 610 mm / 2420 × 2420 × 610 mm',
      '< 15 kg ; IP65',
      'Vitesse max. < 10 m/s ; vent 11 m/s ; -10°C à 40°C ; 0–90% humidité',
      'Tuyau 100 m ; pression max. jusqu’à 200 bar / 3000 psi ; 15 L/min',
      '0° / 15° / 25° / 40° éventail + mousse ; distance ~2–3 m',
      'Nettoyage profond jusqu’à 500 m²/h ; léger jusqu’à 1 000 m²/h ; 400–500 m² par charge',
      'C80 jusqu’à 80 m ; C80P jusqu’à 120 m ; >120 m étude au cas par cas',
      'Manuel / Trajet A-B / Zone ; radiocommande écran 7 pouces',
      'GNSS / RTK ; Remote ID standard ; parachute optionnel',
      'Batterie 14S 46000 mAh ; ~40 min avec chargeur rapide',
      'Env. 45 min ; rotation de 2–3 batteries recommandée'
    ],
    faqEyebrow: 'SUPPORT ET ACHATS', faqTitle: 'Questions fréquentes',
    sourceNote: 'Les informations techniques proviennent de la page officielle EAUAV Vertex C80/C80P. Confirmez les spécifications, la configuration et la disponibilité auprès du fabricant.',
    inquiryEyebrow: 'PLANIFICATION DU PROJET', inquiryTitle: 'Parlez-nous de votre bâtiment et de sa surface.',
    inquiryText: 'Indiquez la hauteur du bâtiment, le type de surface, l’accès à l’eau, le trajet du tuyau et les besoins documentaires. Nous préparerons un devis adapté.',
    disclaimer: 'Les autorisations de vol locales, les approbations, l’assurance et le SOP du site restent la responsabilité de l’opérateur.'
  }
}
const c = computed(() => messages[lang.value as keyof typeof messages] || messages.en)
const faqByLocale = {
  en: [
    { q: 'What is the EAUAV Vertex C80/C80P facade cleaning drone?', a: 'It is a CE-certified hose-fed cleaning drone system for commercial facade, high-rise window, roof, billboard and selected rooftop solar cleaning. The drone flies on battery while water or approved cleaning solution is supplied from a ground pump through a hose.' },
    { q: 'What is the difference between C80 and C80P?', a: 'C80 is the practical choice for routine facade, window, roof and billboard cleaning. C80P adds a stronger power configuration that supports high-rise facade projects up to 120 m.' },
    { q: 'Can C80P clean buildings up to 120 m?', a: 'Yes. C80P is configured for projects up to 120 m. Projects above 120 m are reviewed case by case with a site-specific engineering plan.' },
    { q: 'Is this a complete system or only a drone?', a: 'A complete system can include the drone, remote controller, ground pump, 100 m hose, foam and pressure nozzles, batteries, charger, training, SOP, CE documents and after-sales support.' },
    { q: 'Does the drone carry water onboard?', a: 'No. In the standard facade configuration there is no onboard water tank. Water is supplied from a ground pump through a hose, keeping the aircraft lighter.' },
    { q: 'Can the drone switch between foam and pressure without landing?', a: 'Yes. The 2026 system supports in-air switching between foam application and pressure rinse without landing for nozzle changes.' },
    { q: 'Can the pilot start and stop the ground pump remotely?', a: 'Yes. The pilot can start or stop the ground pump from the remote controller, reducing communication friction with the ground crew.' },
    { q: 'Can C80/C80P clean rooftop solar panels?', a: 'With the optional Solar/Rooftop Kit it can support selected rooftop solar, low-rise roofs and parapets where water access and hose routing are practical.' },
    { q: 'Is a parachute included?', a: 'Parachute integration is optional and available for projects or markets requiring additional risk mitigation.' }
  ],
  de: [
    { q: 'Was ist die EAUAV Vertex C80/C80P Fassadenreinigungsdrohne?', a: 'Ein CE-zertifiziertes, wassergeführtes Reinigungsdrohnensystem für gewerbliche Fassaden, Hochhausfenster, Dächer, Werbetafeln und ausgewählte Dach-Solaranlagen. Die Drohne fliegt batteriebetrieben, Wasser wird über eine Bodenpumpe und einen Schlauch geliefert.' },
    { q: 'Was unterscheidet C80 und C80P?', a: 'C80 ist für die routinemäßige Fassaden-, Fenster-, Dach- und Werbetafelreinigung gedacht. C80P bietet eine stärkere Leistungskonfiguration für Hochhausprojekte bis 120 m.' },
    { q: 'Kann C80P Gebäude bis 120 m reinigen?', a: 'Ja. C80P ist für Projekte bis 120 m konfiguriert. Projekte über 120 m werden einzeln mit einem standortspezifischen Plan geprüft.' },
    { q: 'Ist dies ein komplettes System oder nur eine Drohne?', a: 'Ein komplettes System kann Drohne, Fernsteuerung, Bodenpumpe, 100-m-Schlauch, Schaum- und Druckdüsen, Batterien, Ladegerät, Schulung, SOP, CE-Dokumente und After-Sales-Support umfassen.' },
    { q: 'Trägt die Drohne Wasser an Bord?', a: 'Nein. In der Standard-Fassadenkonfiguration gibt es keinen Wassertank an Bord. Wasser kommt von einer Bodenpumpe über einen Schlauch.' },
    { q: 'Kann die Drohne ohne Landung zwischen Schaum und Druck wechseln?', a: 'Ja. Das 2026-System unterstützt den Wechsel in der Luft zwischen Schaum und Druckspülung ohne Landung.' },
    { q: 'Kann der Pilot die Bodenpumpe fernstarten und -stoppen?', a: 'Ja. Der Pilot kann die Bodenpumpe über die Fernsteuerung starten und stoppen.' },
    { q: 'Kann C80/C80P Dach-Solaranlagen reinigen?', a: 'Mit dem optionalen Solar-/Dach-Kit kann es ausgewählte Dach-Solaranlagen, Flachdächer und Brüstungen unterstützen, sofern Wasserzugang und Schlauchrouting praktikabel sind.' },
    { q: 'Ist ein Fallschirm enthalten?', a: 'Die Fallschirm-Integration ist optional und für Projekte oder Märkte mit zusätzlichen Risikominderungsanforderungen verfügbar.' }
  ],
  es: [
    { q: '¿Qué es el dron de limpieza de fachadas EAUAV Vertex C80/C80P?', a: 'Es un sistema de limpieza alimentado por agua certificado CE para fachadas comerciales, ventanas de altura, cubiertas, vallas y determinados proyectos solares en azoteas. El dron vuela con batería mientras el agua se suministra desde una bomba en tierra por una manguera.' },
    { q: '¿Cuál es la diferencia entre C80 y C80P?', a: 'C80 es la opción práctica para limpieza rutinaria de fachadas, ventanas, cubiertas y vallas. C80P añade una configuración de potencia más fuerte para proyectos de hasta 120 m.' },
    { q: '¿Puede C80P limpiar edificios de hasta 120 m?', a: 'Sí. C80P está configurado para proyectos de hasta 120 m. Los de más de 120 m se revisan caso por caso con un plan específico.' },
    { q: '¿Es un sistema completo o solo un dron?', a: 'Un sistema completo puede incluir dron, mando, bomba en tierra, manguera de 100 m, boquillas de espuma y presión, baterías, cargador, formación, SOP, documentos CE y soporte posventa.' },
    { q: '¿El dron lleva agua a bordo?', a: 'No. En la configuración estándar no hay tanque de agua a bordo. El agua se suministra desde una bomba en tierra por una manguera.' },
    { q: '¿Puede cambiar entre espuma y presión sin aterrizar?', a: 'Sí. El sistema 2026 permite alternar en el aire entre espuma y enjuague a presión sin aterrizar.' },
    { q: '¿Puede el piloto arrancar y detener la bomba de forma remota?', a: 'Sí. El piloto puede arrancar o detener la bomba en tierra desde el mando.' },
    { q: '¿Puede C80/C80P limpiar paneles solares en azoteas?', a: 'Con el kit opcional Solar/Tejado puede cubrir determinados solares en azoteas, cubiertas bajas y parapetos donde el agua y la manguera sean prácticos.' },
    { q: '¿Se incluye un paracaídas?', a: 'La integración del paracaídas es opcional y está disponible para proyectos o mercados que requieran mitigación adicional.' }
  ],
  fr: [
    { q: 'Qu’est-ce que le drone de nettoyage de façades EAUAV Vertex C80/C80P ?', a: 'C’est un système de nettoyage alimenté en eau certifié CE pour façades commerciales, fenêtres en hauteur, toitures, panneaux et certains projets solaires en toiture. Le drone vole sur batterie tandis que l’eau est fournie par une pompe au sol via un tuyau.' },
    { q: 'Quelle est la différence entre C80 et C80P ?', a: 'Le C80 est le choix pratique pour le nettoyage courant de façades, fenêtres, toitures et panneaux. Le C80P ajoute une configuration de puissance plus forte pour des projets jusqu’à 120 m.' },
    { q: 'Le C80P peut-il nettoyer des bâtiments jusqu’à 120 m ?', a: 'Oui. Le C80P est configuré pour des projets jusqu’à 120 m. Au-delà, étude au cas par cas avec un plan spécifique.' },
    { q: 'Est-ce un système complet ou seulement un drone ?', a: 'Un système complet peut inclure drone, radiocommande, pompe au sol, tuyau de 100 m, buses mousse et pression, batteries, chargeur, formation, SOP, documents CE et support après-vente.' },
    { q: 'Le drone transporte-t-il l’eau à bord ?', a: 'Non. Dans la configuration standard il n’y a pas de réservoir à bord. L’eau vient d’une pompe au sol par un tuyau.' },
    { q: 'Le drone peut-il basculer entre mousse et pression sans atterrir ?', a: 'Oui. Le système 2026 permet de basculer en vol entre mousse et rinçage sous pression sans atterrir.' },
    { q: 'Le pilote peut-il démarrer et arrêter la pompe à distance ?', a: 'Oui. Le pilote peut démarrer ou arrêter la pompe au sol depuis la radiocommande.' },
    { q: 'Le C80/C80P peut-il nettoyer des panneaux solaires en toiture ?', a: 'Avec le kit optionnel Solaire/Toiture, il peut couvrir certains solaires en toiture, toitures basses et parapets où l’eau et le tuyau sont praticables.' },
    { q: 'Un parachute est-il inclus ?', a: 'L’intégration du parachute est optionnelle et disponible pour les projets ou marchés exigeant une atténuation supplémentaire.' }
  ]
}
const faq = computed(() => faqByLocale[lang.value as keyof typeof faqByLocale] || faqByLocale.en)
const origin = 'https://www.droneworld.tech'
const path = '/products/vertex-c80-facade-cleaning-drone'
const localizedPath = computed(() => lang.value === 'en' ? path : '/' + lang.value + path)
const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      '@id': origin + localizedPath.value + '#product',
      name: 'EAUAV Vertex C80/C80P Facade Cleaning Drone',
      model: 'Vertex C80/C80P',
      brand: { '@type': 'Brand', name: 'EAUAV' },
      manufacturer: { '@type': 'Organization', name: 'EAUAV', url: 'https://eauav.com/' },
      description: c.value.lead,
      url: origin + localizedPath.value,
      image: [origin + '/images/c80/hero.jpg'],
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Endurance', value: '45 min' },
        { '@type': 'PropertyValue', name: 'Max project height (C80P)', value: '120 m' },
        { '@type': 'PropertyValue', name: 'Fast cleaning rate', value: '1,000 m²/hr' },
        { '@type': 'PropertyValue', name: 'Deep cleaning rate', value: '500 m²/hr' },
        { '@type': 'PropertyValue', name: 'Max pump pressure', value: '200 bar / 3000 psi' },
        { '@type': 'PropertyValue', name: 'Spray flow rate', value: '15 L/min' },
        { '@type': 'PropertyValue', name: 'Standard hose length', value: '100 m' },
        { '@type': 'PropertyValue', name: 'Ingress protection', value: 'IP65' }
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
        { '@type': 'ListItem', position: 1, name: c.value.homeLabel, item: origin + '/' },
        { '@type': 'ListItem', position: 2, name: c.value.productsLabel, item: origin + '/products' },
        { '@type': 'ListItem', position: 3, name: 'Vertex C80/C80P', item: origin + localizedPath.value }
      ]
    }
  ]
}))
const pageTitle = computed(() => c.value.seoTitle)
useHead(() => ({
  title: pageTitle.value,
  htmlAttrs: { lang: lang.value },
  meta: [
    { name: 'description', content: c.value.lead },
    { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1' },
    { property: 'og:type', content: 'product' },
    { property: 'og:site_name', content: 'DroneWorld' },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: c.value.lead },
    { property: 'og:url', content: origin + localizedPath.value },
    { property: 'og:image', content: origin + '/images/c80/hero.jpg' },
    { property: 'og:image:alt', content: c.value.visual },
    { name: 'twitter:image', content: origin + '/images/c80/hero.jpg' },
    { name: 'twitter:image:alt', content: c.value.visual },
    { name: 'twitter:card', content: 'summary_large_image' }
  ],
  script: [{ key: 'c80-product-jsonld', type: 'application/ld+json', innerHTML: JSON.stringify(structuredData.value).replace(/</g, '\\u003c') }],
  link: [
    { rel: 'canonical', href: origin + localizedPath.value },
    ...(['en', 'de', 'es', 'fr'].map(code => ({ rel: 'alternate', hreflang: code, href: origin + (code === 'en' ? path : '/' + code + path) }))),
    { rel: 'alternate', hreflang: 'x-default', href: origin + path }
  ]
}))
const archSteps = computed(() => [
  { n: '01', t: c.value.arch1, d: c.value.arch1Desc },
  { n: '02', t: c.value.arch2, d: c.value.arch2Desc },
  { n: '03', t: c.value.arch3, d: c.value.arch3Desc },
  { n: '04', t: c.value.arch4, d: c.value.arch4Desc },
  { n: '05', t: c.value.arch5, d: c.value.arch5Desc },
  { n: '06', t: c.value.arch6, d: c.value.arch6Desc }
])
const modes = computed(() => [
  { img: '/images/c80/mode-manual.png', t: c.value.mode1Title, d: c.value.mode1Desc },
  { img: '/images/c80/mode-ab.png', t: c.value.mode2Title, d: c.value.mode2Desc },
  { img: '/images/c80/mode-area.png', t: c.value.mode3Title, d: c.value.mode3Desc }
])
const safeties = computed(() => [
  { img: '/images/c80/rtk.jpg', t: c.value.safety1Title, d: c.value.safety1Desc },
  { img: '/images/c80/controller-standoff.jpg', t: c.value.safety2Title, d: c.value.safety2Desc },
  { img: '/images/c80/controller-failsafe.jpg', t: c.value.safety3Title, d: c.value.safety3Desc }
])
const upgrades = computed(() => [
  { t: c.value.up1Title, d: c.value.up1Desc },
  { t: c.value.up2Title, d: c.value.up2Desc },
  { t: c.value.up3Title, d: c.value.up3Desc },
  { t: c.value.up4Title, d: c.value.up4Desc },
  { t: c.value.up5Title, d: c.value.up5Desc },
  { t: c.value.up6Title, d: c.value.up6Desc }
])
const gallery = computed(() => [
  { src: '/images/c80/app-closeup.jpg', alt: c.value.visual },
  { src: '/images/c80/app-highrise.jpg', alt: c.value.appTitle + ' — high-rise' },
  { src: '/images/c80/app-mall.jpg', alt: c.value.appTitle + ' — mall' },
  { src: '/images/c80/app-factory.jpg', alt: c.value.appTitle + ' — factory' },
  { src: '/images/c80/app-hotel.jpg', alt: c.value.appTitle + ' — hotel' },
  { src: '/images/c80/app-panel.jpg', alt: c.value.appTitle + ' — aluminum panel' },
  { src: '/images/c80/app-villa.jpg', alt: c.value.appTitle + ' — villa roof' },
  { src: '/images/c80/rooftop.png', alt: c.value.appTitle + ' — rooftop' }
])
</script>

<template>
  <!-- EAUAV Vertex C80/C80P premium landing page: localized content, shared inquiry flow and verified-source specifications. -->
  <main class="c80-page">
    <section class="hero"><div class="wrap hero-grid">
      <div><NuxtLink :to="lp('/products')" class="back">← {{ c.backLabel }}</NuxtLink><p class="eyebrow">{{ c.eyebrow }}</p><h1>{{ c.title }}</h1><p class="lead">{{ c.lead }}</p>
        <a href="#c80-inquiry" class="button">{{ c.cta }} ↗</a>
        <div class="stats"><div><strong>45 min</strong><span>{{ c.stat1 }}</span></div><div><strong>120 m</strong><span>{{ c.stat2 }}</span></div><div><strong>1,000 m²/h</strong><span>{{ c.stat3 }}</span></div></div>
        <p class="note">{{ c.caveat }}</p>
      </div>
      <div class="visual"><img src="/images/c80/hero.jpg" :alt="c.visual" width="900" height="600"><span>{{ c.visual }}</span><small>{{ c.visualNote }}</small></div>
    </div></section>

    <section class="section"><div class="wrap"><p class="eyebrow">{{ c.sectionEyebrow }}</p><h2>{{ c.overview }}</h2><p class="intro">{{ c.intro }}</p>
      <div class="cards"><article><b>01</b><h3>{{ c.feature1Title }}</h3><p>{{ c.feature1Desc }}</p></article><article><b>02</b><h3>{{ c.feature2Title }}</h3><p>{{ c.feature2Desc }}</p></article><article><b>03</b><h3>{{ c.feature3Title }}</h3><p>{{ c.feature3Desc }}</p></article></div>
    </div></section>

    <section class="section soft"><div class="wrap"><p class="eyebrow">{{ c.archEyebrow }}</p><h2>{{ c.archTitle }}</h2><p class="intro">{{ c.archIntro }}</p>
      <div class="arch"><img class="arch-img" src="/images/c80/water-fed-system.png" :alt="c.archTitle" width="1024" height="580"><ol class="arch-steps"><li v-for="s in archSteps" :key="s.n"><b>{{ s.n }}</b><div><h3>{{ s.t }}</h3><p>{{ s.d }}</p></div></li></ol></div>
    </div></section>

    <section class="section"><div class="wrap"><p class="eyebrow">{{ c.cleanEyebrow }}</p><h2>{{ c.cleanTitle }}</h2><p class="intro">{{ c.cleanIntro }}</p>
      <div class="cards two"><article><h3>{{ c.nozzleTitle }}</h3><p>{{ c.nozzleDesc }}</p></article><article><h3>{{ c.enduranceTitle }}</h3><p>{{ c.enduranceDesc }}</p></article></div>
    </div></section>

    <section class="section soft"><div class="wrap"><p class="eyebrow">{{ c.modesEyebrow }}</p><h2>{{ c.modesTitle }}</h2><p class="intro">{{ c.modesIntro }}</p>
      <div class="cards three"><article v-for="m in modes" :key="m.t"><img :src="m.img" :alt="m.t" loading="lazy" width="640" height="360"><h3>{{ m.t }}</h3><p>{{ m.d }}</p></article></div>
    </div></section>

    <section class="section"><div class="wrap"><p class="eyebrow">{{ c.safetyEyebrow }}</p><h2>{{ c.safetyTitle }}</h2><p class="intro">{{ c.safetyIntro }}</p>
      <div class="cards three"><article v-for="s in safeties" :key="s.t"><img :src="s.img" :alt="s.t" loading="lazy" width="640" height="360"><h3>{{ s.t }}</h3><p>{{ s.d }}</p></article></div>
    </div></section>

    <section class="section soft"><div class="wrap"><p class="eyebrow">{{ c.upgradeEyebrow }}</p><h2>{{ c.upgradeTitle }}</h2><p class="intro">{{ c.upgradeIntro }}</p>
      <div class="cards three"><article v-for="(u, i) in upgrades" :key="u.t"><b>{{ String(i + 1).padStart(2, '0') }}</b><h3>{{ u.t }}</h3><p>{{ u.d }}</p></article></div>
    </div></section>

    <section class="section"><div class="wrap"><p class="eyebrow">{{ c.appEyebrow }}</p><h2>{{ c.appTitle }}</h2><p class="intro">{{ c.appIntro }}</p>
      <div class="gallery"><figure v-for="g in gallery" :key="g.src"><img :src="g.src" :alt="g.alt" loading="lazy" width="480" height="360"></figure></div>
    </div></section>

    <section class="section soft"><div class="wrap"><p class="eyebrow">{{ c.specsEyebrow }}</p><h2>{{ c.specsTitle }}</h2><dl class="specs"><div v-for="(label, i) in c.labels" :key="label"><dt>{{ label }}</dt><dd>{{ c.values[i] }}</dd></div></dl><p class="caveat">{{ c.specsNote }}</p></div></section>

    <section class="section faq-section"><div class="wrap"><p class="eyebrow">{{ c.faqEyebrow }}</p><h2>{{ c.faqTitle }}</h2><div class="faq-list"><details v-for="item in faq" :key="item.q"><summary>{{ item.q }}</summary><p>{{ item.a }}</p></details></div><p class="source-note">{{ c.sourceNote }} <a href="https://eauav.com/cleaning-drones/facade-cleaning-drones/" target="_blank" rel="noopener noreferrer">EAUAV</a>.</p></div></section>

    <section id="c80-inquiry" class="section inquiry-section"><div class="wrap inquiry-grid"><div><p class="eyebrow">{{ c.inquiryEyebrow }}</p><h2>{{ c.inquiryTitle }}</h2><p class="intro">{{ c.inquiryText }}</p><p class="note">{{ c.disclaimer }}</p></div><div class="inquiry-panel"><InquiryForm product-slug="vertex-c80-facade-cleaning-drone" /></div></div></section>
  </main>
</template>

<style scoped>
.c80-page{--ink:#f2f5f7;--muted:#a8b3bc;--line:rgba(255,255,255,.12);background:#0a1016;color:var(--ink);font-family:Barlow,Arial,sans-serif}.wrap{width:min(1180px,calc(100% - 48px));margin:auto}.hero{padding:76px 0 66px;background:radial-gradient(ellipse at 78% 25%,rgba(31,111,145,.22),transparent 38%),linear-gradient(135deg,#0a1016,#111d27 58%,#0a1016)}.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center}.back{display:inline-block;margin-bottom:34px;color:var(--muted);font-size:13px;text-decoration:none}.eyebrow{margin:0 0 16px;color:#76c5e7;font-size:12px;font-weight:750;letter-spacing:.16em;text-transform:uppercase}.hero h1{margin:0 0 22px;font-size:clamp(42px,5.3vw,70px);font-weight:760;letter-spacing:-.045em;line-height:1.02}.lead,.intro{max-width:720px;color:#c2ccd3;font-size:18px;line-height:1.7}.button{display:inline-flex;min-height:52px;align-items:center;margin:28px 0;padding:0 22px;border-radius:4px;background:#72c6e8;color:#07121a;font-size:14px;font-weight:750;text-decoration:none}.button:hover{background:#9bdbf2}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-top:24px;border-top:1px solid var(--line)}.stats div{display:flex;flex-direction:column;gap:5px}.stats strong{font-size:25px}.stats span{color:var(--muted);font-size:11px;line-height:1.4}.note,.caveat{color:#8796a0;font-size:12px;line-height:1.7}.visual{position:relative;padding:12px;border:1px solid rgba(137,202,229,.2);border-radius:8px;background:#101b24}.visual img{display:block;width:100%;height:auto;border-radius:4px}.visual>span{position:absolute;left:22px;bottom:42px;padding:8px 10px;background:rgba(5,12,18,.82);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.visual small{display:block;padding:8px 4px 0;color:#81909a;text-align:right}.section{padding:88px 0}.section h2{max-width:800px;margin:0 0 18px;font-size:clamp(32px,4vw,48px);font-weight:730;letter-spacing:-.035em;line-height:1.1}.section.soft{background:#0d151d}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:34px}.cards.two{grid-template-columns:repeat(2,1fr)}.cards.three{grid-template-columns:repeat(3,1fr)}.cards article{padding:26px 24px;border:1px solid var(--line);border-radius:10px;background:#101b24}.cards article b{display:inline-block;margin-bottom:14px;color:#76c5e7;font-size:13px;font-weight:800;letter-spacing:.1em}.cards article h3{margin:0 0 10px;font-size:19px;font-weight:720;letter-spacing:-.02em}.cards article p{margin:0;color:#aeb9c2;font-size:15px;line-height:1.65}.cards article img{display:block;width:100%;height:auto;margin:0 0 16px;border-radius:6px;border:1px solid var(--line)}.arch{display:grid;grid-template-columns:1.1fr 1fr;gap:36px;margin-top:34px;align-items:start}.arch-img{width:100%;height:auto;border-radius:8px;border:1px solid var(--line)}.arch-steps{list-style:none;margin:0;padding:0;display:grid;gap:16px}.arch-steps li{display:flex;gap:16px;align-items:flex-start}.arch-steps b{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border-radius:8px;background:#13232f;color:#76c5e7;font-size:13px}.arch-steps h3{margin:2px 0 4px;font-size:16px;font-weight:720}.arch-steps p{margin:0;color:#9fabb4;font-size:14px;line-height:1.55}.gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:34px}.gallery figure{margin:0;overflow:hidden;border-radius:8px;border:1px solid var(--line);background:#101b24}.gallery img{display:block;width:100%;height:200px;object-fit:cover;transition:transform .5s ease}.gallery figure:hover img{transform:scale(1.05)}.specs{margin:30px 0 0;border-top:1px solid var(--line)}.specs>div{display:grid;grid-template-columns:240px 1fr;gap:24px;padding:16px 0;border-bottom:1px solid var(--line)}.specs dt{color:#8b98a2;font-size:14px;font-weight:650}.specs dd{margin:0;color:#d3dbe1;font-size:15px;line-height:1.6}.specs+.caveat{margin-top:22px}.faq-list{margin-top:30px;display:grid;gap:12px}.faq-list details{padding:18px 20px;border:1px solid var(--line);border-radius:8px;background:#101b24}.faq-list summary{cursor:pointer;font-weight:680;font-size:16px;color:#e6ecf0}.faq-list details p{margin:12px 0 0;color:#aeb9c2;font-size:15px;line-height:1.65}.source-note{margin-top:24px;color:#7f8c96;font-size:12px;line-height:1.6}.source-note a{color:#76c5e7}.inquiry-section{background:linear-gradient(135deg,#0a1016,#111d27)}.inquiry-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}.inquiry-panel{background:#0b141b}.inquiry-panel :deep(.inquiry-form__card){background:#101b24;box-shadow:none;border:1px solid var(--line)}.inquiry-panel :deep(.inquiry-form__card h3){color:#e6ecf0}.inquiry-panel :deep(.ant-input),.inquiry-panel :deep(.ant-input-affix-wrapper),.inquiry-panel :deep(.ant-select-selector){background:#0b141b;border-color:var(--line);color:#e6ecf0}.inquiry-panel :deep(.ant-btn-primary){background:#72c6e8;border-color:#72c6e8;color:#07121a}@media(max-width:900px){.hero-grid,.arch,.inquiry-grid{grid-template-columns:1fr;gap:32px}.cards,.cards.two,.cards.three{grid-template-columns:1fr}.gallery{grid-template-columns:repeat(2,1fr)}.specs>div{grid-template-columns:1fr;gap:6px}.hero{padding:52px 0 48px}.section{padding:60px 0}}
</style>