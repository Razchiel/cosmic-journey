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
]

export const PHENOMENA = [
  {
    id: 'blackhole',
    name: 'Black Hole',
    symbol: '●',
    colorVar: 'var(--accent-pink)',
    glowColor: 'rgba(255,68,170,0.4)',
    borderColor: 'rgba(255,68,170,0.25)',
    iconBg: 'radial-gradient(circle, #220011, #000000)',
    description: 'Where gravity becomes so extreme that even light cannot escape. At the singularity, the known laws of physics cease to exist — space and time themselves collapse.',
    fact2: 'The nearest black hole to Earth is Gaia BH1, just 1,560 light-years away.',
  },
  {
    id: 'supernova',
    name: 'Supernova',
    symbol: '✦',
    colorVar: 'var(--accent-gold)',
    glowColor: 'rgba(255,204,68,0.4)',
    borderColor: 'rgba(255,204,68,0.2)',
    iconBg: 'radial-gradient(circle, #221100, #0a0500)',
    description: "The death cry of a massive star — briefly outshining entire galaxies. In those final moments, it forges gold, silver, and every heavy element in the universe.",
    fact2: 'The iron in your blood was forged in a supernova explosion billions of years ago.',
  },
  {
    id: 'nebula',
    name: 'Nebula',
    symbol: '❋',
    colorVar: 'var(--accent-purple)',
    glowColor: 'rgba(136,68,255,0.4)',
    borderColor: 'rgba(136,68,255,0.2)',
    iconBg: 'radial-gradient(circle, #110022, #03000f)',
    description: 'Vast clouds of gas and dust — the birthplaces of stars. The Pillars of Creation in Eagle Nebula contain embryonic stars being sculpted by ultraviolet radiation.',
    fact2: 'The Orion Nebula is visible to the naked eye and contains over 3,000 young stars.',
  },
  {
    id: 'pulsar',
    name: 'Pulsar',
    symbol: '◎',
    colorVar: 'var(--accent-teal)',
    glowColor: 'rgba(68,255,204,0.35)',
    borderColor: 'rgba(68,255,204,0.2)',
    iconBg: 'radial-gradient(circle, #001a14, #000a08)',
    description: 'A rapidly rotating neutron star emitting precise beams of electromagnetic radiation. Some spin 700 times per second — nature\'s most accurate clocks.',
    fact2: 'Pulsars were initially nicknamed "LGM" — Little Green Men — because their signals seemed too regular to be natural.',
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
