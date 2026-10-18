# ICrave — v1 (functional prototype)

A working web app for **ICrave: a map of dishes, not restaurants.** Each pin is
one specific dish at one place, planted by a real person. You don't rate pins —
you **claim** them: go, eat the thing, log proof.

This is a real, functional single-page app — real routing, real state that
mutates and persists. There's **no backend and no auth**: all users and data are
mocked client-side and saved to `localStorage`. One simulated city (San Francisco
/ Hayes Valley); claiming simulates arriving on site.

## Run

```bash
npm install
npm run dev     # http://localhost:5173
```

> This machine's default `node` (v15) is broken. Use nvm's v22:
> `export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"` before npm commands.

## It actually works

- **Claim the loop.** Open a dish → tap Claim → it simulates walking to the spot
  → "You're at LOQUAT ✓" → add a photo (optional) → log it. A claim card is
  minted, it shows in **Claims**, and the **planter gets notified**.
- **See both sides.** No login — in **Profile** you can switch which mock user
  you're "viewing as" (You, Gee, Das, Mira). Claim Gee's pin as You, switch to
  Gee, and see "You claimed your Sage-Feta Pastry" in Gee's Activity.
- **Plant a pin.** Plant → record / upload a photo / pick a dish icon → name it,
  vouch for it, set crave + adventure, add heads-up chips → drop it. The new pin
  appears on the map and can summon other users.
- **Go now.** A pin only lights up when all four facts are true (fresh, open,
  near, unclaimed). Claim it and it goes quiet.
- **Trails.** Progress tracks your real claims; claim all stops to unlock the
  souvenir.
- **It persists.** Reload and your claims, planted pins, notifications, and
  chosen accent are all still there. **Reset demo data** lives in Profile.

## Routes

`/` map · `/d/:id` dish · `/claim/:id` claim card · `/go` + `/go/:id` go-now ·
`/trails` + `/t/:id` trails · `/plant` (`/capture` `/vouch` `/done`) ·
`/claims` · `/activity` · `/profile`

## Visual direction

Dark night market, Archivo (condensed, heavy) for display, JetBrains Mono for
stats and labels, one hot accent (chili orange, switchable to acid yellow /
electric blue in Profile). Dish icons are photoreal PNGs generated with the
grubmaps icon generator.

## Stack

Vite + React + TypeScript + React Router. State is a reducer-backed store
(`src/store.tsx`) persisted to `localStorage`, seeded from `src/data.ts`.
Pages in `src/pages.tsx` and `src/PlantFlow.tsx`; shell in `src/AppShell.tsx`.
