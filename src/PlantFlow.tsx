import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { DishImg, Rating } from "./components";
import { MapCanvas } from "./MapCanvas";
import { Toast, useToast } from "./toast";
import { readImageResized } from "./util";
import { useStore } from "./store";
import { CITY, type HeadsUp } from "./data";

type Draft = {
  dish: string;
  spot: string;
  voucher: string;
  crave: number;
  adventure: number;
  headsUp: HeadsUp[];
  iconId?: string;
  photo?: string;
};

const emptyDraft: Draft = {
  dish: "",
  spot: "LOQUAT",
  voucher: "",
  crave: 4,
  adventure: 3,
  headsUp: [],
  iconId: undefined,
  photo: undefined,
};

type DraftCtx = { draft: Draft; patch: (p: Partial<Draft>) => void };
const Ctx = createContext<DraftCtx | null>(null);
function useDraft() {
  const c = useContext(Ctx);
  if (!c) throw new Error("plant draft ctx missing");
  return c;
}

// The layout owns the draft; it stays alive across steps and resets whenever
// you re-enter the /plant subtree (it remounts).
export function PlantLayout() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  return (
    <Ctx.Provider value={{ draft, patch }}>
      <Outlet />
    </Ctx.Provider>
  );
}

/* ---------- P1 · Plant a pin ---------- */

export function PlantStart() {
  const { draft, patch } = useDraft();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="pad" style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div className="kicker" style={{ marginTop: 10 }}>
        Plant a pin
      </div>
      <div className="display display-xl" style={{ marginTop: 10 }}>
        One dish.
        <br />
        One claim.
        <br />
        <span style={{ color: "var(--accent)" }}>Your name on it.</span>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <div className="mono faint" style={{ fontSize: 11 }}>
          LOCATION DETECTED · {CITY.name}
        </div>
        <div className="row" style={{ marginTop: 8, gap: 10 }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <input
            className="plantinput"
            style={{ marginTop: 0 }}
            value={draft.spot}
            onChange={(e) => patch({ spot: e.target.value })}
            placeholder="Where are you?"
          />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 20 }} />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            patch({ photo: await readImageResized(file) });
            navigate("/plant/vouch");
          }
        }}
      />
      <button className="btn primary" onClick={() => navigate("/plant/capture")}>
        ⦿ Record the dish
      </button>
      <div className="btnrow" style={{ marginTop: 10 }}>
        <button className="btn" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
          Upload photo
        </button>
        <button className="btn" style={{ flex: 1 }} onClick={() => navigate("/plant/vouch")}>
          Pick an icon
        </button>
      </div>
      <p className="mono faint" style={{ textAlign: "center", marginTop: 14, fontSize: 11 }}>
        No text-only pins. A pin needs visual proof.
      </p>
    </div>
  );
}

/* ---------- P2 · Capture (theatrical 10s) ---------- */

