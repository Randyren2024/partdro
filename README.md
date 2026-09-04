# Partdro AgriTech - Agricultural Technology Website

MVP website for agricultural technology products built with Vue 3 + TypeScript + Ant Design Vue.

## Tech Stack

- **Vue 3** - Frontend framework with Composition API
- **TypeScript** - Type safety
- **Ant Design Vue** - UI component library
- **Vite** - Build tool
- **vueuse** - Composition utilities
- **Noto Sans** - Primary font

## Features

1. **Modern Design** - Professional agricultural technology website
2. **Partdro Brand Style** - Custom green theme color scheme
3. **Responsive Layout** - Adapts to various screen sizes
4. **Component-based Development** - Reusable component structure
5. **TypeScript Support** - Complete type definitions
6. **Accessibility** - ARIA labels, keyboard navigation
7. **Touch Support** - Swipe gestures on carousel
8. **Motion Animations** - Entrance animations using v-motion directives

## Partdro Brand Colors

- Primary: `#2e7d32` (Dark Green)
- Secondary: `#4caf50` (Light Green)
- Accent: `#2196f3` (Blue)
- Text: `#2c3e50` (Dark Gray)

## Project Structure

```
partdro_vue/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Header.vue
│   │   └── Footer.vue
│   ├── views/             # Page components
│   │   ├── HomeView.vue
│   │   ├── AboutView.vue
│   │   ├── ContactView.vue
│   │   └── ...
│   ├── router/           # Routing configuration
│   ├── data/             # Static data (products, categories)
│   ├── assets/           # Static assets
│   │   └── global.css
│   ├── App.vue           # Root component
│   └── main.ts           # Application entry
├── public/
│   └── images/           # Public images
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Quick Start

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Visit http://localhost:3001

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Main Features

### 1. Navigation Bar
- Partdro brand identity with logo
- Responsive menu with route highlighting
- Request demo button (WhatsApp integration)

### 2. Hero Section
- Brand slogan with gradient text
- Interactive product carousel with:
  - Smooth slide transitions
  - Touch/swipe support
  - Keyboard navigation (arrow keys)
  - Play/pause controls
  - Auto-advance with 5s interval
- Product info cards with tags

### 3. Products & Solutions Showcase
- Category cards: Precision Agriculture, Agricultural Robotics, IoT Monitoring, Data Analytics, etc.
- Product cards with hover effects
- Best sellers highlight section

### 4. Our Values Section
- Technical Excellence
- Customer Partnership
- Market Intelligence
- Localized Service

### 5. Footer
- Company information
- Solution links
- Contact details
- Social media links

## Custom Theme

The project uses Ant Design Vue's theme system. Modify theme configuration in `src/App.vue`:

```typescript
const themeConfig = computed(() => ({
  token: {
    colorPrimary: '#2e7d32',
    colorSuccess: '#4caf50',
  },
  components: {
    Button: {
      borderRadius: 6,
    },
  },
}))
```

## Responsive Design

- **Desktop**: Full layout, multi-column display
- **Tablet**: Adaptive layout
- **Mobile**: Single-column layout, optimized for touch experience

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT