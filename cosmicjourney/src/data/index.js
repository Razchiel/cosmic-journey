// ============================================================
// COSMIC JOURNEY — Data: Planets, Phenomena, Messages
// ============================================================

export const PLANETS = [
  {
    id: 'mercury',
    name: 'Mercury',
    color: '#c8a87a',
    glow: 'rgba(200,168,122,0.35)',
    shadow: 'rgba(200,168,122,0.15)',
    size: 52,
    gradient: 'radial-gradient(circle at 35% 35%, #d4b88a, #9a7a5a, #5a3a2a)',
    fact: 'The smallest planet dances closest to the Sun. Its surface scorches at 430°C by day, then plunges to −180°C at night — no atmosphere to remember the warmth.',
    orbit: '88 Earth days',
    moons: 0,
    type: 'Terrestrial'
  },
  {
    id: 'venus',
    name: 'Venus',
    color: '#e8d080',
    glow: 'rgba(232,208,128,0.35)',
    shadow: 'rgba(232,208,128,0.15)',
    size: 66,
    gradient: 'radial-gradient(circle at 35% 35%, #f0e090, #c8a840, #907820)',
    fact: 'Hotter than Mercury despite being farther from the Sun. Crushing CO₂ clouds trap heat in an eternal 465°C greenhouse. Beautiful from afar — lethal up close.',
    orbit: '225 Earth days',
    moons: 0,
    type: 'Terrestrial'
  },
  {
    id: 'earth',
    name: 'Earth',
    color: '#4a9de8',
    glow: 'rgba(74,157,232,0.35)',
    shadow: 'rgba(74,157,232,0.15)',
    size: 68,
    gradient: 'radial-gradient(circle at 35% 35%, #5ab0f0, #2a70c8, #0a3888)',
    fact: 'Our pale blue dot. The only known world harboring life — a fragile thin shell of atmosphere protecting billions of souls and countless stories from the cold void of space.',
    orbit: '365 Earth days',
    moons: 1,
    type: 'Terrestrial'
  },
  {
    id: 'mars',
    name: 'Mars',
    color: '#e07040',
    glow: 'rgba(224,112,64,0.35)',
    shadow: 'rgba(224,112,64,0.15)',
    size: 56,
    gradient: 'radial-gradient(circle at 35% 35%, #f08050, #c05030, #801810)',
    fact: 'The Red Planet dreams of ancient oceans. Iron oxide dust paints it crimson. Evidence of river valleys suggests Mars once harbored liquid water — and perhaps, life.',
    orbit: '687 Earth days',
    moons: 2,
    type: 'Terrestrial'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    color: '#e0c8a0',
    glow: 'rgba(224,200,160,0.35)',
    shadow: 'rgba(224,200,160,0.15)',
    size: 96,
    gradient: 'radial-gradient(circle at 35% 35%, #f0d8b0, #d0a870, #a07840)',
    rings: false,
    bands: true,
    fact: "The Great Red Spot is a storm that has raged for 350+ years — larger than Earth itself. Jupiter's immense gravity acts as a shield, deflecting asteroids that might otherwise threaten us.",
    orbit: '12 Earth years',
    moons: 95,
    type: 'Gas Giant'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    color: '#e8d8a8',
    glow: 'rgba(232,216,168,0.35)',
    shadow: 'rgba(232,216,168,0.15)',
    size: 82,
    gradient: 'radial-gradient(circle at 35% 35%, #f0e0b8, #d0c080, #a09040)',
    rings: true,
    fact: 'Its iconic rings span 282,000 km yet are just 10–100 meters thick. They are billions of ice and rock fragments — some as small as pebbles, others as large as houses.',
    orbit: '29 Earth years',
    moons: 146,
    type: 'Gas Giant'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    color: '#88ddee',
    glow: 'rgba(136,221,238,0.35)',
    shadow: 'rgba(136,221,238,0.15)',
    size: 70,
    gradient: 'radial-gradient(circle at 35% 35%, #aaeeff, #66ccdd, #3399aa)',
    rings: true,
    fact: 'Uranus rotates on its side — its axis tilted 98°, likely from a massive ancient collision. Its poles experience 42 years of continuous sunlight followed by 42 years of darkness.',
    orbit: '84 Earth years',
    moons: 28,
    type: 'Ice Giant'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    color: '#4466ee',
    glow: 'rgba(68,102,238,0.35)',
    shadow: 'rgba(68,102,238,0.15)',
    size: 68,
    gradient: 'radial-gradient(circle at 35% 35%, #6688ff, #3344cc, #112288)',
    fact: 'The windiest place in the solar system — winds on Neptune reach 2,100 km/h, faster than sound on Earth. Its largest moon Triton orbits backwards, a captured wanderer from the Kuiper Belt.',
    orbit: '165 Earth years',
    moons: 16,
    type: 'Ice Giant'
  },
]

