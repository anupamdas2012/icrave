import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Screen =
  | "map"
  | "dish"
  | "claim"
  | "trail"
  | "plant-start"
  | "plant-capture"
  | "plant-vouch"
  | "plant-done"
  | "gonow-map"
  | "gonow-pin"
  | "claims"
  | "profile";

export type Accent = "chili" | "acid" | "blue";

export type PlantDraft = {
  mediaKind: "video" | "photo";
  dish: string;
  voucher: string;
  crave: number;
  adventure: number;
  headsUp: string[];
};

export const emptyDraft: PlantDraft = {
  mediaKind: "video",
  dish: "",
  voucher: "",
  crave: 4,
  adventure: 3,
  headsUp: [],
};

type NavState = {
  screen: Screen;
  activeDishId: string;
  accent: Accent;
  atLocation: boolean; // mock geofence: pretend you're standing at the spot
  draft: PlantDraft;
  go: (screen: Screen, dishId?: string) => void;
  setAccent: (a: Accent) => void;
  setAtLocation: (v: boolean) => void;
  setDraft: (patch: Partial<PlantDraft>) => void;
  resetDraft: () => void;
};

const NavCtx = createContext<NavState | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("map");
  const [activeDishId, setActiveDishId] = useState<string>("pastry");
  const [accent, setAccent] = useState<Accent>("chili");
  const [atLocation, setAtLocation] = useState(false);
  const [draft, setDraftState] = useState<PlantDraft>(emptyDraft);

  const value = useMemo<NavState>(
    () => ({
      screen,
      activeDishId,
      accent,
      atLocation,
      draft,
      go: (next, dishId) => {
        if (dishId) setActiveDishId(dishId);
        setScreen(next);
      },
      setAccent,
      setAtLocation,
      setDraft: (patch) => setDraftState((d) => ({ ...d, ...patch })),
      resetDraft: () => setDraftState(emptyDraft),
    }),
    [screen, activeDishId, accent, atLocation, draft],
  );

  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}

export function useNav(): NavState {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
}
