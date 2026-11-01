# Cosmic Journey

**From Earth to the edge of the observable universe.**

Cosmic Journey is an interactive, scroll-free journey through space. You board a ship, leave Earth, wander through the Solar System, meet the strangest objects in the cosmos, zoom out to the edge of the universe, receive a message written for you, and finally catch a falling star to leave a wish for other travelers.

Built with React, Vite and React Three Fiber. Deployed on Netlify, with a small serverless backend on Supabase for the wishes.

Status: all planned phases (0 to 18) are done. The project is in polish mode: small fixes, spacing, contrast, readability, light performance work, small copy edits and targeted visual upgrades.

---

## Journey

| Stage | What happens |
| --- | --- |
| **Entry gate** | Choose to board with or without sound. One tap unlocks audio. |
| **Departure (Intro)** | Greeting and mission HUD based on the visitor's device clock. Earth (day/night), the Moon and the ISS in 3D. Tap Earth or the Moon to zoom in. Hold the button to launch. |
| **The Solar System** | Eight textured planets in 3D. Tap one to zoom in, rotate it 360 degrees and read a fact. |
| **Cosmic Phenomena** | Black holes, supernovae, nebulae, pulsars and more, with a terminal-style reveal. |
| **Deep Space** | A zoom slider from planet Earth to the observable universe. One fact line and one short thought per level. |
| **Reflection (Ending)** | Enter your name, receive a message from the universe, with a constellation built from your name. Supernova hearts bloom around the card. Save it as a shareable card. |
| **Wishing Star** | Catch the brightest falling star and whisper a wish. Reachable only from Ending ("Next: Make a Wish"). |
| **Secret Ending** | Opens only after a successful wish. |
| **Astronaut Gallery** | Read wishes and messages from other travelers. Sort, filter, load more. |
| **Return home** | A warp back to Earth, with your constellation watching over you. |

Flow: Entry gate > Intro > Solar System > Phenomena > Deep Space > Ending > Wishing Star > (Secret Ending) > Gallery or Return home (HomeWarp). The side dot menu has 6 sections (Wishing is not one of them; while on Wishing or Secret, the dot and progress bar stay on Ending).

## Features

- Scroll-locked, section-based navigation with a side dot menu and a progress bar.
- Starfield canvas with per-section **depth** (0 to 0.8): the deeper the section, the dimmer and sparser the stars. Driven by refs, not per-frame React state.
- Ambient music per section with crossfade, built on the Web Audio API (works around iOS volume and silent switch limits).
- Synthesized sound effects, no audio files needed for SFX.
- **Intro HUD**: device time zone (WIB, WITA, WIT or "GMT+x" with city), clock, date, moon phase icon (synodic formula, no API), and "Mission day N" (day of the year). On mobile the HUD is trimmed (no year, short zone label, ISS line shortened, mission day hidden).
- **Time-aware greeting**: five bands (morning, day, afternoon, evening, late night), 3 or 4 variants each, picked per calendar day so it stays stable all day.
- **Textured planets**: 7 planet photo textures plus a day map for Earth, shared through one texture loader and preloaded one by one after the Solar System chunk loads (skipped on save-data and 2G).
- **Day/night Earth in Intro**: light direction follows the device hour, city lights show only on the night side. Moon has its own texture. A dev-only `?hour=22` URL param tests lighting.
- **Procedural ISS** (no 3D file): pressurized modules, truss, textured solar arrays, radiators, oriented along its orbit.
- **Click to zoom** in Intro: Earth and Moon can be tapped to zoom (ray test on a single window click listener, interactive elements ignored). Exit with a click anywhere, the same object again, Esc, or launching.
- **Comfort mode** (moon button in the music player): dimmer stars, softer and brighter text, less motion, instant text reveal. State lives in App, no localStorage. The three.js scenes do not follow Comfort yet except where noted.
- Respects `prefers-reduced-motion` across sections.
- **Gallery extras**: first testers (Liya, Rei) get glowing, shimmering cards with #1 and #2 badges and titles. A small heart "Loved by Raz" appears on cards whose `loved_by_raz` column is true.
- Accessibility work: focus traps in dialogs, `inert` behind the entry gate, keyboard paths for the Wishing Star, visible focus rings, readable contrast tokens (target 4.5:1).
- Mobile-first layout, tested for 360 to 430px wide screens, using `100dvh` for full-height sections.
- Visitor name and constellation live in memory only. Nothing personal is stored in `localStorage`.
- Wish backend with strict server-side validation, a honeypot, IP-hash rate limiting, duplicate detection, a basic bad-words filter (English and Indonesian) and an optional auto-approve mode.

