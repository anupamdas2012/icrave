import { useEffect, useState } from "react";
import { StatusBar, Rating, Sheet } from "./components";
import { MapCanvas } from "./MapCanvas";
import { useNav } from "./nav";
import { DISHES, TRAILS, USERS, SUMMONED_PIN, goNowFacts, isGoNow, type Dish } from "./data";

/* ---------- tiny toast helper ---------- */
function useToast(): [string | null, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 1800);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg];
}
function Toast({ msg }: { msg: string | null }) {
  return msg ? <div className="toast">{msg}</div> : null;
}

const DETECTED_SPOT = "LOQUAT";

/* ====================================================================== */
/* FLOW 1 — Summon → claim → trail                                        */
/* ====================================================================== */

export function MapScreen() {
  const { go } = useNav();
  const pin = DISHES[SUMMONED_PIN];
  const planter = USERS[pin.plantedBy];
  return (
    <>
      <StatusBar dark />
      <div className="view" style={{ overflow: "hidden" }}>
        <MapCanvas variant="summon" highlightId={SUMMONED_PIN} onPick={(d) => go("dish", d.id)} />
        <div className="map-top" style={{ top: 50 }}>
          <span className="chip on">Dishes near you</span>
          <span className="chip" onClick={() => go("gonow-map")}>
            ⚡ Go now
          </span>
        </div>
        <Sheet>
          <div className="kicker">Summoned</div>
          <div className="display display-md" style={{ marginTop: 8 }}>
            {planter.name} pinned a dish
            <br />
            {pin.distanceKm} km away
          </div>
          <div
            className="card"
            style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center" }}
            onClick={() => go("dish", pin.id)}
          >
            <div className="media" style={{ width: 58, height: 58, flex: "0 0 auto" }}>
              <span style={{ fontSize: 30 }}>{pin.emoji}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{pin.dish}</div>
              <div className="mono faint" style={{ fontSize: 12, marginTop: 3 }}>
                {planter.name} · {pin.spot} · {pin.distanceKm} km
              </div>
            </div>
            <span className="faint" style={{ fontSize: 22 }}>
              ›
            </span>
          </div>
          <button
            className="btn primary"
            style={{ marginTop: 12 }}
            onClick={() => go("dish", pin.id)}
          >
            See the pin
          </button>
        </Sheet>
      </div>
    </>
  );
}

