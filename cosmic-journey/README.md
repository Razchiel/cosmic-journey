# 🌌 Cosmic Journey

An immersive, scroll-driven space exploration experience built with React + Vite.

## ✨ Features

- **5 cinematic sections**: Intro → Solar System → Cosmic Phenomena → Deep Space → Reflection
- **Animated starfield** with mouse parallax (3-layer depth)
- **Clickable planets & phenomena** with detailed facts
- **Ambient space music** synthesized entirely via Web Audio API (no MP3 needed)
- **Universe message system** with typewriter animation
- **Scroll progress bar** with gradient
- **Nav dots** for section jumping
- **Fully responsive** mobile design
- **Zero external asset dependencies** — all visuals are CSS/SVG

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

## 📦 Build for Production

```bash
npm run build
npm run preview
```

## 🗂️ Project Structure

```
cosmic-journey/
├── public/
│   ├── favicon.svg
│   └── audio/          ← (optional) drop space-ambient.mp3 here
│
├── src/
│   ├── components/
│   │   ├── StarField.jsx         Canvas-based animated star field
│   │   ├── NavDots.jsx           Section navigation dots
│   │   ├── MusicPlayer.jsx       Ambient audio toggle + volume
│   │   ├── ProgressBar.jsx       Scroll progress indicator
│   │   ├── FactPopup.jsx         Slide-up fact card
│   │   └── MessageBox.jsx        Universe message overlay
│   │
│   ├── sections/
│   │   ├── Intro.jsx             Earth departure hero
│   │   ├── SolarSystem.jsx       Clickable planets
│   │   ├── Phenomena.jsx         Black holes, supernovae, nebulae, pulsars
│   │   ├── DeepSpace.jsx         Dark, mysterious, text-reveal
│   │   └── Ending.jsx            Reflection + message CTA
│   │
│   ├── data/
│   │   └── index.js              Planets, phenomena, universe messages
│   │
│   ├── hooks/
│   │   ├── useScroll.js          Scroll tracking, section detection, mouse parallax
│   │   └── useAudio.js           Web Audio API ambient synthesis
│   │
│   ├── App.jsx                   Root component
│   ├── index.css                 Global styles + design tokens
│   └── main.jsx                  React entry point
│
├── index.html
├── vite.config.js
└── package.json
```

## 🎨 Design System

**Fonts**: Cormorant Garamond (display) + Outfit (body)  
**Palette**: Deep void black · Nebula blue · Accent purple/pink/gold  
**Motion**: CSS animations + Intersection Observer reveals  

## 🎧 Ambient Audio

The music player uses the Web Audio API to synthesize ambient space tones directly in the browser — no audio files required. Click the button in the top-right corner to start.

**Optional**: Drop `space-ambient.mp3` into `public/audio/` and update `useAudio.js` to use it instead.

## 🌐 Adding Real Space Images

Replace the CSS/SVG visuals with real NASA images:

```
public/images/
  earth.png         → NASA Blue Marble
  planets/
    mercury.jpg     → NASA/JHU APL
    venus.jpg
    mars.jpg
    jupiter.jpg     → NASA/JPL-Caltech
    saturn.jpg
  nebula/
    orion.jpg       → NASA Hubble
    pillars.jpg
    crab.jpg
```

Free sources:
- **NASA Image Gallery**: https://images.nasa.gov
- **Hubble Site**: https://hubblesite.org/images/gallery
- **ESA/Webb**: https://esawebb.org/images/

## 📱 Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 🛠️ Tech Stack

- **React 18** + **Vite 5**
- **CSS Modules** (zero runtime CSS-in-JS)
- **Web Audio API** for synthesized ambient music
- **Canvas API** for animated star field
- **Intersection Observer** for scroll reveals
- **Google Fonts**: Cormorant Garamond + Outfit
