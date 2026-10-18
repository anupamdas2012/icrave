import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CITY } from "./data";
import { useStore } from "./store";

const TABS = [
  { to: "/", label: "Map", icon: "◎", end: true },
  { to: "/trails", label: "Trails", icon: "⛓" },
  { to: "/plant", label: "Plant", icon: "+", plant: true },
  { to: "/claims", label: "Claims", icon: "✓" },
  { to: "/profile", label: "Profile", icon: "◑" },
];

export function AppShell() {
  const { me, unreadCount } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // the capture step is a full-bleed camera; hide chrome there
  const fullBleed = pathname === "/plant/capture";

  return (
    <div className="app">
      {!fullBleed && (
        <header className="appbar">
          <button className="brand" onClick={() => navigate("/")}>
            I<span>CRAVE</span>
          </button>
          <div className="appbar-right">
            <button className="locchip" onClick={() => navigate("/")}>
              <span className="pindot" /> {CITY.name} · {CITY.area}
            </button>
            <button className="iconbtn" onClick={() => navigate("/activity")} aria-label="Activity">
              <span>◔</span>
              {unreadCount > 0 && <i className="badge">{unreadCount}</i>}
            </button>
            <button className="avatar sm" onClick={() => navigate("/profile")} title={me.name}>
              {me.emoji}
            </button>
          </div>
        </header>
      )}

      <main className="main">
        <Outlet />
      </main>

      {!fullBleed && (
        <nav className="tabbar">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `navbtn ${t.plant ? "plant" : ""} ${isActive ? "active" : ""}`
              }
            >
              <span className="ic">{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
