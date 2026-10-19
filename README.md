# The Art of Living — an interactive 3D villa walkthrough

A scroll-driven, cinematic walkthrough of a contemporary Mediterranean villa built with
Three.js, GSAP ScrollTrigger and Lenis. Scrolling moves one continuous camera path from the
olive-lined approach, through the pivoting entrance doors, the double-height hall, living room,
kitchen, dining room, master suite, dressing room, spa, guest suite and stair gallery, out onto
the infinity-pool terrace and into a golden-hour finale.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

Quality presets (URL query): `?q=low` (phones), default (desktop), `?q=ultra` (native resolution,
e.g. full 4K, with 8K shadow maps). Add `?reduced` to test the reduced-motion mode.

## How it is built

- `src/world/plan.js` — the floor plan: every room rectangle, door and opening (single source of truth).
- `src/world/villa.js` — architecture: slabs, stone-clad walls, glazing, roofs, skylights, doors, stair, pool.
- `src/world/interiors.js`, `furniture.js` — parametric furniture and the furnishing of each room.
- `src/world/landscape.js` — hillside terrain, sea, olive/cypress/lavender vegetation, terrace furniture.
- `src/journey/path.js` — the authored camera keyframes (position, focus, exposure, time of day).
- `src/ui/ui.js` — location indicator, chapter cards, room selector, finale.

All geometry and textures are generated procedurally in code — there are no photo-scanned assets.

## QA tools

- `node tools/check-path.mjs` — samples the camera path 6,000 times against every wall, glass pane and
  furniture collider, and checks terrain clearance.
- `node tools/shoot.mjs <url> all` — renders a screenshot at every keyframe.
- `node tools/interact.mjs` — scroll forward/back, room selector, restart, mobile overflow.
