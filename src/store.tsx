import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  CITY,
  DISHES,
  TRAILS,
  USERS,
  type Dish,
  type HeadsUp,
  type Trail,
  type User,
} from "./data";

export type Accent = "chili" | "acid" | "blue";

export type Claim = {
  id: string;
  dishId: string;
  userId: string; // who claimed
  at: number; // epoch ms
  order: number; // claim number (1 = first)
  first: boolean;
  photo?: string; // data URL
};

export type Notif = {
  id: string;
  to: string; // recipient user id
  kind: "summon" | "claimed" | "welcome";
  text: string;
  at: number;
  read: boolean;
  dishId?: string;
  fromName?: string;
};

export type State = {
  currentUserId: string;
  users: Record<string, User>;
  dishes: Record<string, Dish>;
  dishOrder: string[];
  trails: Record<string, Trail>;
  claims: Claim[];
  notifications: Notif[];
  goingIds: string[]; // dishes current user marked "I'm going"
  accent: Accent;
};

export type PlantInput = {
  dish: string;
  spot: string;
  voucher: string;
  crave: number;
  adventure: number;
  headsUp: HeadsUp[];
  iconId?: string;
  photo?: string;
};

const STORAGE_KEY = "icrave:v2";
const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;

function seed(): State {
  const dishes: Record<string, Dish> = {};
  for (const [k, v] of Object.entries(DISHES)) dishes[k] = { ...v };
  const now = Date.now();
  return {
    currentUserId: "you",
    users: { ...USERS },
    dishes,
    dishOrder: Object.keys(DISHES),
    trails: { ...TRAILS },
    claims: [],
    goingIds: [],
    accent: "chili",
    notifications: [
      {
        id: uid(),
        to: "you",
        kind: "summon",
        text: "Gee pinned Sage-Feta Pastry · 0.4 km away",
        at: now - 1000 * 60 * 12,
        read: false,
        dishId: "pastry",
        fromName: "Gee",
      },
      {
        id: uid(),
        to: "you",
        kind: "welcome",
        text: "Welcome to ICrave. Go claim your first dish.",
        at: now - 1000 * 60 * 30,
        read: false,
      },
      // the planter side of the loop, waiting for you if you switch to Gee
      {
        id: uid(),
        to: "gee",
        kind: "claimed",
        text: "Mira claimed your Olive Oil Gelato",
        at: now - 1000 * 60 * 60 * 2,
        read: false,
        dishId: "gelato",
        fromName: "Mira",
      },
    ],
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as State;
    if (!parsed.dishes || !parsed.users) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

type Action =
  | { type: "PLANT"; input: PlantInput }
  | { type: "CLAIM"; dishId: string; photo?: string }
  | { type: "TOGGLE_GOING"; dishId: string }
  | { type: "SWITCH_USER"; userId: string }
  | { type: "READ_NOTIFS" }
  | { type: "SET_ACCENT"; accent: Accent }
  | { type: "RESET" };

// total displayed claims for a dish = seed baseline + session claims
export function totalClaims(state: State, dishId: string): number {
  const base = state.dishes[dishId]?.claims ?? 0;
  const session = state.claims.filter((c) => c.dishId === dishId).length;
  return base + session;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PLANT": {
      const { input } = action;
      const id = uid();
      const dish: Dish = {
        id,
        dish: input.dish.trim() || "New Dish",
        spot: input.spot || CITY.area,
        plantedBy: state.currentUserId,
        distanceKm: 0.1,
        walkMin: 2,
        hours: "Open now",
        openNow: true,
        pinnedAgo: "just now",
        freshHours: 0,
        crave: input.crave,
        adventure: input.adventure,
        voucher: input.voucher.trim(),
        headsUp: input.headsUp,
        claims: 0,
        emoji: "📍",
        area: CITY.area,
        iconId: input.iconId,
        photo: input.photo,
        custom: true,
        // drop it near "you" with a little scatter (~a few blocks)
        lat: CITY.me.lat + (Math.random() - 0.5) * 0.006,
        lng: CITY.me.lng + (Math.random() - 0.5) * 0.006,
      };
      return {
        ...state,
        dishes: { ...state.dishes, [id]: dish },
        dishOrder: [id, ...state.dishOrder],
      };
    }
    case "CLAIM": {
      const dish = state.dishes[action.dishId];
      if (!dish) return state;
      const order = totalClaims(state, action.dishId) + 1;
      const claim: Claim = {
        id: uid(),
        dishId: action.dishId,
        userId: state.currentUserId,
        at: Date.now(),
        order,
        first: order === 1,
        photo: action.photo,
      };
      const claimer = state.users[state.currentUserId];
      const notifs: Notif[] = [];
      // notify the planter that their taste landed (unless you claimed your own)
      if (dish.plantedBy !== state.currentUserId) {
        notifs.push({
          id: uid(),
          to: dish.plantedBy,
          kind: "claimed",
          text: `${claimer.name} claimed your ${dish.dish}`,
          at: Date.now(),
          read: false,
          dishId: dish.id,
          fromName: claimer.name,
        });
      }
      return {
        ...state,
        claims: [claim, ...state.claims],
        notifications: [...notifs, ...state.notifications],
        goingIds: state.goingIds.filter((g) => g !== action.dishId),
      };
    }
    case "TOGGLE_GOING": {
      const on = state.goingIds.includes(action.dishId);
      return {
        ...state,
        goingIds: on
          ? state.goingIds.filter((g) => g !== action.dishId)
          : [...state.goingIds, action.dishId],
      };
    }
    case "SWITCH_USER":
      return { ...state, currentUserId: action.userId };
    case "READ_NOTIFS":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.to === state.currentUserId ? { ...n, read: true } : n,
        ),
      };
    case "SET_ACCENT":
      return { ...state, accent: action.accent };
    case "RESET":
      return seed();
    default:
      return state;
  }
}

