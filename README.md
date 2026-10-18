# ICrave — v1 prototype

A tap-through mockup of ICrave: **a map of dishes, not restaurants.** Each pin is
one specific dish at one place, planted by a real person. You don't rate pins — you
**claim** them.

This is a UI/flow prototype only. Everything is mocked: users (You, Gee, Das, Mira),
dishes, trails, the geofence, and the camera. No backend, no auth.

## Run

```bash
npm install
npm run dev     # http://localhost:5173
```

> This machine's default `node` (v15) is broken (missing icu4c). Use nvm's v22:
> `export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"` before npm commands.

## What's here — 10 screens, 3 flows

Use the **Jump to screen** list (right of the phone) to visit any screen, or tap
through naturally.

**Flow 1 · Summon → claim → trail**

1. **Map** — the summon. Dish pins (not venues); the fresh one glows.
2. **Dish pin** — decide to go. Clip, voucher note, crave/adventure. Claim unlocks
   only on site.
3. **Claim card** — the artifact. `CLAIMED`, your photo, claim #, editorial stats.
4. **Trail** — "Hayes Valley Crave Run", progress, a sold-out report, souvenir badge.

**Flow 2 · Planting** — P1 Plant a pin → P2 Capture (10s cap) → P3 Vouch for it →
P4 Pin dropped.

**Flow 3 · Go now** — N1 Go-now map (loud / quiet / dimmed pin states, filter) →
N2 Go-now pin (four checked facts + plain-language heads-up).

## Tweaks panel

- **Accent** — chili orange (default), acid yellow, electric blue. Recolors the
  whole theme live, matching the brief's switchable accents.
- **Simulate: "I'm at the location"** — mock geofence. Flip it on, open a dish pin,
  and the **Claim** button unlocks (it's locked otherwise).

## Visual direction

Dark night market, Archivo (condensed, heavy) for display, JetBrains Mono for stats
and labels. Built to match the ICrave v1 Design Brief.

## Stack

Vite + React + TypeScript. State is a tiny in-memory nav context (`src/nav.tsx`);
mock data lives in `src/data.ts`; all screens in `src/screens.tsx`.
