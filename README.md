# Cosmic Journey

**From Earth to the edge of the observable universe.**

Cosmic Journey is an interactive scroll-free journey through space. You board a ship, leave Earth, wander through the Solar System, meet the strangest objects in the cosmos, zoom out to the edge of the universe, receive a message written for you, and finally catch a falling star to leave a wish for other travelers.

Built with React, Vite and React Three Fiber. Deployed on Netlify, with a small serverless backend on Supabase for the wishes.

---

## Journey

| Stage | What happens |
| --- | --- |
| **Entry gate** | Choose to board with or without sound. |
| **Departure** | Hold the button to launch. Earth, the Moon and the ISS in 3D. |
| **The Solar System** | Eight planets in 3D. Tap one to zoom in, rotate it 360 degrees and read a fact. |
| **Cosmic Phenomena** | Black holes, supernovae, nebulae, pulsars and more, with a terminal-style reveal. |
| **Deep Space** | A zoom slider from planet Earth to the observable universe. |
| **Reflection** | Receive a message from the universe, with a constellation built from your name. Save it as a shareable card. |
| **Wishing Star** | Catch the brightest falling star and whisper a wish. |
| **Secret Ending** | Opens only after a successful wish. |
| **Astronaut Gallery** | Read wishes and messages from other travelers. Sort, filter, load more. |
| **Return home** | A warp back to Earth, with your constellation watching over you. |

## Features

- Scroll-locked, section-based navigation with a side dot menu and a progress bar.
- Starfield canvas with per-section depth and smooth easing.
- Ambient music per section with crossfade, built on the Web Audio API (works around iOS volume and silent switch limits).
- Synthesized sound effects, no audio files needed for SFX.
- **Comfort mode**: dimmer stars, softer and brighter text, less motion, instant text reveal.
- Respects `prefers-reduced-motion` across sections.
- Accessibility work: focus traps in dialogs, `inert` behind the entry gate, keyboard paths for the Wishing Star, visible focus rings.
- Mobile-first layout, tested for 360 to 430px wide screens, using `100dvh` for full-height sections.
- Visitor name and constellation live in memory only. Nothing personal is stored in `localStorage`.
- Wish backend with strict server-side validation, a honeypot, IP-hash rate limiting, duplicate detection, a basic bad-words filter (English and Indonesian) and an optional auto-approve mode.

## Tech stack

- **Front-end:** React 18, Vite 5, CSS Modules
- **3D:** three.js, `@react-three/fiber`, `@react-three/drei`
- **Animation:** framer-motion, requestAnimationFrame, CSS
- **Backend:** Netlify Functions (esbuild), Supabase (PostgREST)
- **Fonts:** Cormorant Garamond and Outfit (Google Fonts)

## Getting started

### Requirements

- Node.js 20 or newer
- A Supabase project (only needed for the wishes and the Gallery)
- Optional: the [Netlify CLI](https://docs.netlify.com/cli/get-started/) to run the functions locally

### Install

```bash
git clone <your-repo-url>
cd cosmic-journey
npm install
```

### Run the front-end only

```bash
npm run dev
```

The site opens at `http://localhost:5173`. The journey works fully, but the Gallery and wish submission need the backend.

### Run with the backend (recommended)

```bash
netlify dev
```

This starts Vite and the Netlify Functions together at `http://localhost:8888`. Requests to `/api/*` are redirected to `/.netlify/functions/*`.

### Build

```bash
npm run build
npm run preview
```

## Environment variables

Set these in a local `.env` file for `netlify dev`, and in **Netlify > Site settings > Environment variables** for production. They are read only inside Netlify Functions and never reach the browser bundle.

| Variable | Required | Description |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Your Supabase project URL. |
| `SUPABASE_SERVICE_KEY` | Yes | Service key (legacy `service_role` JWT or the new `sb_secret_...` key). Keep it secret. |
| `IP_HASH_SALT` | Recommended | Secret salt used to hash IP addresses. Raw IPs are never stored. |
| `AUTO_APPROVE` | No | Set to `true` to publish clean public wishes immediately. Otherwise every wish starts as `pending`. |

Example `.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
IP_HASH_SALT=a-long-random-string
AUTO_APPROVE=false
```

## Database

The schema lives in `supabase/schema.sql`. Run it in the Supabase SQL editor. The backend expects:

- a `wishes` table with the columns `id`, `display_name`, `is_anonymous`, `category`, `message`, `rating`, `is_private`, `status`, `ip_hash`, `created_at`
- an RPC function `wish_stats` that returns the `count` and `average` rating of approved, public wishes

New wishes are saved as `pending`. To publish one, set its `status` to `approved` in the Supabase dashboard (or turn on `AUTO_APPROVE`). Private wishes are stored but are never returned by the API.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/get-wishes?sort=newest\|rating&category=all\|<id>&cursor=<opaque>&limit=12` | Approved, public wishes with cursor pagination and aggregate stats. Cached at the CDN. |
| `POST` | `/api/submit-wish` | Validates and stores a wish. Returns `201` with the saved record. |

Errors always have the shape `{ "error": { "code", "message" } }`, where `code` is `validation`, `rate_limit` or `server`.

Wish categories: `feedback`, `suggestion`, `developer`, `wish`.

## Static assets

Place these in `public/`:

```
public/
  favicon.svg
  images/
    earth.jpg          # Earth texture used by Intro and Solar System
  audio/
    intro.mp3
    solar.mp3
    phenomena.mp3
    deepspace.mp3
    ending.mp3
```

The Gallery reuses `intro.mp3` and the Wishing Star reuses `ending.mp3`.

## Project structure

```
cosmic-journey/
  index.html
  netlify.toml
  vite.config.js
  netlify/
    functions/
      get-wishes.js
      submit-wish.js
    lib/
      shared.js              # Supabase client, validation, filters, hashing
  supabase/
    schema.sql
  src/
    App.jsx                  # Section routing, transitions, global state
    main.jsx
    index.css                # Design tokens and global styles
    components/              # EntryGate, StarField, MusicPlayer, NavDots,
                             # HomeWarp, WishForm, UniverseScale, FactPopup, ...
    sections/                # Intro, SolarSystem, Phenomena, DeepSpace,
                             # Ending, Wishing, SecretEnding, Gallery
    hooks/                   # useAudio (ambient music), useSfx (synth SFX)
    services/
      wishes.js              # Client for the wishes API
    data/
      index.js               # Planets, phenomena, messages, universe scale
```

## Deploying to Netlify

1. Push the repository to GitHub.
2. Create a new site in Netlify from that repository.
3. Build settings are already in `netlify.toml` (`npm run build`, publish `dist`, Node 20, functions in `netlify/functions`).
4. Add the environment variables listed above.
5. Deploy.

## Design notes

- All UI copy is in English, short and warm.
- Heavy animation runs through refs and `requestAnimationFrame`, not per-frame React state.
- Section code, including all three.js scenes, is lazy-loaded so the first paint stays light.
- The `body.hide-global-ui` rule selects the music player by class-name fragments (`player`, `showBtn`). Keep those names if you restyle `MusicPlayer`.

## Privacy

- Visitor names and constellations are kept in memory and cleared when the visitor returns home.
- Wishes are stored with a salted hash of the IP address, never the raw address.
- Private wishes are never shown publicly.

## License

Add your license here (for example MIT) and a `LICENSE` file.

## Credits

Built with care for everyone who has ever looked up at the night sky.