export const PHENOMENA = [
  {
    id: 'blackhole',
    name: 'Black Hole',
    symbol: '●',
    colorVar: 'var(--accent-pink)',
    glowColor: 'rgba(255,85,187,0.45)',
    borderColor: 'rgba(255,85,187,0.25)',
    iconBg: 'radial-gradient(circle, #220011, #000000)',
    description: 'Where gravity becomes so extreme that even light cannot escape. At the singularity, the known laws of physics cease to exist — space and time themselves collapse.',
    fact2: 'The nearest black hole to Earth is Gaia BH1, just 1,560 light-years away.',
  },
  {
    id: 'supernova',
    name: 'Supernova',
    symbol: '✦',
    colorVar: 'var(--accent-gold)',
    glowColor: 'rgba(255,221,85,0.45)',
    borderColor: 'rgba(255,221,85,0.2)',
    iconBg: 'radial-gradient(circle, #221100, #0a0500)',
    description: "The death cry of a massive star — briefly outshining entire galaxies. In those final moments, it forges gold, silver, and every heavy element in the universe.",
    fact2: 'The iron in your blood was forged in a supernova explosion billions of years ago.',
  },
  {
    id: 'nebula',
    name: 'Nebula',
    symbol: '❋',
    colorVar: 'var(--accent-purple)',
    glowColor: 'rgba(153,85,255,0.45)',
    borderColor: 'rgba(153,85,255,0.2)',
    iconBg: 'radial-gradient(circle, #110022, #03000f)',
    description: 'Vast clouds of gas and dust — the birthplaces of stars. The Pillars of Creation in Eagle Nebula contain embryonic stars being sculpted by ultraviolet radiation.',
    fact2: 'The Orion Nebula is visible to the naked eye and contains over 3,000 young stars.',
  },
  {
    id: 'pulsar',
    name: 'Pulsar',
    symbol: '◎',
    colorVar: 'var(--accent-teal)',
    glowColor: 'rgba(85,255,221,0.40)',
    borderColor: 'rgba(85,255,221,0.2)',
    iconBg: 'radial-gradient(circle, #001a14, #000a08)',
    description: 'A rapidly rotating neutron star emitting precise beams of electromagnetic radiation. Some spin 700 times per second — nature\'s most accurate clocks.',
    fact2: 'Pulsars were initially nicknamed "LGM" — Little Green Men — their signals seemed too regular to be natural.',
  },
  {
    id: 'quasar',
    name: 'Quasar',
    symbol: '✺',
    colorVar: '#ffaa44',
    glowColor: 'rgba(255,170,68,0.45)',
    borderColor: 'rgba(255,170,68,0.22)',
    iconBg: 'radial-gradient(circle, #1a0d00, #080400)',
    description: 'The brightest objects in the universe — active galactic nuclei powered by supermassive black holes consuming matter at tremendous rates, outshining entire galaxies.',
    fact2: 'The most luminous quasar ever found shines 600 trillion times brighter than our Sun.',
  },
  {
    id: 'magnetar',
    name: 'Magnetar',
    symbol: '⊕',
    colorVar: '#55aaff',
    glowColor: 'rgba(85,170,255,0.45)',
    borderColor: 'rgba(85,170,255,0.22)',
    iconBg: 'radial-gradient(circle, #000d1a, #000508)',
    description: 'A neutron star with the most powerful magnetic field in the known universe — a quadrillion times stronger than Earth\'s. A magnetar 200,000 km away would erase every credit card on Earth.',
    fact2: 'In 2004, a magnetar 50,000 light-years away briefly illuminated Earth\'s ionosphere.',
  },
  {
    id: 'wormhole',
    name: 'Wormhole',
    symbol: '⌀',
    colorVar: '#aa55ff',
    glowColor: 'rgba(170,85,255,0.45)',
    borderColor: 'rgba(170,85,255,0.22)',
    iconBg: 'radial-gradient(circle, #0d0022, #050010)',
    description: 'A hypothetical tunnel through spacetime predicted by Einstein\'s equations — connecting two distant points in the universe or even different universes entirely.',
    fact2: 'For a wormhole to be traversable, it would require exotic matter with negative energy density — never yet observed.',
  },
  {
    id: 'darkmatter',
    name: 'Dark Matter',
    symbol: '◌',
    colorVar: '#778899',
    glowColor: 'rgba(119,136,153,0.40)',
    borderColor: 'rgba(119,136,153,0.2)',
    iconBg: 'radial-gradient(circle, #0a0a10, #030306)',
    description: 'An invisible substance comprising 27% of the universe. It cannot be seen, touched, or detected directly — yet its gravity holds galaxies together and shapes all cosmic structure.',
    fact2: 'Everything you can see — stars, planets, people — makes up only 5% of the universe. The rest is dark matter and dark energy.',
  },
]

export const UNIVERSE_MESSAGES = [
  "You are made of stardust — every atom in your body was forged in the heart of a dying star billions of years ago.",
  "In the vast silence of the cosmos, your voice still matters. The universe arranged itself precisely to bring you into existence.",
  "Even the smallest light can shine infinitely in the right kind of darkness. Your light is not small.",
  "You are not separate from the universe. You are the universe experiencing itself, wondering at its own wonder.",
  "The same gravity that holds galaxies together holds the people you love close to you. Gravity is just another word for belonging.",
  "Somewhere tonight, a star just died to scatter the elements that will one day become new worlds. Every ending seeds a beginning.",
  "Your existence is statistically miraculous. Against impossible cosmic odds — you are here, thinking, feeling, alive.",
  "Time is the universe's way of ensuring that everything doesn't happen at once. Yours is precious — spend it looking up.",
  "The light from distant stars you see tonight left before humans walked this earth. You are receiving ancient messages every time you look at the sky.",
  "In deep space, there is no up or down — only the direction you choose to travel. This is also true of life.",
]