## Tech stack

- **Front-end:** React 18, Vite 5, CSS Modules
- **3D:** three.js (^0.184.0), `@react-three/fiber`, `@react-three/drei`
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

The site opens at `http://localhost:5173`. The journey works fully, but the Gallery and wish submission need the backend. In dev you can add `?hour=0`, `6`, `12`, `18` or `22` to the URL to test the Intro day/night lighting.

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

The schema lives in `supabase/schema.sql`. Run it in the Supabase SQL editor, then run `supabase/add_loved_by_raz.sql` (it is not yet merged into `schema.sql`). The backend expects:

- a `wishes` table with the columns `id`, `display_name`, `is_anonymous`, `category`, `message`, `rating`, `is_private`, `status`, `ip_hash`, `created_at`, `loved_by_raz` (boolean, not null, default false)
- an RPC function `wish_stats` that returns the `count` and `average` rating of approved, public wishes

New wishes are saved as `pending`. To publish one, set its `status` to `approved` in the Supabase dashboard (or turn on `AUTO_APPROVE`). To remove one, set `status` to `rejected`. To give a card the "Loved by Raz" heart, set `loved_by_raz` to `TRUE` in the Table Editor; it shows after the CDN cache expires (about 1 to 3 minutes). Private wishes are stored but are never returned by the API.

The two first testers are matched by real wish `id` in the `FIRST_CREW` map in `Gallery.jsx`. If those rows are deleted and recreated, update the ids there by hand.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/get-wishes?sort=newest\|rating&category=all\|<id>&cursor=<opaque>&limit=12` | Approved, public wishes with cursor pagination and aggregate stats. Each item includes `lovedByRaz`. Cached at the CDN. |
| `POST` | `/api/submit-wish` | Validates and stores a wish. Returns `201` with the saved record. |

Errors always have the shape `{ "error": { "code", "message" } }`, where `code` is `validation`, `rate_limit` or `server`.

Wish categories: `feedback`, `suggestion`, `developer`, `wish`.

## Static assets

Place these in `public/`:

```
public/
  favicon.svg
  images/
    earth_daymap.jpg     # Earth day texture (Intro and Solar System)
    earth_nightmap.jpg   # Earth night texture (city lights in Intro)
    planets/
      {id}.jpg           # 7 planet textures, 2048x1024
      moon.jpg           # 512x256, a bit soft when zoomed (use 1024x512 if needed)
  audio/
    intro.mp3
    solar.mp3
    phenomena.mp3
    deepspace.mp3
    ending.mp3
```

The Gallery reuses `intro.mp3` and the Wishing Star reuses `ending.mp3`. `earth.jpg` and `earth.png` are no longer used and can be deleted once nothing references them.

Planet and Earth textures: [Solar System Scope](https://www.solarsystemscope.com/textures/), CC BY 4.0.

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
    add_loved_by_raz.sql
  src/
    App.jsx                  # Section routing, transitions, global state, depth map
    main.jsx
    index.css                # Design tokens and global styles
    components/              # EntryGate, StarField, MusicPlayer, NavDots,
                             # HomeWarp, WishForm, UniverseScale, FactPopup,
                             # MessageBox, ProgressBar, ...
    sections/                # Intro, SolarSystem, Phenomena, DeepSpace,
                             # Ending, Wishing, SecretEnding, Gallery
    hooks/                   # useAudio (ambient music), useSfx (synth SFX)
    utils/
      planetTexture.js       # PlanetTextureLoader, TextureBoundary, preloadPlanetTextures
    services/
      wishes.js              # Client for the wishes API (submitWish, getWishes)
    data/
      index.js               # Planets, phenomena, messages, universe levels
      dummyWishes.js         # Dummy data from the pre-backend Gallery phase
```

## Deploying to Netlify

1. Push the repository to GitHub.
2. Create a new site in Netlify from that repository.
3. Build settings are already in `netlify.toml` (`npm run build`, publish `dist`, Node 20, functions in `netlify/functions`).
4. Add the environment variables listed above.
5. Deploy.

## Design notes

