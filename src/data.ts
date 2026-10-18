// Mock data for the ICrave prototype. No backend, no auth — just enough to
// make the three flows feel real when you tap through them.

export type User = {
  id: string;
  name: string;
  handle: string;
  emoji: string;
  bio: string;
};

export type HeadsUp = "Sells out early" | "Weekends only" | "Ask for it" | "Cash only";

export type PinState = "loud" | "quiet" | "dimmed";

export type Dish = {
  id: string;
  dish: string;
  spot: string;
  plantedBy: string; // user id
  distanceKm: number;
  walkMin: number;
  hours: string;
  openNow: boolean;
  pinnedAgo: string; // human string
  freshHours: number; // hours since planted
  crave: number; // 1..5
  adventure: number; // 1..5
  voucher: string;
  headsUp: HeadsUp[];
  claims: number;
  emoji: string;
  // map placement in the stylized canvas, 0..100 percentage
  x: number;
  y: number;
};

export type TrailStop = {
  dishId: string;
  claimed: boolean;
  soldOutReportBy?: string; // user id
};

export type Trail = {
  id: string;
  name: string;
  author: string; // user id
  neighborhood: string;
  stops: TrailStop[];
  souvenir: string;
};

export const USERS: Record<string, User> = {
  you: {
    id: "you",
    name: "You",
    handle: "@you",
    emoji: "🫵",
    bio: "New to the map. Here to claim.",
  },
  gee: {
    id: "gee",
    name: "Gee",
    handle: "@gee",
    emoji: "🧭",
    bio: "Plants the good ones. Taste you can trust.",
  },
  das: {
    id: "das",
    name: "Das",
    handle: "@das",
    emoji: "🍜",
    bio: "Always three stops ahead on the trail.",
  },
  mira: {
    id: "mira",
    name: "Mira",
    handle: "@mira",
    emoji: "🌶️",
    bio: "Spice tolerance: reckless.",
  },
};

export const DISHES: Record<string, Dish> = {
  pastry: {
    id: "pastry",
    dish: "Sage-Feta Pastry",
    spot: "LOQUAT",
    plantedBy: "gee",
    distanceKm: 0.4,
    walkMin: 6,
    hours: "Open till 3 PM",
    openNow: true,
    pinnedAgo: "12 min ago",
    freshHours: 0.2,
    crave: 5,
    adventure: 3,
    voucher:
      "The feta hits before the sage and then the whole thing shatters. Get it warm, first thing. They do maybe forty a day.",
    headsUp: ["Sells out early", "Cash only"],
    claims: 0,
    emoji: "🥐",
    x: 52,
    y: 38,
  },
  noodles: {
    id: "noodles",
    dish: "Dan Dan, Extra Numb",
    spot: "MA LA HOUSE",
    plantedBy: "mira",
    distanceKm: 0.9,
    walkMin: 12,
    hours: "Open till 10 PM",
    openNow: true,
    pinnedAgo: "3 hr ago",
    freshHours: 3,
    crave: 5,
    adventure: 5,
    voucher:
      "Ask for it off-menu, extra numb. Your lips will buzz for an hour. Worth every second.",
    headsUp: ["Ask for it"],
    claims: 4,
    emoji: "🍜",
    x: 28,
    y: 62,
  },
  taco: {
    id: "taco",
    dish: "Birria Taco, Single",
    spot: "EL PASTORITO",
    plantedBy: "das",
    distanceKm: 2.3,
    walkMin: 29,
    hours: "Open till 11 PM",
    openNow: true,
    pinnedAgo: "6 hr ago",
    freshHours: 6,
    crave: 4,
    adventure: 2,
    voucher: "One taco, dunked, no sides. The consommé is the whole argument.",
    headsUp: ["Cash only"],
    claims: 11,
    emoji: "🌮",
    x: 74,
    y: 70,
  },
  gelato: {
    id: "gelato",
    dish: "Olive Oil Gelato",
    spot: "FREDA",
    plantedBy: "gee",
    distanceKm: 0.6,
    walkMin: 8,
    hours: "Opens 5 PM",
    openNow: false,
    pinnedAgo: "1 hr ago",
    freshHours: 1,
    crave: 4,
    adventure: 3,
    voucher: "Sounds wrong, tastes like a secret. A pinch of flaky salt on top.",
    headsUp: ["Weekends only"],
    claims: 2,
    emoji: "🍦",
    x: 60,
    y: 22,
  },
  dumpling: {
    id: "dumpling",
    dish: "Soup Dumpling, Crab",
    spot: "JUN'S",
    plantedBy: "das",
    distanceKm: 1.4,
    walkMin: 18,
    hours: "Open till 9 PM",
    openNow: true,
    pinnedAgo: "5 hr ago",
    freshHours: 5,
    crave: 5,
    adventure: 2,
    voucher: "Bite the top, sip, then eat. Don't rush the first one or you'll burn.",
    headsUp: [],
    claims: 7,
    emoji: "🥟",
    x: 40,
    y: 44,
  },
};

export const TRAILS: Record<string, Trail> = {
  hayes: {
    id: "hayes",
    name: "Hayes Valley Crave Run",
    author: "gee",
    neighborhood: "Hayes Valley",
    souvenir: "Hayes Valley Regular",
    stops: [
      { dishId: "pastry", claimed: true },
      { dishId: "gelato", claimed: false },
      { dishId: "dumpling", claimed: false, soldOutReportBy: "das" },
      { dishId: "noodles", claimed: false },
      { dishId: "taco", claimed: false },
      { dishId: "pastry", claimed: false },
    ],
  },
};

// The map screen highlights this pin as the summon.
export const SUMMONED_PIN = "pastry";

// Pin state used by the "Go now" map (N1). Derived here for the mock.
export function pinState(d: Dish): PinState {
  if (!d.openNow) return "dimmed";
  const isNear = d.distanceKm <= 0.8;
  const isFresh = d.freshHours <= 24;
  const isUnclaimed = d.claims === 0;
  if (isNear && isFresh && isUnclaimed && d.openNow) return "loud";
  return "quiet";
}

// A pin earns "Go now" only when all four facts are true.
export function goNowFacts(d: Dish) {
  return {
    fresh: { ok: d.freshHours <= 24, label: `Pinned ${d.pinnedAgo}` },
    open: { ok: d.openNow, label: d.hours },
    near: { ok: d.distanceKm <= 0.8, label: `${d.walkMin} min walk` },
    unclaimed: {
      ok: d.claims === 0,
      label: d.claims === 0 ? "Be first to claim" : `${d.claims} claims`,
    },
  };
}

export function isGoNow(d: Dish): boolean {
  const f = goNowFacts(d);
  return f.fresh.ok && f.open.ok && f.near.ok && f.unclaimed.ok;
}
