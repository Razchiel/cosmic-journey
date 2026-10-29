// ============================================================
// COSMIC JOURNEY: Data (Planets, Phenomena, Messages)
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
    fact: 'The smallest planet is also the closest to the Sun. By day the surface reaches 430°C. At night it drops to −180°C, because there is almost no atmosphere to hold the heat.',
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
    fact: 'Venus is hotter than Mercury, even though it is farther from the Sun. Thick carbon dioxide clouds trap the heat and keep the surface near 465°C. It looks gentle from far away. Up close, no one could survive it.',
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
    fact: 'Our pale blue dot is the only world known to host life. A thin layer of air protects every person and every story we know from the cold of space.',
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
    fact: 'Iron oxide dust gives Mars its red color. River valleys suggest that liquid water once flowed there. Whether life ever did too is still an open question.',
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
    fact: "The Great Red Spot is a storm that has lasted more than 350 years, and it is bigger than Earth. Jupiter's strong gravity also deflects some asteroids that might otherwise threaten us.",
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
    fact: 'The rings span 282,000 km but are only about 10 to 100 meters thick. They are made of billions of pieces of ice and rock, from grains the size of pebbles to chunks as big as houses.',
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
    fact: 'Uranus spins on its side. Its axis is tilted 98°, probably from a huge collision long ago. Each pole gets 42 years of sunlight, then 42 years of darkness.',
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
    fact: 'Neptune has the fastest winds in the solar system, up to 2,100 km/h. That is faster than sound travels on Earth. Its largest moon, Triton, orbits backwards, a sign that it was captured from the Kuiper Belt.',
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
    description: 'A region where gravity is so strong that not even light can escape. At the singularity, our current laws of physics break down.',
    fact2: 'The nearest known black hole to Earth is Gaia BH1, about 1,560 light-years away.',
  },
  {
    id: 'supernova',
    name: 'Supernova',
    symbol: '✦',
    colorVar: 'var(--accent-gold)',
    glowColor: 'rgba(255,221,85,0.45)',
    borderColor: 'rgba(255,221,85,0.2)',
    iconBg: 'radial-gradient(circle, #221100, #0a0500)',
    description: 'A massive star ends its life in an explosion that can briefly outshine its whole galaxy. The blast spreads heavy elements, such as iron, into space.',
    fact2: 'Much of the iron in your blood was made in a supernova billions of years ago.',
  },
  {
    id: 'nebula',
    name: 'Nebula',
    symbol: '❋',
    colorVar: 'var(--accent-purple)',
    glowColor: 'rgba(153,85,255,0.45)',
    borderColor: 'rgba(153,85,255,0.2)',
    iconBg: 'radial-gradient(circle, #110022, #03000f)',
    description: 'A vast cloud of gas and dust where stars are born. In the Pillars of Creation, part of the Eagle Nebula, young stars are still forming while ultraviolet light wears away the gas around them.',
    fact2: 'The Orion Nebula is visible to the naked eye. It holds more than 3,000 young stars.',
  },
  {
    id: 'pulsar',
    name: 'Pulsar',
    symbol: '◎',
    colorVar: 'var(--accent-teal)',
    glowColor: 'rgba(85,255,221,0.40)',
    borderColor: 'rgba(85,255,221,0.2)',
    iconBg: 'radial-gradient(circle, #001a14, #000a08)',
    description: 'A fast-spinning neutron star that sends out beams of radiation. Some spin about 700 times a second, and their pulses arrive so regularly that they work like clocks.',
    fact2: 'Pulsars were first nicknamed "LGM", for Little Green Men, because their signals seemed too regular to be natural.',
  },
  {
    id: 'quasar',
    name: 'Quasar',
    symbol: '✺',
    colorVar: '#ffaa44',
    glowColor: 'rgba(255,170,68,0.45)',
    borderColor: 'rgba(255,170,68,0.22)',
    iconBg: 'radial-gradient(circle, #1a0d00, #080400)',
    description: "Among the brightest objects in the universe. A supermassive black hole at a galaxy's center feeds on gas at a huge rate, and the glow can outshine all the stars around it.",
    fact2: 'The most luminous quasar found so far shines about 600 trillion times brighter than the Sun.',
  },
  {
    id: 'magnetar',
    name: 'Magnetar',
    symbol: '⊕',
    colorVar: '#55aaff',
    glowColor: 'rgba(85,170,255,0.45)',
    borderColor: 'rgba(85,170,255,0.22)',
    iconBg: 'radial-gradient(circle, #000d1a, #000508)',
    description: "A neutron star with the strongest magnetic field known, about a quadrillion times stronger than Earth's. From 200,000 km away, it would wipe every credit card on Earth.",
    fact2: "In 2004, a flare from a magnetar 50,000 light-years away briefly changed Earth's ionosphere.",
  },
  {
    id: 'wormhole',
    name: 'Wormhole',
    symbol: '⌀',
    colorVar: '#aa55ff',
    glowColor: 'rgba(170,85,255,0.45)',
    borderColor: 'rgba(170,85,255,0.22)',
    iconBg: 'radial-gradient(circle, #0d0022, #050010)',
    description: "A theoretical tunnel through spacetime, allowed by Einstein's equations. It could connect two distant places in the universe, or even two different universes.",
    fact2: 'A wormhole you could pass through would need exotic matter with negative energy density. No one has ever observed such matter.',
  },
  {
    id: 'darkmatter',
    name: 'Dark Matter',
    symbol: '◌',
    colorVar: '#778899',
    glowColor: 'rgba(119,136,153,0.40)',
    borderColor: 'rgba(119,136,153,0.2)',
    iconBg: 'radial-gradient(circle, #0a0a10, #030306)',
    description: 'An invisible substance that makes up about 27% of the universe. No one has detected it directly, but its gravity holds galaxies together and shapes the large-scale structure of the cosmos.',
    fact2: 'Everything you can see, including stars, planets, and people, is only about 5% of the universe. The rest is dark matter and dark energy.',
  },
]

