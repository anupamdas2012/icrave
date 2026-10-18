import { BottomNav } from "./components";
import { NavProvider, useNav, type Accent, type Screen } from "./nav";
import {
  MapScreen,
  DishPinScreen,
  ClaimCardScreen,
  TrailScreen,
  PlantStartScreen,
  PlantCaptureScreen,
  PlantVouchScreen,
  PlantDoneScreen,
  GoNowMapScreen,
  GoNowPinScreen,
  ClaimsScreen,
  ProfileScreen,
} from "./screens";

const SCREENS: Record<Screen, () => JSX.Element> = {
  map: MapScreen,
  dish: DishPinScreen,
  claim: ClaimCardScreen,
  trail: TrailScreen,
  "plant-start": PlantStartScreen,
  "plant-capture": PlantCaptureScreen,
  "plant-vouch": PlantVouchScreen,
  "plant-done": PlantDoneScreen,
  "gonow-map": GoNowMapScreen,
  "gonow-pin": GoNowPinScreen,
  claims: ClaimsScreen,
  profile: ProfileScreen,
};

const ACCENTS: { key: Accent; label: string; color: string }[] = [
  { key: "chili", label: "Chili orange", color: "#ff5a1f" },
  { key: "acid", label: "Acid yellow", color: "#d7ff2e" },
  { key: "blue", label: "Electric blue", color: "#3b82ff" },
];

// Jump list mirrors the brief's 10 screens across 3 flows.
const JUMPS: { flow: string; items: { label: string; screen: Screen }[] }[] = [
  {
    flow: "Flow 1 · Summon → claim",
    items: [
      { label: "1 · Map (summon)", screen: "map" },
      { label: "2 · Dish pin", screen: "dish" },
      { label: "3 · Claim card", screen: "claim" },
      { label: "4 · Trail", screen: "trail" },
    ],
  },
  {
    flow: "Flow 2 · Planting",
    items: [
      { label: "P1 · Plant a pin", screen: "plant-start" },
      { label: "P2 · Capture", screen: "plant-capture" },
      { label: "P3 · Vouch for it", screen: "plant-vouch" },
      { label: "P4 · Pin dropped", screen: "plant-done" },
    ],
  },
  {
    flow: "Flow 3 · Go now",
    items: [
      { label: "N1 · Go now map", screen: "gonow-map" },
      { label: "N2 · Go now pin", screen: "gonow-pin" },
    ],
  },
];

function Phone() {
  const { screen, accent } = useNav();
  const Screen = SCREENS[screen];
  const hideNav = screen === "plant-capture";
  return (
    <div className="phone" data-accent={accent}>
      <div className="notch" />
      <div className="screen">
        <Screen />
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}

function Tweaks() {
  const { accent, setAccent, atLocation, setAtLocation, go } = useNav();
  return (
    <aside className="tweaks" data-accent={accent}>
      <div className="group">
        <h4>Accent</h4>
        <div className="swatches">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              className={`swatch ${accent === a.key ? "on" : ""}`}
              style={{ background: a.color }}
              title={a.label}
              onClick={() => setAccent(a.key)}
            />
          ))}
        </div>
      </div>

      <div className="group">
        <h4>Simulate</h4>
        <div
          className={`toggle ${atLocation ? "on" : ""}`}
          onClick={() => setAtLocation(!atLocation)}
        >
          <span className="track">
            <i />
          </span>
          I'm at the location
        </div>
        <p
          className="mono"
          style={{ color: "var(--text-faint)", fontSize: 10.5, marginTop: 8, lineHeight: 1.5 }}
        >
          Claim only unlocks on site (mock geofence). Flip this, then open a dish pin.
        </p>
      </div>

      <div className="group">
        <h4>Jump to screen</h4>
        <div className="jumplist">
          {JUMPS.map((f) => (
            <div key={f.flow}>
              <div className="flowhead">{f.flow}</div>
              {f.items.map((it) => (
                <button key={it.label} onClick={() => go(it.screen)}>
                  {it.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <NavProvider>
      <div className="stage-brand">
        <b>ICrave</b> · prototype v1 — a map of dishes, not restaurants
      </div>
      <div className="stage">
        <Phone />
        <Tweaks />
      </div>
    </NavProvider>
  );
}