type Store = {
  state: State;
  me: User;
  dispatch: Dispatch<Action>;
  // selectors
  dishList: Dish[];
  claimsFor: (userId: string) => Claim[];
  hasClaimed: (dishId: string, userId?: string) => boolean;
  claimById: (claimId: string) => Claim | undefined;
  totalClaims: (dishId: string) => number;
  myNotifs: Notif[];
  unreadCount: number;
  trailProgress: (trail: Trail) => {
    claimed: number;
    total: number;
    stops: { dishId: string; done: boolean; soldOutReportBy?: string }[];
  };
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full (big photos) — ignore; app keeps working in-memory
    }
  }, [state]);

  // reflect accent on <html> so CSS variables apply app-wide
  useEffect(() => {
    document.documentElement.dataset.accent = state.accent;
  }, [state.accent]);

  const value = useMemo<Store>(() => {
    const me = state.users[state.currentUserId];
    const dishList = state.dishOrder.map((id) => state.dishes[id]).filter(Boolean);
    const claimsFor = (userId: string) => state.claims.filter((c) => c.userId === userId);
    const hasClaimed = (dishId: string, userId = state.currentUserId) =>
      state.claims.some((c) => c.dishId === dishId && c.userId === userId);
    const myNotifs = state.notifications
      .filter((n) => n.to === state.currentUserId)
      .sort((a, b) => b.at - a.at);
    return {
      state,
      me,
      dispatch,
      dishList,
      claimsFor,
      hasClaimed,
      claimById: (claimId) => state.claims.find((c) => c.id === claimId),
      totalClaims: (dishId) => totalClaims(state, dishId),
      myNotifs,
      unreadCount: myNotifs.filter((n) => !n.read).length,
      trailProgress: (trail) => {
        const stops = trail.stops.map((s) => ({
          dishId: s.dishId,
          done: hasClaimed(s.dishId),
          soldOutReportBy: s.soldOutReportBy,
        }));
        // count unique claimed dishes toward progress
        const uniqueClaimed = new Set(stops.filter((s) => s.done).map((s) => s.dishId));
        return { claimed: uniqueClaimed.size, total: trail.stops.length, stops };
      },
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export { uid };
