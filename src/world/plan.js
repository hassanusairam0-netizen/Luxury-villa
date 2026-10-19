// The villa floor plan. All dimensions are metres; the main floor is y = 0.
// +x runs west → east along the coastline, +z points south toward the sea.
// Room rectangles are clear interior dimensions: [x0, x1, z0, z1].

export const H = {
  public: 4.2, // living / kitchen / dining ceiling
  publicRoof: 4.75,
  private: 3.2, // bedroom wing ceiling
  corridor: 3.0,
  privateRoof: 3.75,
  hall: 7.0, // double-height entrance hall
  hallRoof: 7.5,
  gallery: 7.4, // double-height stair gallery
  galleryRoof: 7.9,
  door: 2.85,
};

export const EXT = 0.35; // exterior wall thickness (core + stone cladding)
export const INT = 0.15; // interior partition thickness

export const ROOMS = [
  { id: 'hall', num: 1, name: 'Entrance Hall', rect: [-23, -16, -5, 2],
    quote: 'An introduction to the art of considered living.',
    notes: ['Double-height · 7.0 m', 'Honed travertine', 'Hand-blown glass pendant'] },
  { id: 'living', num: 2, name: 'Grand Living Room', rect: [-16, -2, -6, 6],
    quote: 'Space, light, and a connection to the landscape.',
    notes: ['14 m of frameless glazing', 'Monolithic stone fireplace', 'South-facing to the sea'] },
  { id: 'kitchen', num: 3, name: "Chef's Kitchen", rect: [-2, 5.6, -6, 6],
    quote: 'Where craftsmanship meets everyday ritual.',
    notes: ['5.4 m book-matched marble island', 'Walnut joinery', 'Integrated appliances'] },
  { id: 'dining', num: 4, name: 'The Dining Room', rect: [5.6, 11, -6, 6],
    quote: 'Designed for gathering. Made for lasting memories.',
    notes: ['Seats eight', 'Solid oak on travertine pedestals', 'Alabaster linear pendant'] },
  { id: 'master', num: 5, name: 'Master Bedroom', rect: [15, 24, -4, 6],
    quote: 'A private retreat, shaped by light and tranquillity.',
    notes: ['Wide-plank European oak', 'Upholstered wall headboard', 'Private sea terrace'] },
  { id: 'dressing', num: 6, name: 'Dressing Suite', rect: [24, 28.5, -4, 6],
    quote: 'Everyday essentials, elevated.',
    notes: ['Bronze-glass wardrobes', 'Integrated warm lighting', 'Leather-topped island'] },
  { id: 'spa', num: 7, name: 'Private Spa', rect: [28.5, 35, -4, 6],
    quote: 'A quieter kind of luxury.',
    notes: ['Sculptural freestanding bath', 'Book-matched stone walls', 'Brushed bronze fittings'] },
  { id: 'guest', num: 8, name: 'Guest Suite', rect: [35, 42, -4, 6],
    quote: 'Designed with the same attention to every detail.',
    notes: ['Oak-slatted headboard wall', 'Private ensuite', 'Garden and sea aspect'] },
  { id: 'gallery', num: 9, name: 'The Architecture', rect: [42, 48, -6, 6],
    quote: 'Every transition is part of the experience.',
    notes: ['Cantilevered oak stair', 'Full-height light well', 'Bridge to the roof terrace'] },
];

// Spaces that are walked through but are not numbered chapters.
export const PASSAGES = [
  { id: 'corridor', name: 'The Gallery Corridor', rect: [11, 42, -6, -4] },
];

export const OUTDOOR = {
  id: 'outdoor', num: 10, name: 'Outdoor Living',
  quote: 'Where the architecture dissolves into the landscape.',
  notes: ['28 m infinity-edge pool', 'Covered dining pergola', 'Centuries-old olive trees'],
};

export const ARRIVAL = {
  id: 'arrival', num: 0, name: 'The Arrival',
  quote: 'An understated entrance. An unforgettable first impression.',
  notes: ['Olive-lined approach', 'Pivoting walnut doors', 'Cantilevered stone canopy'],
};

export const CHAPTERS = [...ROOMS, OUTDOOR];

export function roomAt(x, z) {
  for (const r of ROOMS) {
    const [x0, x1, z0, z1] = r.rect;
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return r;
  }
  for (const p of PASSAGES) {
    const [x0, x1, z0, z1] = p.rect;
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return p;
  }
  return null;
}

// Key positions shared by architecture, furniture and the camera path.
export const P = {
  door: { x: -23, z0: -2.8, z1: -0.2, h: 3.6 },
  hallOpening: { z0: -4, z1: 1, h: 3.6 },
  partition: { x0: -2.35, x1: -1.65, z0: -3.5, z1: 2.5 },
  corridorDoorKD: { z0: -5.85, z1: -4.15 },
  masterDoor: [15.4, 16.6],
  spaDoor: [28.9, 30.1],
  guestDoor: [35.6, 36.8],
  powderDoor: [12.2, 13.1],
  masterToDressing: [0.2, 1.6],
  dressingToSpa: [-0.9, 0.5],
  gallerySlider: { x0: 42.1, x1: 45.0 },
  pool: { x0: -13.6, x1: 13.6, z0: 9.8, z1: 15.0, water: -0.07 },
  terraceEdge: 16.0,
};
