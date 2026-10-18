import { DishImg } from "./components";
import { CITY, pinState, type Dish } from "./data";

type Variant = "summon" | "gonow";

export function MapCanvas({
  dishes,
  variant,
  highlightId,
  filterGoNow = false,
  totalClaims,
  onPick,
}: {
  dishes: Dish[];
  variant: Variant;
  highlightId?: string;
  filterGoNow?: boolean;
  totalClaims: (dishId: string) => number;
  onPick: (d: Dish) => void;
}) {
  return (
    <div className="map">
      {/* stylized night-market streets */}
      <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <g stroke="#1f1a16" strokeWidth="26" fill="none" strokeLinecap="round">
          <path d="M-20 240 L420 180" />
          <path d="M-20 520 L420 560" />
          <path d="M90 -20 L140 880" />
          <path d="M300 -20 L250 880" />
        </g>
        <g stroke="#17130f" strokeWidth="10" fill="none" strokeLinecap="round">
          <path d="M-20 360 L420 400" />
          <path d="M-20 680 L420 650" />
          <path d="M200 -20 L190 880" />
          <path d="M20 -20 L60 880" />
          <path d="M360 -20 L330 880" />
        </g>
        <g fill="#120f0d" opacity="0.7">
          <rect x="140" y="200" width="110" height="150" rx="6" transform="rotate(4 195 275)" />
          <rect x="30" y="420" width="120" height="120" rx="6" transform="rotate(-3 90 480)" />
          <rect x="250" y="440" width="120" height="150" rx="6" transform="rotate(3 310 515)" />
        </g>
      </svg>

      {/* you-are-here */}
      <div className="me-dot" style={{ left: `${CITY.me.x}%`, top: `${CITY.me.y}%` }} />

      {dishes.map((d) => {
        const total = totalClaims(d.id);
        const state =
          variant === "gonow" ? pinState(d, total) : d.id === highlightId ? "loud" : "quiet";
        if (filterGoNow && state !== "loud") return null;
        const showLabel = state === "loud" || d.id === highlightId;
        return (
          <button
            key={d.id}
            className={`pin ${state}`}
            style={{ left: `${d.x}%`, top: `${d.y}%`, background: "none", border: "none" }}
            onClick={() => onPick(d)}
          >
            <span className="bubble">
              <span>
                <DishImg dish={d} size={26} />
              </span>
            </span>
            {showLabel && (
              <span className="plabel">
                {variant === "gonow" && state === "loud"
                  ? `Go now · ${d.pinnedAgo}`
                  : `${d.dish} · ${d.distanceKm} km`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
