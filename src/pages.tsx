import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DishImg, Rating, Sheet } from "./components";
import { MapCanvas } from "./MapCanvas";
import { Toast, useToast } from "./toast";
import { readImageResized, timeAgo } from "./util";
import { useStore, type Accent } from "./store";
import { CITY, goNowFacts, isGoNow, type Dish, type Trail } from "./data";

/* ---------- shared bits ---------- */

function FactTiles({
  dish,
  total,
  compact = false,
}: {
  dish: Dish;
  total: number;
  compact?: boolean;
}) {
  const f = goNowFacts(dish, total);
  const items = [
    { k: "Fresh", ...f.fresh },
    { k: "Open", ...f.open },
    { k: "Near", ...f.near },
    { k: "Unclaimed", ...f.unclaimed },
  ];
  return (
    <div className="facts" style={{ marginTop: compact ? 12 : 16 }}>
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

function trailForDish(trails: Record<string, Trail>, dishId: string): Trail | undefined {
  return Object.values(trails).find((t) => t.stops.some((s) => s.dishId === dishId));
}

/* ====================================================================== */
/* MAP (summon)                                                           */
/* ====================================================================== */

export function MapPage() {
  const { dishList, totalClaims, hasClaimed, state, me } = useStore();
  const navigate = useNavigate();

  const candidates = dishList
    .filter(
      (d) =>
        d.plantedBy !== me.id &&
        !hasClaimed(d.id) &&
        d.openNow &&
        d.distanceKm <= 0.9 &&
        totalClaims(d.id) === 0,
    )
    .sort((a, b) => a.freshHours - b.freshHours);
  const summon = candidates[0] ?? state.dishes.pastry ?? dishList[0];
  const planter = summon ? state.users[summon.plantedBy] : undefined;

  return (
    <div className="mapwrap">
      <MapCanvas
        dishes={dishList}
        variant="summon"
        highlightId={summon?.id}
        totalClaims={totalClaims}
        onPick={(d) => navigate(`/d/${d.id}`)}
      />
      <div className="map-top">
        <span className="chip on">Dishes near you</span>
        <span className="chip" onClick={() => navigate("/go")}>
          ⚡ Go now
        </span>
      </div>

      {summon && planter ? (
        <Sheet>
          <div className="kicker">Summoned</div>
          <div className="display display-md" style={{ marginTop: 8 }}>
            {planter.name} pinned a dish
            <br />
            {summon.distanceKm} km away
          </div>
          <div className="linkcard" onClick={() => navigate(`/d/${summon.id}`)}>
            <div className="media thumb">
              <DishImg dish={summon} size={46} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{summon.dish}</div>
              <div className="mono faint" style={{ fontSize: 12, marginTop: 3 }}>
                {planter.name} · {summon.spot} · {summon.distanceKm} km
              </div>
            </div>
            <span className="faint" style={{ fontSize: 22 }}>
              ›
            </span>
          </div>
          <button
            className="btn primary"
            style={{ marginTop: 12 }}
            onClick={() => navigate(`/d/${summon.id}`)}
          >
            See the pin
          </button>
        </Sheet>
      ) : (
        <Sheet>
          <div className="kicker">All caught up</div>
          <div className="display display-md" style={{ marginTop: 8 }}>
            Nothing new near you
          </div>
          <p className="dim" style={{ marginTop: 8, fontSize: 14 }}>
            You've claimed what's fresh around here. Plant one and summon someone else.
          </p>
          <button
            className="btn primary"
            style={{ marginTop: 12 }}
            onClick={() => navigate("/plant")}
          >
            Plant a dish
          </button>
        </Sheet>
      )}
    </div>
  );
}

/* ====================================================================== */
/* DISH PIN (+ claim flow)                                                */
/* ====================================================================== */

type ClaimStage = "idle" | "arriving" | "onsite";

export function DishPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { state, me, dispatch, totalClaims, hasClaimed } = useStore();
  const [toast, showToast] = useToast();
  const [stage, setStage] = useState<ClaimStage>("idle");
  const [photo, setPhoto] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const d = state.dishes[id];
  useEffect(() => {
    if (!d) navigate("/", { replace: true });
  }, [d, navigate]);
  useEffect(() => {
    if (stage !== "arriving") return;
    const t = setTimeout(() => setStage("onsite"), 1500);
    return () => clearTimeout(t);
  }, [stage]);
  if (!d) return null;

  const planter = state.users[d.plantedBy];
  const total = totalClaims(id);
  const mine = d.plantedBy === me.id;
  const claimed = hasClaimed(id);
  const going = state.goingIds.includes(id);

  const logClaim = () => {
    dispatch({ type: "CLAIM", dishId: id, photo });
    navigate(`/claim/${id}`);
  };

  return (
    <div className="pad">
      <div className="media" style={{ height: 230 }}>
        <DishImg dish={d} size={d.photo ? 230 : 170} />
        {!d.photo && <div className="play-badge">▶</div>}
        <span className="media-tag">{d.photo ? "◉ photo" : "▶ 10-sec clip"}</span>
      </div>

      <div className="kicker" style={{ marginTop: 18 }}>
        {mine ? "Your pin" : "Dish pin"}
      </div>
      <div className="display display-lg" style={{ marginTop: 6 }}>
        {d.dish}
      </div>

      <div className="chiprow" style={{ marginTop: 12 }}>
        <span className="chip">📍 {d.distanceKm} km</span>
        <span className="chip">🕑 {d.hours}</span>
        {d.headsUp.includes("Sells out early") && <span className="chip warn">⚠ Sells out</span>}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <div className="avatar">{planter.emoji}</div>
          <div>
            <div className="mono faint" style={{ fontSize: 11 }}>
              {mine ? "PLANTED BY YOU" : "PINNED BY"}
            </div>
            <div style={{ fontWeight: 800 }}>{planter.name}</div>
          </div>
        </div>
        {d.voucher && <p style={{ marginTop: 12, lineHeight: 1.5, fontSize: 15 }}>“{d.voucher}”</p>}
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

      <div className="card dashed" style={{ marginTop: 14, textAlign: "center" }}>
        {total === 0 ? (
          <span className="mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
            No claims yet — be first to claim
          </span>
        ) : (
          <span className="mono faint">
            {total} claim{total === 1 ? "" : "s"} logged
          </span>
        )}
      </div>

      {/* ---- action zone ---- */}
      {claimed ? (
        <button
          className="btn primary"
          style={{ marginTop: 16 }}
          onClick={() => navigate(`/claim/${id}`)}
        >
          ✓ View your claim card
        </button>
      ) : mine ? (
        <button
          className="btn"
          style={{ marginTop: 16 }}
          onClick={() => showToast("Pin link copied ✦")}
        >
          Share your pin
        </button>
      ) : stage === "idle" ? (
        <>
          <div className="btnrow" style={{ marginTop: 16 }}>
            <button
              className={`btn ${going ? "on" : ""}`}
              style={{ flex: 1 }}
              onClick={() => {
                dispatch({ type: "TOGGLE_GOING", dishId: id });
                showToast(going ? "Removed" : "You're going 🎯");
              }}
            >
              {going ? "✓ Going" : "I'm going"}
            </button>
            <button
              className="btn primary"
              style={{ flex: 1 }}
              onClick={() => setStage("arriving")}
            >
              Claim
            </button>
          </div>
          <div className="lock-note">🔒 Claim unlocks when you're at {d.spot}</div>
        </>
      ) : stage === "arriving" ? (
        <div className="card" style={{ marginTop: 16, textAlign: "center" }}>
          <div className="spinner" />
          <div className="mono" style={{ marginTop: 12 }}>
            Getting you to {d.spot}…
          </div>
          <div className="mono faint" style={{ fontSize: 11, marginTop: 6 }}>
            {d.walkMin} min walk · simulating arrival
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: "center", color: "var(--ok)" }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <span className="mono" style={{ fontWeight: 700 }}>
              You're at {d.spot}
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setPhoto(await readImageResized(file));
            }}
          />
          <button
            className="btn"
            style={{ marginTop: 14 }}
            onClick={() => fileRef.current?.click()}
          >
            {photo ? "✓ Photo added · retake" : "📷 Add your photo (optional)"}
          </button>
          {photo && (
            <img
              src={photo}
              alt=""
              style={{
                width: "100%",
                borderRadius: 14,
                marginTop: 10,
                maxHeight: 180,
                objectFit: "cover",
              }}
            />
          )}
          <button className="btn primary" style={{ marginTop: 10 }} onClick={logClaim}>
            Log your claim
          </button>
        </div>
      )}
      <Toast msg={toast} />
    </div>
  );
}