export const DEEP_SPACE_LINES = [
  "Here, the nearest star is 4.24 light-years away.",
  "A single light-year spans 9.46 trillion kilometers.",
  "The observable universe contains an estimated 2 trillion galaxies.",
  "You are now beyond the reach of any human signal ever sent.",
  "In this silence, everything you thought was large becomes small.",
  "And yet — you are here, and you are thinking, and that is extraordinary.",
]


// ── Galaxy chart (DeepSpace) ───────────────────────────────────────────
// Posisi dihitung di GalaxyMap.jsx. Di sini hanya konten teks.
export const GALAXY_POINTS = [
  {
    id: 'sgra',
    name: 'Sagittarius A*',
    kind: 'Supermassive black hole',
    text: 'At the center of the Milky Way sits a black hole of about 4.3 million solar masses. Stars orbit it at nearly 3% of the speed of light. Its first image was released in 2022.',
    extra: 'Distance from Earth: ~26,000 light-years',
  },
  {
    id: 'sun',
    name: 'Solar System',
    kind: 'You are here',
    text: 'Everything humanity has ever known fits inside this single point. The Sun circles the galactic center at about 230 km/s, and one full lap takes roughly 230 million years.',
    extra: 'Last time the Sun was at this spot of its orbit, the first dinosaurs were appearing.',
  },
  {
    id: 'orion',
    name: 'Orion Spur',
    kind: 'Minor spiral arm · our neighborhood',
    text: 'A small bridge of stars about 3,500 light-years wide and 10,000 long, lying between the Sagittarius and Perseus arms. Our entire night sky belongs to it.',
    extra: 'Home of the Orion Nebula, ~1,350 light-years away',
  },
  {
    id: 'perseus',
    name: 'Perseus Arm',
    kind: 'Major spiral arm',
    text: 'One of the Milky Way’s dominant arms, rich in young blue stars and star-forming clouds. Looking toward it means looking outward, away from the galactic center.',
    extra: 'Roughly 6,000 light-years beyond the Sun',
  },
  {
    id: 'andromeda',
    name: 'Andromeda Galaxy (M31)',
    kind: 'Nearest large galaxy · off the chart',
    text: 'About a trillion stars, 2.5 million light-years away, and falling toward us at roughly 110 km/s. On a dark night it is visible to the naked eye as a faint smudge.',
    extra: 'A merger with the Milky Way was long predicted in ~5 billion years; newer studies call it closer to a coin flip.',
  },
]


// ── Skala alam semesta (DeepSpace) ─────────────────────────────────────
// `ly` = diameter dalam light-year, dipakai untuk menghitung faktor zoom antar level.
export const UNIVERSE_LEVELS = [
  {
    id: 'earth', short: 'Earth', name: 'Planet Earth', ly: 1.347e-9,
    tagline: 'Everything you have ever touched lives on this single sphere.',
    size: '12,742 km', light: ['Light crosses it in', '0.04 seconds'], holds: '~8 billion people',
  },
  {
    id: 'solar', short: 'Solar System', name: 'The Solar System', ly: 9.49e-4,
    tagline: 'Sunlight needs 8 minutes to reach Earth, and 4 hours to reach Neptune.',
    size: '~9 billion km (60 AU)', light: ['Light crosses it in', '8.3 hours'], holds: '1 star · 8 planets · 400+ moons',
  },
  {
    id: 'neighbors', short: 'Neighbors', name: 'Stellar Neighborhood', ly: 40,
    tagline: 'Even our closest neighbor is about 270,000 times farther away than the Sun.',
    size: '40 light-years', light: ['Light crosses it in', '40 years'], holds: '~80 star systems',
  },
  {
    id: 'milkyway', short: 'Milky Way', name: 'The Milky Way', ly: 1e5,
    tagline: 'Our Sun is one among hundreds of billions, 26,000 light-years from the center.',
    size: '~100,000 light-years', light: ['Light crosses it in', '100,000 years'], holds: '100–400 billion stars',
  },
  {
    id: 'localgroup', short: 'Local Group', name: 'The Local Group', ly: 1e7,
    tagline: 'Our galaxy is bound to dozens of others, with Andromeda as the closest large neighbor.',
    size: '~10 million light-years', light: ['Light crosses it in', '10 million years'], holds: '80+ galaxies',
  },
  {
    id: 'universe', short: 'Universe', name: 'The Observable Universe', ly: 9.3e10,
    tagline: 'Beyond this edge, light has not had time to reach us. Not yet.',
    size: '~93 billion light-years', light: ['Oldest light is', '13.8 billion years old'], holds: '200 billion to 2 trillion galaxies',
  },
]
