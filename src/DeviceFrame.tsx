import { useEffect, useRef, type ReactNode } from "react";

// On desktop, present the real app inside an iPhone 16 Pro Max (440×956 pt)
// so it reads as "the ICrave app on a phone". On an actual phone (narrow
// viewport) the frame collapses and the app goes full-screen — it's still a
// real responsive web app, this is just the preview shell.
export function DeviceFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const OUTER_W = 464;
    const OUTER_H = 980;
    const fit = () => {
      const scale = Math.min(
        1,
        (window.innerWidth - 32) / OUTER_W,
        (window.innerHeight - 32) / OUTER_H,
      );
      el.style.setProperty("--device-scale", String(scale));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="device-stage" ref={ref}>
      <div className="device">
        <div className="device-screen">
          <div className="device-island" />
          <div className="device-statusbar">
            <span className="mono">9:41</span>
            <span className="device-signal mono">
              <i className="sig" />
              5G
              <i className="batt" />
            </span>
          </div>
          <div className="device-appslot">{children}</div>
        </div>
      </div>
    </div>
  );
}
