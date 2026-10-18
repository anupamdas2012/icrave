import { type ReactNode } from "react";
import { type Dish } from "./data";

const KNOWN_ICONS = new Set(["pastry", "noodles", "taco", "gelato", "dumpling"]);

export function dishIconSrc(dish?: Dish, iconId?: string): string | undefined {
  if (dish?.photo) return dish.photo;
  const key = iconId ?? dish?.iconId ?? dish?.id;
  if (key && KNOWN_ICONS.has(key)) return `${import.meta.env.BASE_URL}food-icons/${key}.png`;
  return undefined;
}

// Photoreal dish icon (generated with the grubmaps icon generator) or a
// user-planted pin's uploaded photo. Falls back to a pin glyph.
export function DishImg({
  dish,
  iconId,
  size = 40,
  className,
}: {
  dish?: Dish;
  iconId?: string;
  size?: number;
  className?: string;
}) {
  const src = dishIconSrc(dish, iconId);
  if (!src) {
    return (
      <span
        className={className}
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.6,
        }}
      >
        📍
      </span>
    );
  }
  const rounded = Boolean(dish?.photo);
  return (
    <img
      src={src}
      alt=""
      className={className}
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: dish?.photo ? "cover" : "contain",
        display: "block",
        borderRadius: rounded ? 12 : 0,
      }}
    />
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
          style={{ cursor: onChange ? "pointer" : "default" }}
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