/* ====================================================================== */
/* CLAIM CARD                                                             */
/* ====================================================================== */

export function ClaimPage() {
  const { id = "" } = useParams(); // dishId
  const navigate = useNavigate();
  const { state, me, claimsFor, trailProgress } = useStore();
  const [toast, showToast] = useToast();

  const claim = claimsFor(me.id).find((c) => c.dishId === id);
  const d = state.dishes[id];
  useEffect(() => {
    if (!d || !claim) navigate(d ? `/d/${id}` : "/", { replace: true });
  }, [d, claim, id, navigate]);
  if (!d || !claim) return null;

  const planter = state.users[d.plantedBy];
  const trail = trailForDish(state.trails, id);
  const nextStop =
    trail && trailProgress(trail).stops.find((s) => !s.done && s.dishId !== id)?.dishId;

  return (
    <div className="pad">
      <div className="kicker">The artifact</div>
      <div className="display display-md" style={{ marginTop: 6, marginBottom: 14 }}>
        You claimed it
      </div>

      <div className="claimcard">
        <div className="photo">
          <span className="claimed-tag">CLAIMED</span>
          {claim.photo ? (
            <img src={claim.photo} alt="" className="claimphoto" />
          ) : (
            <DishImg dish={d} size={210} />
          )}
        </div>
        <div className="body">
          <div className="mono faint" style={{ fontSize: 11, letterSpacing: "0.1em" }}>
            {planter.name.toUpperCase()}
            {planter.id === me.id ? "" : "'S"} PIN · CLAIM #{claim.order}
          </div>
          <div className="display display-md" style={{ marginTop: 8 }}>
            {d.dish}
          </div>
          <div className="mono dim" style={{ marginTop: 6, fontSize: 13 }}>
            {d.spot} · {CITY.area}
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
              <div className="val">{claim.first ? "First to claim" : `Claim #${claim.order}`}</div>
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
      {trail && (
        <button
          className="btn"
          style={{ marginTop: 10 }}
          onClick={() => navigate(nextStop ? `/d/${nextStop}` : `/t/${trail.id}`)}
        >
          Next on trail →
        </button>
      )}
      {planter.id !== me.id && (
        <p className="mono faint" style={{ textAlign: "center", marginTop: 14, fontSize: 11 }}>
          {planter.name} was just notified their taste landed.
        </p>
      )}
      <Toast msg={toast} />
    </div>
  );
}

