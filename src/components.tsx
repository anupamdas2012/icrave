import { type ReactNode } from "react";
import { useNav, type Screen } from "./nav";

export function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className="statusbar"
      style={dark ? { position: "absolute", top: 0, left: 0, right: 0 } : undefined}
    >
      <span className="mono">9:41</span>
      <div className="dots">
        <span>●●●</span>
        <span>✦</span>
        <span>▮</span>
      </div>
    </div>
  );
}

const NAV: { key: Screen; label: string; icon: string; plant?: boolean }[] = [
  { key: "map", label: "Map", icon: "◎" },
  { key: "trail", label: "Trails", icon: "⛓" },
  { key: "plant-start", label: "Plant", icon: "+", plant: true },
  { key: "claims", label: "Claims", icon: "✓" },
  { key: "profile", label: "Profile", icon: "◑" },
];

const ACTIVE_FOR: Record<string, Screen> = {
  map: "map",
  "gonow-map": "map",
  dish: "map",
  trail: "trail",
  "plant-start": "plant-start",
  "plant-capture": "plant-start",
  "plant-vouch": "plant-start",
  "plant-done": "plant-start",
  claims: "claims",
  claim: "claims",
  profile: "profile",
};

export function BottomNav() {
  const { screen, go, resetDraft } = useNav();
  const active = ACTIVE_FOR[screen] ?? screen;
  return (
    <nav className="bottomnav">
      {NAV.map((n) => (
        <button
          key={n.key}
          className={`navbtn ${n.plant ? "plant" : ""} ${active === n.key ? "active" : ""}`}
          onClick={() => {
            if (n.key === "plant-start") resetDraft();
            go(n.key);
          }}
        >
          <span className="ic">{n.icon}</span>
          {n.label}
        </button>
      ))}
    </nav>
  );
}

export function Rating({
  value,
  max = 5,
  onChange,
  large = false,
}: {
  value: number;
  max?: number;
  onChange?: (v: number) => void;
  large?: boolean;
}) {
  return (
    <span className={`rating ${large ? "lg" : ""}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`dot ${i < value ? "fill" : ""}`}
          onClick={onChange ? () => onChange(i + 1) : undefined}
          style={onChange ? { cursor: "pointer" } : { cursor: "default" }}
        />
      ))}
    </span>
  );
}

export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="sheet">
      <div className="grab" />
      {children}
    </div>
  );
}
