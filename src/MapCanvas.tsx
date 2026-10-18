import { useEffect, useRef } from "react";
import * as L from "leaflet";
import { dishIconSrc } from "./components";
import { CITY, pinState, type Dish } from "./data";

type Variant = "summon" | "gonow";

function markerHtml(d: Dish, state: string, selected: boolean, label?: string): string {
  const src = dishIconSrc(d);
  const inner = src
    ? `<img src="${src}" alt="" draggable="false"/>`
    : `<span class="mk-emoji">${d.emoji}</span>`;
  return `<div class="mk ${state} ${selected ? "sel" : ""}">
    <div class="mk-bubble">${inner}</div>
    ${label ? `<div class="mk-label">${label}</div>` : ""}
  </div>`;
}

export function MapCanvas({
  dishes,
  variant,
  highlightId,
  filterGoNow = false,
  focusId,
  interactive = true,
  totalClaims,
  onPick,
}: {
  dishes: Dish[];
  variant: Variant;
  highlightId?: string;
  filterGoNow?: boolean;
  focusId?: string;
  interactive?: boolean;
  totalClaims: (dishId: string) => number;
  onPick: (d: Dish) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const onPickRef = useRef(onPick);
  const totalClaimsRef = useRef(totalClaims);
  onPickRef.current = onPick;
  totalClaimsRef.current = totalClaims;

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [CITY.center.lat, CITY.center.lng],
      zoom: interactive ? CITY.zoom : 15,
      zoomControl: false,
      attributionControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      keyboard: interactive,
      boxZoom: interactive,
      minZoom: 11,
      maxZoom: 18,
    });
    // Esri "Dark Gray Canvas" — keyless, dark, fits the night-market look.
    const esri = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";
    L.tileLayer(`${esri}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
      maxNativeZoom: 16,
      maxZoom: 19,
      attribution: "Tiles &copy; Esri",
    }).addTo(map);
    L.tileLayer(`${esri}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
      maxNativeZoom: 16,
      maxZoom: 19,
      pane: "overlayPane",
    }).addTo(map);
    if (interactive) L.control.zoom({ position: "topright" }).addTo(map);

    // you-are-here
    L.marker([CITY.me.lat, CITY.me.lng], {
      icon: L.divIcon({
        className: "me-wrap",
        html: '<div class="me-dot-lf"></div>',
        iconSize: [18, 18],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // container may not have its size yet on first paint
    const sizeTimer = setTimeout(() => map.invalidateSize(), 60);

    return () => {
      clearTimeout(sizeTimer);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [interactive]);

  // (re)draw markers when dishes / state change
  useEffect(() => {
    const layer = markersRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    const activeId = focusId ?? highlightId;

    for (const d of dishes) {
      const total = totalClaimsRef.current(d.id);
      const state = variant === "gonow" ? pinState(d, total) : d.id === activeId ? "loud" : "quiet";
      if (filterGoNow && state !== "loud") continue;
      const selected = d.id === activeId;
      const showLabel = selected || (variant === "gonow" && state === "loud");
      const label =
        variant === "gonow" && state === "loud"
          ? `Go now · ${d.pinnedAgo}`
          : `${d.dish} · ${d.distanceKm} km`;
      const icon = L.divIcon({
        className: "mk-wrap",
        html: markerHtml(d, state, selected, showLabel ? label : undefined),
        iconSize: [46, 46],
        iconAnchor: [23, 44],
      });
      const m = L.marker([d.lat, d.lng], { icon, riseOnHover: true }).addTo(layer);
      m.on("click", () => {
        if (interactive) map.flyTo([d.lat, d.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
        onPickRef.current(d);
      });
    }

    if (!interactive && dishes.length === 1) {
      map.setView([dishes[0].lat, dishes[0].lng], 15);
    }
  }, [dishes, filterGoNow, highlightId, focusId, variant, interactive]);

  // fly to a focused dish (from search / external selection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !interactive || !focusId) return;
    const d = dishes.find((x) => x.id === focusId);
    if (d) map.flyTo([d.lat, d.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
  }, [focusId, dishes, interactive]);

  return <div ref={containerRef} className="leaflet-host" />;
}