export const UNIVERSE_MESSAGES = [
  "You are made of stardust. Most of the atoms in your body were made inside stars that died billions of years ago.",
  "The universe is huge and quiet. Your voice still matters in it.",
  "A small light is easy to see in a dark place. Yours is easier to see than you think.",
  "You are part of the universe, made of the same matter as the stars you are looking at.",
  "The same gravity that holds galaxies together keeps you and the people you love on the ground.",
  "Somewhere tonight, a star is dying and spreading its elements into space. Some of that material will become new stars and planets.",
  "The odds of you existing were very small. You are here anyway, thinking and feeling.",
  "Time is what keeps everything from happening at once. Spend some of yours looking up.",
  "Some of the starlight you see tonight left its star thousands of years ago. The faint smudge of Andromeda sends light that is 2.5 million years old.",
  "In deep space there is no up or down. There is only the direction you choose to go.",
]

export const DEEP_SPACE_LINES = [
  "From Earth, the nearest star is 4.24 light-years away.",
  "A single light-year spans 9.46 trillion kilometers.",
  "Estimates for the observable universe run up to 2 trillion galaxies.",
  "No signal humans have ever sent has come this far.",
  "Out here, the Sun is too faint to see.",
  "Still, you are here, taking it all in.",
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
    extra: 'The last time the Sun was at this spot in its orbit, the first dinosaurs were appearing.',
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
    extra: 'A merger with the Milky Way was long predicted in ~5 billion years. Newer studies put the odds closer to a coin flip.',
  },
]

// ── Skala alam semesta (DeepSpace) ─────────────────────────────────────
// `ly` = diameter dalam light-year, dipakai untuk menghitung faktor zoom antar level.
export const UNIVERSE_LEVELS = [
  {
    id: 'earth', short: 'Earth', name: 'Planet Earth', ly: 1.347e-9,
    fact: '12,742 km across. Light crosses it in 0.04 seconds.',
    line: 'Everything you have ever touched lives on this one sphere.',
  },
  {
    id: 'solar', short: 'Solar System', name: 'The Solar System', ly: 9.49e-4,
    fact: 'About 9 billion km across. Light crosses it in 8.3 hours.',
    line: 'Eight planets circle one star, and we live on the third.',
  },
  {
    id: 'neighbors', short: 'Neighbors', name: 'Stellar Neighborhood', ly: 40,
    fact: '40 light-years across, with about 80 star systems. Light crosses it in 40 years.',
    line: 'Even our nearest neighbor is a very long way from home.',
  },
  {
    id: 'milkyway', short: 'Milky Way', name: 'The Milky Way', ly: 1e5,
    fact: 'About 100,000 light-years across. Light crosses it in 100,000 years.',
    line: 'Hundreds of billions of stars, and our Sun is just one of them.',
  },
  {
    id: 'localgroup', short: 'Local Group', name: 'The Local Group', ly: 1e7,
    fact: 'About 10 million light-years across, with 80+ galaxies. Light crosses it in 10 million years.',
    line: 'Even galaxies keep each other company.',
  },
  {
    id: 'universe', short: 'Universe', name: 'The Observable Universe', ly: 9.3e10,
    fact: 'About 93 billion light-years across. The oldest light is 13.8 billion years old.',
    line: 'Beyond this edge, light has not had time to reach us. Not yet.',
  },
]