export function PlantCapture() {
  const { draft } = useDraft();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / 10000);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        navigate("/plant/vouch");
      }
    }, 50);
    return () => clearInterval(id);
  }, [recording, navigate]);

  return (
    <div className="capture">
      <div className="capture-bg">
        <div className="capture-ghost">
          <DishImg iconId={draft.iconId ?? "pastry"} size={190} />
        </div>
      </div>

      <div className="capture-top">
        <span className="chip on">📍 {draft.spot}</span>
        <span className="chip ghost" style={{ color: "#fff" }}>
          {recording ? `${(progress * 10).toFixed(1)}s` : "10s max"}
        </span>
      </div>

      <div className="capture-prompt mono">Show the dish</div>

      <div className="capture-controls">
        <div className="progress" style={{ margin: "0 40px 16px" }}>
          <i style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="spread" style={{ padding: "0 40px" }}>
          <button
            className="chip ghost"
            style={{ color: "#fff" }}
            onClick={() => navigate("/plant/vouch")}
          >
            Skip
          </button>
          <div
            className={`rec-ring ${recording ? "recording" : ""}`}
            onClick={() => setRecording((r) => !r)}
          >
            <div className="core" />
          </div>
          <button
            className="chip ghost"
            style={{ color: "#fff" }}
            onClick={() => navigate("/plant")}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- P3 · Vouch for it ---------- */

const HEADS_UP_OPTIONS: HeadsUp[] = ["Sells out early", "Weekends only", "Ask for it", "Cash only"];
const ICON_CHOICES = ["pastry", "noodles", "taco", "gelato", "dumpling"];

export function PlantVouch() {
  const { draft, patch } = useDraft();
  const navigate = useNavigate();
  const { dispatch } = useStore();

  // ensure a visual: if no photo, default to first icon
  const iconId = draft.iconId ?? (draft.photo ? undefined : "pastry");
  const canDrop = draft.dish.trim().length > 0 && (draft.photo || iconId);

  const toggleHeadsUp = (h: HeadsUp) =>
    patch({
      headsUp: draft.headsUp.includes(h)
        ? draft.headsUp.filter((x) => x !== h)
        : [...draft.headsUp, h],
    });

  const drop = () => {
    dispatch({
      type: "PLANT",
      input: {
        dish: draft.dish,
        spot: draft.spot,
        voucher: draft.voucher,
        crave: draft.crave,
        adventure: draft.adventure,
        headsUp: draft.headsUp,
        iconId: draft.photo ? undefined : iconId,
        photo: draft.photo,
      },
    });
    navigate("/plant/done");
  };

  return (
    <div className="pad">
      <div className="kicker">Vouch for it</div>

      <div className="media" style={{ height: 150, marginTop: 12 }}>
        {draft.photo ? (
          <img src={draft.photo} alt="" className="claimphoto" />
        ) : (
          <DishImg iconId={iconId} size={110} />
        )}
        <span className="media-tag">✓ Clip ready</span>
      </div>

      {!draft.photo && (
        <>
          <label className="mono faint flabel">DISH LOOK</label>
          <div className="iconpick">
            {ICON_CHOICES.map((ic) => (
              <button
                key={ic}
                className={`iconopt ${iconId === ic ? "on" : ""}`}
                onClick={() => patch({ iconId: ic })}
              >
                <DishImg iconId={ic} size={38} />
              </button>
            ))}
          </div>
        </>
      )}

      <label className="mono faint flabel">DISH NAME</label>
      <input
        className="plantinput"
        placeholder="[DISH]"
        value={draft.dish}
        onChange={(e) => patch({ dish: e.target.value })}
      />

      <label className="mono faint flabel">WHY SHOULD SOMEONE GO?</label>
      <textarea
        className="plantinput"
        rows={3}
        placeholder="Say the one thing that makes it worth the walk…"
        value={draft.voucher}
        onChange={(e) => patch({ voucher: e.target.value })}
      />

      <div className="statgrid" style={{ marginTop: 16 }}>
        <div className="stat">
          <div className="label">Crave</div>
          <div style={{ marginTop: 10 }}>
            <Rating value={draft.crave} large onChange={(v) => patch({ crave: v })} />
          </div>
        </div>
        <div className="stat">
          <div className="label">Adventure</div>
          <div style={{ marginTop: 10 }}>
            <Rating value={draft.adventure} large onChange={(v) => patch({ adventure: v })} />
          </div>
        </div>
      </div>

      <label className="mono faint flabel">HEADS-UP</label>
      <div className="chiprow" style={{ marginTop: 8 }}>
        {HEADS_UP_OPTIONS.map((h) => (
          <span
            key={h}
            className={`chip ${draft.headsUp.includes(h) ? "on" : ""}`}
            onClick={() => toggleHeadsUp(h)}
          >
            {h}
          </span>
        ))}
      </div>

      <button className="btn primary" style={{ marginTop: 22 }} disabled={!canDrop} onClick={drop}>
        {canDrop ? `Drop the pin at ${draft.spot}` : "Name your dish to drop the pin"}
      </button>
    </div>
  );
}

/* ---------- P4 · Pin dropped ---------- */

export function PlantDone() {
  const navigate = useNavigate();
  const { dishList, me, totalClaims } = useStore();
  const [toast, showToast] = useToast();

  const justPlanted = dishList.find((d) => d.plantedBy === me.id && d.custom);
  useEffect(() => {
    if (!justPlanted) navigate("/plant", { replace: true });
  }, [justPlanted, navigate]);
  if (!justPlanted) return null;

  return (
    <div className="pad" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 46, marginTop: 20 }}>📌</div>
      <div className="kicker" style={{ marginTop: 12 }}>
        Pin dropped
      </div>
      <div className="display display-lg" style={{ marginTop: 8 }}>
        You pinned
        <br />
        {justPlanted.dish}
      </div>

      <span className="chip" style={{ marginTop: 16, display: "inline-flex" }}>
        📍 {justPlanted.spot}
      </span>

      <div className="minimap" style={{ marginTop: 16 }}>
        <MapCanvas
          dishes={[justPlanted]}
          variant="summon"
          highlightId={justPlanted.id}
          interactive={false}
          totalClaims={totalClaims}
          onPick={() => {}}
        />
      </div>

      <div className="card dashed" style={{ marginTop: 16 }}>
        <span className="mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
          0 claims so far
        </span>
        <p className="mono faint" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>
          We'll tell you the moment someone claims it.
        </p>
      </div>

      <button
        className="btn primary"
        style={{ marginTop: 16 }}
        onClick={() => showToast("Pin link copied ✦")}
      >
        Share pin
      </button>
      <button
        className="btn"
        style={{ marginTop: 10 }}
        onClick={() => navigate(`/d/${justPlanted.id}`)}
      >
        View your pin
      </button>
      <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => navigate("/")}>
        Back to map
      </button>
      <Toast msg={toast} />
    </div>
  );
}
