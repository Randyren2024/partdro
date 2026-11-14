/**
 * 新产品落地页默认模板：与 d15r 页面模块结构同构的 i18n 树。
 * 只注册到 en（fallbackLocale='en'，es/de/fr 自动回退），
 * 管理员编辑保存的 diff 以此为 base，仅存改动叶子。
 */
export function defaultLandingTemplate(): Record<string, any> {
  const n = (i: number) => String(i)
  return {
    hero: {
      kicker: 'Partdro drone',
      title1: 'Professional',
      title2: 'Drone Solutions',
      lead: 'Describe the product value proposition in one or two sentences: what it does, where it operates, and the key performance numbers.',
      ctaPrimary: 'Get a Quote',
      ctaSecondary: 'Contact Sales',
      badgeTitle: 'Factory direct',
      badgeText: 'Worldwide shipping and support',
      stats: { 0: '20MPa', 1: 'RTK', 2: '15m' },
    },
    strip: {
      0: { value: '99.9%', label: 'Uptime' },
      1: { value: '10+', label: 'Countries' },
      2: { value: '30%', label: 'Cost saved' },
      3: { value: '2x', label: 'Faster' },
      4: { value: '0', label: 'Accidents' },
    },
    why: {
      eyebrow: 'Why choose it',
      title: 'Built for demanding jobs.',
      lead: 'Summarize the three to six reasons customers pick this product over alternatives.',
      cards: {
        0: { title: 'Industrial design', desc: 'Explain the durability and engineering highlights here.' },
        1: { title: 'Precise control', desc: 'Describe positioning accuracy and stability.' },
        2: { title: 'All-weather ready', desc: 'Describe the operating envelope and protections.' },
        3: { title: 'Long endurance', desc: 'Describe battery life and swappable power.' },
        4: { title: 'Easy to deploy', desc: 'Describe setup time and transport.' },
        5: { title: 'Full support', desc: 'Describe training, warranty and spare parts.' },
      },
    },
    designed: {
      eyebrow: 'Engineering',
      title: 'Designed for the job.',
      lead: 'One paragraph about the industrial design and how each part serves the mission.',
      items: {
        0: { title: 'Modular airframe', desc: 'Foldable, transportable, quick to service.' },
        1: { title: 'Powerful propulsion', desc: 'Redundant motors and ESCs for heavy payloads.' },
        2: { title: 'Smart power management', desc: 'Hot-swappable batteries with real-time telemetry.' },
      },
    },
    output: {
      eyebrow: 'Performance',
      title: 'Output that scales.',
      unitTitle: 'Per-unit capability',
      note: 'Replace these rows with measured, order-of-magnitude numbers for this product.',
      rows: {
        0: { label: 'Coverage per hour', value: 'Value' },
        1: { label: 'Working width', value: 'Value' },
        2: { label: 'Payload capacity', value: 'Value' },
        3: { label: 'Efficiency vs. manual', value: 'Value' },
        4: { label: 'Daily output', value: 'Value' },
      },
    },
    spray: {
      eyebrow: 'Core hardware',
      title: 'Working modules.',
      lead: 'Explain the toolheads or effectors this drone carries and when to use each.',
      nozzles: {
        0: { angle: 'Module 1', desc: 'Describe the first working module and its use case.' },
        1: { angle: 'Module 2', desc: 'Describe the second working module and its use case.' },
        2: { angle: 'Module 3', desc: 'Describe the third working module and its use case.' },
        3: { angle: 'Module 4', desc: 'Describe the fourth working module and its use case.' },
      },
    },
    intelligence: {
      eyebrow: 'Autonomy',
      title: 'Intelligent flight.',
      lead: 'Describe planning, sensing and automation features.',
      items: {
        0: { title: 'Route planning', desc: 'One-tap mission planning with automatic coverage.' },
        1: { title: 'Obstacle sensing', desc: 'Real-time perception keeps the drone safe.' },
        2: { title: 'RTK positioning', desc: 'Centimeter-level accuracy for repeatable work.' },
        3: { title: 'Fleet control', desc: 'One operator can supervise multiple units.' },
      },
    },
    safety: {
      eyebrow: 'Safety',
      title: 'Operator protection first.',
      lead: 'Describe the safety systems and certifications.',
      cards: {
        0: { title: 'Redundant systems', desc: 'Dual IMU, barometers and fail-safe return.' },
        1: { title: 'Geofencing', desc: 'No-fly zones and altitude limits enforced.' },
        2: { title: 'Emergency stop', desc: 'One-tap hover-and-land from the controller.' },
      },
    },
    multiangle: {
      eyebrow: 'In the field',
      title: 'Every angle covered.',
      lead: 'Highlight how the product looks and performs from different angles.',
      items: {
        0: { title: 'Front', desc: 'Describe the front view highlights.' },
        1: { title: 'Side', desc: 'Describe the side view highlights.' },
        2: { title: 'Top', desc: 'Describe the top view highlights.' },
        3: { title: 'Detail', desc: 'Describe close-up craftsmanship.' },
      },
    },
    compare: {
      eyebrow: 'Comparison',
      title: 'Drone vs. manual work.',
      colD15r: 'Our drone',
      colManual: 'Manual method',
      rows: {
        0: { label: 'Efficiency', d15r: 'Advantage', manual: 'Baseline' },
        1: { label: 'Cost per m²', d15r: 'Advantage', manual: 'Higher' },
        2: { label: 'Safety risk', d15r: 'None', manual: 'High' },
        3: { label: 'Quality consistency', d15r: 'Uniform', manual: 'Varies' },
        4: { label: 'Access to heights', d15r: 'Unlimited', manual: 'Restricted' },
        5: { label: 'Setup time', d15r: 'Minutes', manual: 'Hours' },
      },
    },
    applications: {
      eyebrow: 'Case studies',
      title: 'Proven in the field.',
      lead: 'Replace with real project names, locations and outcomes as references come in.',
      badges: {
        case: 'Case study',
        operation: 'Operation',
        application: 'Application',
      },
      cases: {
        0: { badge: 'case', title: 'Project reference 1' },
        1: { badge: 'case', title: 'Project reference 2' },
        2: { badge: 'case', title: 'Project reference 3' },
        3: { badge: 'case', title: 'Project reference 4' },
        4: { badge: 'case', title: 'Project reference 5' },
        5: { badge: 'case', title: 'Project reference 6' },
      },
    },
    scenarios: {
      0: { title: 'Scenario 1', desc: 'Describe a typical use scenario.' },
      1: { title: 'Scenario 2', desc: 'Describe a typical use scenario.' },
      2: { title: 'Scenario 3', desc: 'Describe a typical use scenario.' },
      3: { title: 'Scenario 4', desc: 'Describe a typical use scenario.' },
    },
    video: {
      eyebrow: 'Watch it work',
      title: 'Product in action.',
      url: '',
      emptyHint: 'Video not set yet — click to add an MP4 link or a YouTube / Bilibili URL.',
    },
    specs: {
      eyebrow: 'Specifications',
      title: 'Technical specifications.',
      lead: 'Replace every row below with the real specifications of this product.',
      items: Object.fromEntries(
        Array.from({ length: 19 }, (_, i) => [
          n(i),
          { label: `Parameter ${i + 1}`, value: 'Value' },
        ]),
      ),
    },
    cta: {
      eyebrow: 'Get started',
      title: 'Ready to see it work?',
      text: 'Talk to our team about demos, pricing and deployment for your sites.',
      visit: 'Back to home',
    },
  }
}