/* ====================================================================== */
/* TRAILS                                                                 */
/* ====================================================================== */

export function TrailsPage() {
  const { state, trailProgress } = useStore();
  const navigate = useNavigate();
  return (
    <div className="pad">
      <div className="kicker">Trails · {CITY.area}</div>
      <div className="display display-lg" style={{ marginTop: 6, marginBottom: 16 }}>
        Crave quests
      </div>
      {Object.values(state.trails).map((trail) => {
        const p = trailProgress(trail);
        const author = state.users[trail.author];
        const pct = Math.round((p.claimed / p.total) * 100);
        return (
          <div
            key={trail.id}
            className="card linkcard col"
            onClick={() => navigate(`/t/${trail.id}`)}
          >
            <div className="spread">
              <div className="display display-md" style={{ fontSize: 24 }}>
                {trail.name}
              </div>
              <span className="faint" style={{ fontSize: 22 }}>
                ›
              </span>
            </div>
            <div className="mono faint" style={{ fontSize: 12, marginTop: 4 }}>
              by {author.name} · {p.claimed}/{p.total} claimed
            </div>
            <div className="progress" style={{ marginTop: 12 }}>
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TrailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { state, trailProgress } = useStore();
  const trail = state.trails[id];
  useEffect(() => {
    if (!trail) navigate("/trails", { replace: true });
  }, [trail, navigate]);
  if (!trail) return null;

  const author = state.users[trail.author];
  const p = trailProgress(trail);
  const pct = Math.round((p.claimed / p.total) * 100);

  return (
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
          {p.claimed} OF {p.total} CLAIMED
        </span>
        <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>
          {pct}%
        </span>
      </div>
      <div className="progress">
        <i style={{ width: `${pct}%` }} />
      </div>

      <div style={{ marginTop: 10 }}>
        {p.stops.map((s, i) => {
          const dish = state.dishes[s.dishId];
          if (!dish) return null;
          return (
            <div
              key={i}
              className={`stop ${s.done ? "done" : ""} ${s.soldOutReportBy ? "soldout" : ""}`}
              onClick={() => navigate(`/d/${dish.id}`)}
            >
              <span className="num">{s.done ? "✓" : i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{dish.dish}</div>
                <div className="mono faint" style={{ fontSize: 11, marginTop: 2 }}>
                  {dish.spot}
                  {s.soldOutReportBy && (
                    <span style={{ color: "var(--warn)" }}>
                      {" "}
                      · sold-out report by {state.users[s.soldOutReportBy].name}
                    </span>
                  )}
                </div>
              </div>
              <DishImg dish={dish} size={34} />
            </div>
          );
        })}
      </div>

      <div className="badge-souvenir" style={{ marginTop: 20 }}>
        <div style={{ fontSize: 34 }}>{p.claimed === p.total ? "🏅" : "🔒"}</div>
        <div className="display display-md" style={{ marginTop: 6 }}>
          {trail.souvenir}
        </div>
        <div className="mono faint" style={{ fontSize: 12, marginTop: 6 }}>
          {p.claimed === p.total
            ? "Unlocked — souvenir earned"
            : `Souvenir badge · claim all ${p.total} stops`}
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* GO NOW                                                                 */
/* ====================================================================== */

export function GoNowPage() {
  const { dishList, totalClaims, hasClaimed, me } = useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "gonow">("all");

  const goNow = dishList.filter(
    (d) => d.plantedBy !== me.id && !hasClaimed(d.id) && isGoNow(d, totalClaims(d.id)),
  );
  const top = goNow[0];

  return (
    <div className="mapwrap">
      <MapCanvas
        dishes={dishList}
        variant="gonow"
        filterGoNow={filter === "gonow"}
        totalClaims={totalClaims}
        onPick={(d) =>
          isGoNow(d, totalClaims(d.id)) && !hasClaimed(d.id) && d.plantedBy !== me.id
            ? navigate(`/go/${d.id}`)
            : navigate(`/d/${d.id}`)
        }
      />
      <div className="map-top">
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
      {top ? (
        <Sheet>
          <div className="kicker">Go now · all four facts true</div>
          <div className="display display-md" style={{ marginTop: 8 }}>
            {top.dish}
          </div>
          <FactTiles dish={top} total={totalClaims(top.id)} compact />
          <button
            className="btn primary"
            style={{ marginTop: 14 }}
            onClick={() => navigate(`/go/${top.id}`)}
          >
            Go now · {top.walkMin} min walk
          </button>
        </Sheet>
      ) : (
        <Sheet>
          <div className="kicker">Go now</div>
          <div className="display display-md" style={{ marginTop: 8 }}>
            Nothing lit up right now
          </div>
          <p className="dim" style={{ marginTop: 8, fontSize: 14 }}>
            A pin goes loud only when it's fresh, open, near, and unclaimed. Check back soon.
          </p>
        </Sheet>
      )}
    </div>
  );
}

export function GoNowPinPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { state, totalClaims } = useStore();
  const [toast, showToast] = useToast();
  const d = state.dishes[id];
  useEffect(() => {
    if (!d) navigate("/go", { replace: true });
  }, [d, navigate]);
  if (!d) return null;
  const planter = state.users[d.plantedBy];

  return (
    <div className="pad">
      <div className="media" style={{ height: 180 }}>
        <DishImg dish={d} size={d.photo ? 180 : 140} />
        <span className="media-tag">⚡ Go now</span>
      </div>
      <div className="display display-lg" style={{ marginTop: 16 }}>
        {d.dish}
      </div>
      <div className="mono dim" style={{ marginTop: 6 }}>
        {d.spot} · pinned by {planter.name}
      </div>

      <FactTiles dish={d} total={totalClaims(id)} />

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
        onClick={() => navigate(`/d/${id}`)}
      >
        Go now · {d.walkMin} min walk
      </button>
      <button className="btn" style={{ marginTop: 10 }} onClick={() => showToast("Invite sent 👯")}>
        Bring a friend
      </button>
      <Toast msg={toast} />
    </div>
  );
}

/* ====================================================================== */
/* CLAIMS                                                                 */
/* ====================================================================== */

export function ClaimsPage() {
  const { state, me, claimsFor } = useStore();
  const navigate = useNavigate();
  const claims = claimsFor(me.id);
  const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const thisWeek = claims.filter((c) => c.at >= weekAgo).length;

  return (
    <div className="pad">
      <div className="kicker">Your claims</div>
      <div className="display display-lg" style={{ marginTop: 6 }}>
        {thisWeek} this week
      </div>
      <p className="mono faint" style={{ fontSize: 12, marginTop: 8 }}>
        North star: claims per week. Keep the streak alive.
      </p>

      {claims.length === 0 ? (
        <div className="card dashed" style={{ marginTop: 18, textAlign: "center" }}>
          <div style={{ fontSize: 30 }}>🍽️</div>
          <div style={{ fontWeight: 800, marginTop: 8 }}>No claims yet</div>
          <p className="mono faint" style={{ fontSize: 12, marginTop: 6 }}>
            Open the map and claim your first dish.
          </p>
          <button className="btn primary" style={{ marginTop: 12 }} onClick={() => navigate("/")}>
            Open the map
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {claims.map((c) => {
            const d = state.dishes[c.dishId];
            if (!d) return null;
            const planter = state.users[d.plantedBy];
            return (
              <div
                key={c.id}
                className="claimcard clickable"
                onClick={() => navigate(`/claim/${c.dishId}`)}
              >
                <div className="photo" style={{ height: 170 }}>
                  <span className="claimed-tag">CLAIMED</span>
                  {c.photo ? (
                    <img src={c.photo} alt="" className="claimphoto" />
                  ) : (
                    <DishImg dish={d} size={130} />
                  )}
                </div>
                <div className="body">
                  <div className="mono faint" style={{ fontSize: 11 }}>
                    {planter.name.toUpperCase()}
                    {planter.id === me.id ? "" : "'S"} PIN · CLAIM #{c.order}
                  </div>
                  <div className="display display-md" style={{ marginTop: 6 }}>
                    {d.dish}
                  </div>
                  <div className="mono faint" style={{ fontSize: 11, marginTop: 6 }}>
                    {timeAgo(c.at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/* ACTIVITY (notifications)                                               */
/* ====================================================================== */

const NOTIF_ICON = { summon: "📍", claimed: "✓", welcome: "👋" } as const;

export function ActivityPage() {
  const { myNotifs, dispatch, state } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    dispatch({ type: "READ_NOTIFS" });
  }, [dispatch]);

  return (
    <div className="pad">
      <div className="kicker">Activity</div>
      <div className="display display-lg" style={{ marginTop: 6, marginBottom: 16 }}>
        What landed
      </div>
      {myNotifs.length === 0 ? (
        <div className="card dashed" style={{ textAlign: "center" }}>
          <span className="mono faint">Nothing yet. Plant and claim to get things moving.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {myNotifs.map((n) => {
            const dish = n.dishId ? state.dishes[n.dishId] : undefined;
            return (
              <div
                key={n.id}
                className="notif"
                onClick={() => dish && navigate(`/d/${dish.id}`)}
                style={{ cursor: dish ? "pointer" : "default" }}
              >
                <span className={`notif-ic ${n.kind}`}>{NOTIF_ICON[n.kind]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.35 }}>{n.text}</div>
                  <div className="mono faint" style={{ fontSize: 11, marginTop: 3 }}>
                    {timeAgo(n.at)}
                  </div>
                </div>
                {dish && <DishImg dish={dish} size={34} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/* PROFILE (account, user switch, accent, reset)                          */
/* ====================================================================== */

const ACCENTS: { key: Accent; label: string; color: string }[] = [
  { key: "chili", label: "Chili orange", color: "#ff5a1f" },
  { key: "acid", label: "Acid yellow", color: "#d7ff2e" },
  { key: "blue", label: "Electric blue", color: "#3b82ff" },
];

export function ProfilePage() {
  const { state, me, dispatch, claimsFor, dishList } = useStore();
  const navigate = useNavigate();
  const myClaims = claimsFor(me.id).length;
  const myPins = dishList.filter((d) => d.plantedBy === me.id).length;

  const stats = [
    { label: "Claims", val: String(myClaims) },
    { label: "Pins planted", val: String(myPins) },
    { label: "Trails", val: String(Object.keys(state.trails).length) },
    { label: "City", val: "SF" },
  ];

  return (
    <div className="pad">
      <div className="row" style={{ marginTop: 6, gap: 14 }}>
        <div className="avatar" style={{ width: 56, height: 56, fontSize: 26 }}>
          {me.emoji}
        </div>
        <div>
          <div className="display display-md">{me.name}</div>
          <div className="mono faint" style={{ fontSize: 12, marginTop: 2 }}>
            {me.handle} · {CITY.name}
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

      {/* who am I — no auth, just switch mock users */}
      <h4 className="section">Viewing as</h4>
      <div className="userswitch">
        {Object.values(state.users).map((u) => (
          <button
            key={u.id}
            className={`userpill ${u.id === me.id ? "on" : ""}`}
            onClick={() => dispatch({ type: "SWITCH_USER", userId: u.id })}
          >
            <span className="avatar sm">{u.emoji}</span>
            {u.name}
          </button>
        ))}
      </div>
      <p className="mono faint" style={{ fontSize: 10.5, marginTop: 8, lineHeight: 1.5 }}>
        No login in this prototype — switch mock users to see both sides of the loop (plant as Gee,
        claim as You, watch Gee get notified).
      </p>

      <h4 className="section">Accent</h4>
      <div className="swatches">
        {ACCENTS.map((a) => (
          <button
            key={a.key}
            className={`swatch ${state.accent === a.key ? "on" : ""}`}
            style={{ background: a.color }}
            title={a.label}
            onClick={() => dispatch({ type: "SET_ACCENT", accent: a.key })}
          />
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="mono faint" style={{ fontSize: 11 }}>
          THE LOOP
        </div>
        <div className="display display-md" style={{ marginTop: 8, fontSize: 20 }}>
          Plant → summon → claim → artifact → notify
        </div>
      </div>

      <button
        className="btn ghost"
        style={{ marginTop: 16 }}
        onClick={() => {
          if (confirm("Reset all demo data (claims, planted pins, notifications)?")) {
            dispatch({ type: "RESET" });
            navigate("/");
          }
        }}
      >
        Reset demo data
      </button>
    </div>
  );
}