- All UI copy is in English, short, concrete and warm. No em dashes or en dashes in visible text. Stylized sci-fi phrases (for example "DATA FRAGMENT ACQUIRED") are intentional.
- Heavy animation runs through refs and `requestAnimationFrame`, not per-frame React state. Timers and rAF are always cleaned up.
- Section code, including all three.js scenes, is lazy-loaded so the first paint stays light.
- Typography and color tokens are centralized in `src/index.css` (`--text-*`, `--fs-*`, `--nav-gutter`, ...). Muted text is never dimmer than about `#9fb0d4`. Small text is at least 0.75rem, paragraphs at least 1rem on phones.
- Main text blocks sit on a soft dark gradient scrim. Paragraph width stays at 45 to 70 characters.
- Planet textures are loaded with a shared `PlanetTextureLoader` so preload and `useLoader` hit the same cache. Each textured object has its own `Suspense` and fallback, so one failed texture never empties the Canvas.
- The `body.hide-global-ui` rule selects the music player by class-name fragments (`player`, `showBtn`). Keep those names if you restyle `MusicPlayer`.

## Privacy

- Visitor names and constellations are kept in memory and cleared when the visitor returns home.
- Wishes are stored with a salted hash of the IP address, never the raw address.
- Private wishes are never shown publicly.
- `localStorage` is used only for the SFX mute preference.

## Notes for AI assistants and contributors

Read this before changing code.

**Working style**
- Make the smallest change that fixes the problem. No refactors, no removing features unless asked.
- Find the root cause first, then fix. Mention which other sections the change might affect.
- Mobile first. Test 360 to 430px. Use `100dvh`, not `100vh`.
- Respect `prefers-reduced-motion` and Comfort mode for every new animation.
- Do not add npm dependencies without discussing it first.

**Rules and pitfalls learned the hard way**
- Do not store visitor name or constellation in `localStorage`. Comfort mode also stays out of `localStorage`.
- three.js textures from `TextureLoader` or `useLoader` need `colorSpace = THREE.SRGBColorSpace` set manually. Use `PlanetTextureLoader` instead of a bare `useLoader`.
- A material with `map` must not get a `color` other than white, because `color` multiplies the texture.
- One `Suspense` around many textured objects blanks all of them until the last texture loads. Use one per object.
- CSS aliases such as `--star-white` are resolved on `:root`. Overrides in `body.comfort-mode` must redefine the alias too.
- Absolute elements must not stack with `FactPopup`, `MessageBox` or the mini music pill on phones. Keep a safe gap from the right NavDots (`--nav-gutter`) and from 3D canvases.
- Earth's position in the Solar System grid is (-2.1, 1.6) on phones and is mirrored by `SOLAR_MOBILE_POS` in `Intro.jsx`. If the planet grid changes, update both.
- In Intro, the Canvas stays `pointer-events: none`. Zoom clicks come from one `window` click listener with a ray test (Earth radius 2.35, Moon 0.85).
- The Moon's main face currently points outward (`rotation.y = -a`), not tidally locked. Use `Math.PI - a` for accuracy.
- Intro time zone is read once at module load. Changing zone mid-session needs a reload.
- The moon phase uses the mean synodic month and can be off by about half a day. Date and mission day can differ by one day across zones near midnight, on purpose.
- Tunable values: planet `spin`, `nightGain` 1.4, night ambient 0.06 to 0.14, light intensity 1.8 to 3.0, zoom distances 9.6 (Earth) and 1.8 (Moon), Moon touch radius 0.85.
- "Your wish" cards for the current visitor do not get crew glow or the heart until the Gallery reloads.

**Deferred (do not build or mention unless asked)**
- Star constellations on Gallery cards (needs a DB letters + seed column, plus changes to `schema.sql`, `submit-wish`, `get-wishes`). `makeConstellation` in Ending stays random.
- `loved_by_raz` is not yet in `schema.sql` (only matters if the database is rebuilt from scratch).
- A full in-site admin mode (delete, edit, like from the UI). Moderation stays in the Supabase Table Editor.
- Optional ideas not done: Cloudflare Turnstile, email notifications, a small "MISSION CONTROL · WIB time" line on desktop HUD for non-WIB visitors.

## License

By. Alimmul Hafidz AKA Razchiel

## Credits

Built with care for everyone who has ever looked up at the night sky. Planet and Earth textures by Solar System Scope (CC BY 4.0).