export function DishPinScreen() {
  const { activeDishId, atLocation, go } = useNav();
  const [toast, showToast] = useToast();
  const d = DISHES[activeDishId];
  const planter = USERS[d.plantedBy];
  return (
    <>
      <StatusBar />
      <div className="view">
        <div className="pad">
          <div className="media" style={{ height: 230 }}>
            <span className="big-emoji">{d.emoji}</span>
            <span className="media-tag">▶ 10-sec clip</span>
            <div className="play-badge">▶</div>
          </div>

          <div className="kicker" style={{ marginTop: 18 }}>
            Dish pin
          </div>
          <div className="display display-lg" style={{ marginTop: 6 }}>
            {d.dish}
          </div>

          <div className="chiprow" style={{ marginTop: 12 }}>
            <span className="chip">📍 {d.distanceKm} km</span>
            <span className="chip">🕑 {d.hours}</span>
            {d.headsUp.includes("Sells out early") && (
              <span className="chip warn">⚠ Sells out</span>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="row">
              <div className="avatar">{planter.emoji}</div>
              <div>
                <div className="mono faint" style={{ fontSize: 11 }}>
                  PINNED BY
                </div>
                <div style={{ fontWeight: 800 }}>{planter.name}</div>
              </div>
            </div>
            <p style={{ marginTop: 12, lineHeight: 1.5, fontSize: 15 }}>“{d.voucher}”</p>
          </div>

          <div className="statgrid" style={{ marginTop: 14 }}>
            <div className="stat">
              <div className="label">Crave</div>
              <div style={{ marginTop: 8 }}>
                <Rating value={d.crave} />
              </div>
            </div>
            <div className="stat">
              <div className="label">Adventure</div>
              <div style={{ marginTop: 8 }}>
                <Rating value={d.adventure} />
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{ marginTop: 14, textAlign: "center", borderStyle: "dashed" }}
          >
            {d.claims === 0 ? (
              <span className="mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
                No claims yet — be first to claim
              </span>
            ) : (
              <span className="mono faint">
                {d.claims} claims · latest by {USERS.das.name}
              </span>
            )}
          </div>

          <div className="btnrow" style={{ marginTop: 16 }}>
            <button
              className="btn"
              style={{ flex: 1 }}
              onClick={() => showToast("You're going 🎯")}
            >
              I'm going
            </button>
            <button
              className="btn primary"
              style={{ flex: 1 }}
              disabled={!atLocation}
              onClick={() => go("claim", d.id)}
            >
              {atLocation ? "Claim it" : "🔒 Claim"}
            </button>
          </div>
          {!atLocation && (
            <div className="lock-note">
              🔒 Claim unlocks at {d.spot} · toggle “I'm there” in Tweaks
            </div>
          )}
        </div>
      </div>
      <Toast msg={toast} />
    </>
  );
}

export function ClaimCardScreen() {
  const { activeDishId, go } = useNav();
  const [toast, showToast] = useToast();
  const d = DISHES[activeDishId];
  const planter = USERS[d.plantedBy];
  return (
    <>
      <StatusBar />
      <div className="view">
        <div className="pad">
          <div className="kicker">The artifact</div>
          <div className="display display-md" style={{ marginTop: 6, marginBottom: 14 }}>
            You claimed it
          </div>

          <div className="claimcard">
            <div className="photo">
              <span className="claimed-tag">CLAIMED</span>
              <span className="big-emoji">{d.emoji}</span>
            </div>
            <div className="body">
              <div className="mono faint" style={{ fontSize: 11, letterSpacing: "0.1em" }}>
                {planter.name.toUpperCase()}'S PIN · CLAIM #{d.claims + 1}
              </div>
              <div className="display display-md" style={{ marginTop: 8 }}>
                {d.dish}
              </div>
              <div className="mono dim" style={{ marginTop: 6, fontSize: 13 }}>
                {d.spot}
              </div>

              <div className="statgrid" style={{ marginTop: 16 }}>
                <div className="stat ok">
                  <div className="label">Crave</div>
                  <div className="val">{d.crave}/5</div>
                </div>
                <div className="stat ok">
                  <div className="label">Walked</div>
                  <div className="val">{d.distanceKm} km</div>
                </div>
                <div className="stat ok" style={{ gridColumn: "1 / -1" }}>
                  <div className="label">Logbook</div>
                  <div className="val">
                    {d.claims === 0 ? "First to claim" : `Claim #${d.claims + 1}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn primary"
            style={{ marginTop: 16 }}
            onClick={() => showToast("Shared to your story ✦")}
          >
            Share to story
          </button>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => go("trail", d.id)}>
            Next on trail →
          </button>
          <p className="mono faint" style={{ textAlign: "center", marginTop: 14, fontSize: 11 }}>
            {planter.name} was just notified their taste landed.
          </p>
        </div>
      </div>
      <Toast msg={toast} />
    </>
  );
}

export function TrailScreen() {
  const { go } = useNav();
  const trail = TRAILS.hayes;
  const author = USERS[trail.author];
  const done = trail.stops.filter((s) => s.claimed).length;
  const pct = Math.round((done / trail.stops.length) * 100);
  return (
    <>
      <StatusBar />
      <div className="view">
        <div className="pad">
          <div className="kicker">Trail · {trail.neighborhood}</div>
          <div className="display display-lg" style={{ marginTop: 6 }}>
            {trail.name}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <div className="avatar">{author.emoji}</div>
            <div className="mono dim" style={{ fontSize: 13 }}>
              A crave quest by {author.name}
            </div>
          </div>

          <div className="spread" style={{ marginTop: 18, marginBottom: 8 }}>
            <span className="mono faint" style={{ fontSize: 12 }}>
              {done} OF {trail.stops.length} CLAIMED
            </span>
            <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>
              {pct}%
            </span>
          </div>
          <div className="progress">
            <i style={{ width: `${pct}%` }} />
          </div>

          <div style={{ marginTop: 10 }}>
            {trail.stops.map((s, i) => {
              const dish = DISHES[s.dishId];
              const soldOut = s.soldOutReportBy;
              return (
                <div
                  key={i}
                  className={`stop ${s.claimed ? "done" : ""} ${soldOut ? "soldout" : ""}`}
                  onClick={() => go("dish", dish.id)}
                >
                  <span className="num">{s.claimed ? "✓" : i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{dish.dish}</div>
                    <div className="mono faint" style={{ fontSize: 11, marginTop: 2 }}>
                      {dish.spot}
                      {soldOut && (
                        <span className="warn" style={{ color: "var(--warn)" }}>
                          {" "}
                          · sold-out report by {USERS[soldOut].name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="faint">{dish.emoji}</span>
                </div>
              );
            })}
          </div>

          <div className="badge-souvenir" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 34 }}>🏅</div>
            <div className="display display-md" style={{ marginTop: 6 }}>
              {trail.souvenir}
            </div>
            <div className="mono faint" style={{ fontSize: 12, marginTop: 6 }}>
              Souvenir badge · claim all {trail.stops.length} stops
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ====================================================================== */
/* FLOW 2 — Planting                                                      */
/* ====================================================================== */

export function PlantStartScreen() {
  const { go, setDraft } = useNav();
  return (
    <>
      <StatusBar />
      <div className="view">
        <div
          className="pad"
          style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}
        >
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

          <div
            className="card"
            style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center" }}
          >
            <span style={{ fontSize: 22 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div className="mono faint" style={{ fontSize: 11 }}>
                LOCATION DETECTED
              </div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>You're at {DETECTED_SPOT}</div>
            </div>
            <button className="btn sm ghost">Change</button>
          </div>

          <div style={{ flex: 1 }} />

          <button
            className="btn primary"
            onClick={() => {
              setDraft({ mediaKind: "video" });
              go("plant-capture");
            }}
          >
            ⦿ Record the dish
          </button>
          <div className="btnrow" style={{ marginTop: 10 }}>
            <button
              className="btn"
              style={{ flex: 1 }}
              onClick={() => {
                setDraft({ mediaKind: "photo" });
                go("plant-capture");
              }}
            >
              Photo
            </button>
            <button className="btn" style={{ flex: 1 }} onClick={() => go("plant-vouch")}>
              Camera roll
            </button>
          </div>
          <p className="mono faint" style={{ textAlign: "center", marginTop: 14, fontSize: 11 }}>
            No text-only pins. A pin needs visual proof.
          </p>
        </div>
      </div>
    </>
  );
}

export function PlantCaptureScreen() {
  const { go, draft, setDraft } = useNav();
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
        setRecording(false);
        go("plant-vouch");
      }
    }, 50);
    return () => clearInterval(id);
  }, [recording, go]);

  const isPhoto = draft.mediaKind === "photo";
  return (
    <>
      <StatusBar dark />
      <div className="view" style={{ background: "#000", overflow: "hidden" }}>
        {/* stylized live camera */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(90% 60% at 50% 42%, #3a2d22 0%, #140f0b 70%), #0a0807",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 120,
              opacity: 0.5,
            }}
          >
            🥐
          </div>
        </div>

        <div style={{ position: "absolute", top: 56, left: 16, right: 16 }} className="spread">
          <span className="chip on">📍 {DETECTED_SPOT}</span>
          <span className="chip ghost" style={{ color: "#fff" }}>
            {isPhoto ? "PHOTO" : "10s max"}
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            top: "42%",
            left: 0,
            right: 0,
            textAlign: "center",
            color: "rgba(255,255,255,0.8)",
          }}
          className="mono"
        >
          {isPhoto ? "Frame the dish" : "Show the dish"}
        </div>

        {/* bottom controls */}
        <div style={{ position: "absolute", bottom: 26, left: 0, right: 0 }}>
          {!isPhoto && (
            <div style={{ padding: "0 40px 16px" }}>
              <div className="progress">
                <i style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          )}
          <div className="spread" style={{ padding: "0 44px" }}>
            <button
              className="chip ghost"
              style={{ color: "#fff" }}
              onClick={() => setDraft({ mediaKind: isPhoto ? "video" : "photo" })}
            >
              {isPhoto ? "→ Video" : "→ Photo"}
            </button>
            <div
              className={`rec-ring ${recording ? "recording" : ""}`}
              onClick={() => {
                if (isPhoto) {
                  go("plant-vouch");
                } else {
                  setRecording((r) => !r);
                }
              }}
            >
              <div className="core" />
            </div>
            <button
              className="chip ghost"
              style={{ color: "#fff" }}
              onClick={() => go("plant-start")}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const HEADS_UP_OPTIONS = ["Sells out early", "Weekends only", "Ask for it", "Cash only"];

export function PlantVouchScreen() {
  const { go, draft, setDraft } = useNav();
  const toggleHeadsUp = (h: string) =>
    setDraft({
      headsUp: draft.headsUp.includes(h)
        ? draft.headsUp.filter((x) => x !== h)
        : [...draft.headsUp, h],
    });
  return (
    <>
      <StatusBar />
      <div className="view">
        <div className="pad">
          <div className="kicker">Vouch for it</div>

          <div className="media" style={{ height: 150, marginTop: 12 }}>
            <span className="big-emoji" style={{ fontSize: 60 }}>
              🥐
            </span>
            <span className="media-tag">✓ Clip ready</span>
          </div>

          <label className="mono faint" style={{ fontSize: 11, display: "block", marginTop: 18 }}>
            DISH NAME
          </label>
          <input
            className="plantinput"
            placeholder="[DISH]"
            value={draft.dish}
            onChange={(e) => setDraft({ dish: e.target.value })}
          />

          <label className="mono faint" style={{ fontSize: 11, display: "block", marginTop: 16 }}>
            WHY SHOULD SOMEONE GO?
          </label>
          <textarea
            className="plantinput"
            rows={3}
            placeholder="Say the one thing that makes it worth the walk…"
            value={draft.voucher}
            onChange={(e) => setDraft({ voucher: e.target.value })}
          />

          <div className="statgrid" style={{ marginTop: 16 }}>
            <div className="stat">
              <div className="label">Crave</div>
              <div style={{ marginTop: 10 }}>
                <Rating value={draft.crave} large onChange={(v) => setDraft({ crave: v })} />
              </div>
            </div>
            <div className="stat">
              <div className="label">Adventure</div>
              <div style={{ marginTop: 10 }}>
                <Rating
                  value={draft.adventure}
                  large
                  onChange={(v) => setDraft({ adventure: v })}
                />
              </div>
            </div>
          </div>

          <label className="mono faint" style={{ fontSize: 11, display: "block", marginTop: 18 }}>
            HEADS-UP
          </label>
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

          <button
            className="btn primary"
            style={{ marginTop: 22 }}
            onClick={() => go("plant-done")}
          >
            Drop the pin at {DETECTED_SPOT}
          </button>
        </div>
      </div>
    </>
  );
}

export function PlantDoneScreen() {
  const { go, draft, resetDraft } = useNav();
  const [toast, showToast] = useToast();
  const name = draft.dish.trim() || "Sage-Feta Pastry";
  return (
    <>
      <StatusBar />
      <div className="view">
        <div className="pad" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 46, marginTop: 20 }}>📌</div>
          <div className="kicker" style={{ marginTop: 12 }}>
            Pin dropped
          </div>
          <div className="display display-lg" style={{ marginTop: 8 }}>
            You pinned
            <br />
            {name}
          </div>

          <span className="chip" style={{ marginTop: 16, display: "inline-flex" }}>
            📍 {DETECTED_SPOT}
          </span>

          <div
            className="card"
            style={{
              marginTop: 16,
              height: 150,
              padding: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <MapCanvas variant="summon" highlightId="pastry" onPick={() => {}} />
          </div>

          <div className="card" style={{ marginTop: 16, borderStyle: "dashed" }}>
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
          <button className="btn" style={{ marginTop: 10 }} onClick={() => go("trail")}>
            Add to a trail
          </button>
          <button
            className="btn ghost"
            style={{ marginTop: 10 }}
            onClick={() => {
              resetDraft();
              go("map");
            }}
          >
            Back to map
          </button>
        </div>
      </div>
      <Toast msg={toast} />
    </>
  );
}

/* ====================================================================== */
/* FLOW 3 — Go now                                                        */
/* ====================================================================== */

export function GoNowMapScreen() {
  const { go } = useNav();
  const [filter, setFilter] = useState<"all" | "gonow">("all");
  const loud = Object.values(DISHES).find((d) => isGoNow(d))!;
  return (
    <>
      <StatusBar dark />
      <div className="view" style={{ overflow: "hidden" }}>
        <MapCanvas
          variant="gonow"
          filterGoNow={filter === "gonow"}
          onPick={(d) => (isGoNow(d) ? go("gonow-pin", d.id) : go("dish", d.id))}
        />
        <div className="map-top" style={{ top: 50 }}>
          <span className={`chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>
            All pins
          </span>
          <span
            className={`chip ${filter === "gonow" ? "on" : ""}`}
            onClick={() => setFilter("gonow")}
          >
            ⚡ Go now
          </span>
        </div>
        <Sheet>
          <div className="kicker">Go now · all four facts true</div>
          <div className="display display-md" style={{ marginTop: 8 }}>
            {loud.dish}
          </div>
          <FactTiles d={loud} compact />
          <button
            className="btn primary"
            style={{ marginTop: 14 }}
            onClick={() => go("gonow-pin", loud.id)}
          >
            Go now · {loud.walkMin} min walk
          </button>
        </Sheet>
      </div>
    </>
  );
}

function FactTiles({ d, compact = false }: { d: Dish; compact?: boolean }) {
  const f = goNowFacts(d);
  const items = [
    { k: "Fresh", ...f.fresh },
    { k: "Open", ...f.open },
    { k: "Near", ...f.near },
    { k: "Unclaimed", ...f.unclaimed },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginTop: compact ? 12 : 16,
      }}
    >
      {items.map((it) => (
        <div key={it.k} className="facttile">
          <span className="check">{it.ok ? "✓" : "–"}</span>
          <div>
            <div className="k">{it.k}</div>
            <div className="v">{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GoNowPinScreen() {
  const { activeDishId, go } = useNav();
  const [toast, showToast] = useToast();
  const d = DISHES[activeDishId];
  const planter = USERS[d.plantedBy];
  return (
    <>
      <StatusBar />
      <div className="view">
        <div className="pad">
          <div className="media" style={{ height: 180 }}>
            <span className="big-emoji">{d.emoji}</span>
            <span className="media-tag">⚡ Go now</span>
          </div>

          <div className="display display-lg" style={{ marginTop: 16 }}>
            {d.dish}
          </div>
          <div className="mono dim" style={{ marginTop: 6 }}>
            {d.spot} · pinned by {planter.name}
          </div>

          <FactTiles d={d} />

          {d.headsUp.includes("Sells out early") && (
            <div className="heads-up-line" style={{ marginTop: 14 }}>
              <span>⏰</span>
              <span>
                {planter.name} says it sells out early. It's 1:10 PM, so go soon — or check back
                tomorrow at 8.
              </span>
            </div>
          )}

          <button
            className="btn primary"
            style={{ marginTop: 18 }}
            onClick={() => go("dish", d.id)}
          >
            Go now · {d.walkMin} min walk
          </button>
          <button
            className="btn"
            style={{ marginTop: 10 }}
            onClick={() => showToast("Invite sent 👯")}
          >
            Bring a friend
          </button>
        </div>
      </div>
      <Toast msg={toast} />
    </>
  );
}

/* ====================================================================== */
/* Supporting tabs — Claims & Profile                                     */
/* ====================================================================== */

export function ClaimsScreen() {
  const { go } = useNav();
  const claimed = DISHES.pastry;
  return (
    <>
      <StatusBar />
      <div className="view">
        <div className="pad">
          <div className="kicker">Your claims</div>
          <div className="display display-lg" style={{ marginTop: 6 }}>
            1 this week
          </div>
          <p className="mono faint" style={{ fontSize: 12, marginTop: 8 }}>
            North star: claims per week. Keep the streak alive.
          </p>

          <div
            className="claimcard"
            style={{ marginTop: 18 }}
            onClick={() => go("claim", claimed.id)}
          >
            <div className="photo" style={{ height: 180 }}>
              <span className="claimed-tag">CLAIMED</span>
              <span className="big-emoji" style={{ fontSize: 80 }}>
                {claimed.emoji}
              </span>
            </div>
            <div className="body">
              <div className="mono faint" style={{ fontSize: 11 }}>
                GEE'S PIN · CLAIM #1
              </div>
              <div className="display display-md" style={{ marginTop: 6 }}>
                {claimed.dish}
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{ marginTop: 14, textAlign: "center", borderStyle: "dashed" }}
          >
            <span className="mono faint">Next claim unlocks the Hayes Valley souvenir →</span>
          </div>
        </div>
      </div>
    </>
  );
}

export function ProfileScreen() {
  const me = USERS.you;
  const stats = [
    { label: "Claims", val: "1" },
    { label: "This week", val: "1" },
    { label: "Pins planted", val: "0" },
    { label: "Trails", val: "1" },
  ];
  return (
    <>
      <StatusBar />
      <div className="view">
        <div className="pad">
          <div className="row" style={{ marginTop: 10, gap: 14 }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 26 }}>
              {me.emoji}
            </div>
            <div>
              <div className="display display-md">{me.name}</div>
              <div className="mono faint" style={{ fontSize: 12, marginTop: 2 }}>
                {me.handle} · new claimer
              </div>
            </div>
          </div>
          <p className="dim" style={{ marginTop: 14, fontSize: 14 }}>
            {me.bio}
          </p>

          <div className="statgrid" style={{ marginTop: 18 }}>
            {stats.map((s) => (
              <div key={s.label} className="stat">
                <div className="label">{s.label}</div>
                <div className="val">{s.val}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="mono faint" style={{ fontSize: 11 }}>
              THE LOOP
            </div>
            <div className="display display-md" style={{ marginTop: 8, fontSize: 22 }}>
              Plant → summon → claim → artifact → notify
            </div>
            <p className="dim" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
              Claimers become planters. Go claim a few, then plant your first dish.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
