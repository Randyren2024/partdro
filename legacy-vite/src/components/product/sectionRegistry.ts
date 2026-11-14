import type { Component } from 'vue'
import type { SectionId } from './sectionIds'
import HeroSection from './sections/HeroSection.vue'
import StatStripSection from './sections/StatStripSection.vue'
import WhySection from './sections/WhySection.vue'
import DesignedSection from './sections/DesignedSection.vue'
import OutputSection from './sections/OutputSection.vue'
import SpraySection from './sections/SpraySection.vue'
import IntelligenceSection from './sections/IntelligenceSection.vue'
import SafetySection from './sections/SafetySection.vue'
import MultiangleSection from './sections/MultiangleSection.vue'
import CompareSection from './sections/CompareSection.vue'
import ApplicationsSection from './sections/ApplicationsSection.vue'
import ScenariosSection from './sections/ScenariosSection.vue'
import VideoSection from './sections/VideoSection.vue'
import KitSection from './sections/KitSection.vue'
import SpecsSection from './sections/SpecsSection.vue'
import CtaSection from './sections/CtaSection.vue'

export const SECTION_COMPONENTS: Record<SectionId, Component> = {
  hero: HeroSection,
  strip: StatStripSection,
  why: WhySection,
  designed: DesignedSection,
  output: OutputSection,
  spray: SpraySection,
  intelligence: IntelligenceSection,
  safety: SafetySection,
  multiangle: MultiangleSection,
  compare: CompareSection,
  applications: ApplicationsSection,
  scenarios: ScenariosSection,
  video: VideoSection,
  kit: KitSection,
  specs: SpecsSection,
  cta: CtaSection,
}
