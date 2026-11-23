import type { ReactElement } from "react";

/**
 * The Likho mark: two note cards fanned from their base — a blue-grey card behind, a paper card in front with a
 * handwritten "q" sitting on a ruled line. Drawn on a 100×100 grid.
 *
 * Brand colours are fixed (not theme tokens), like any app icon, so the mark looks the same in light and dark UI.
 * Detail is reduced at small sizes so it stays crisp: full ≥ 40px, medium 21–39px (no ruled line / hook),
 * small ≤ 20px (cards + bowl only). Pure SVG with no hooks, built only from intrinsic SVG elements (next/og's
 * renderer rejects nested components and fragments inside <svg>), so it works in server components and OG images.
 */

export const BRAND = {
  ink: "#2b2a27",
  paper: "#f8f5ec",
  accent: "#8fa3bf",
} as const;

type Detail = "full" | "medium" | "small";

interface LogoMarkProps {
  size?: number;
  /** Force a detail level; by default it follows the rendered size. */
  detail?: Detail;
  /** Full-bleed square background with the cards in the central safe zone (maskable / Apple touch icons). */
  bleed?: boolean;
  className?: string;
  /** Accessible name. Omit for decorative use next to visible text (the default). */
  title?: string;
  /** Background tile colour. In the app UI pass "var(--logo-tile)" so it adapts to the theme; images keep brand ink. */
  tile?: string;
}

function detailFor(size: number): Detail {
  if (size <= 20) return "small";
  if (size < 40) return "medium";
  return "full";
}

/** The two cards with the q (no background), fanned around (50, 82). Returns a plain <g> of intrinsic elements. */
function logoCards(detail: Detail, transform?: string): ReactElement {
  const { ink, paper, accent } = BRAND;
  const stroke = detail === "full" ? 5.5 : detail === "medium" ? 6.5 : 9;
  const front: ReactElement[] = [<rect key="card" x="28" y="20" width="44" height="56" rx="8" fill={paper} />];
  if (detail === "full") {
    front.push(<line key="rule" x1="34" y1="58" x2="66" y2="58" stroke={accent} strokeWidth="3" strokeLinecap="round" />);
  }
  front.push(
    <circle key="bowl" cx="45" cy={detail === "small" ? 45 : 47} r="10" fill="none" stroke={ink} strokeWidth={stroke} />,
  );
  if (detail === "full") {
    front.push(<path key="stem" d="M55 37V68q0 6 6 4" fill="none" stroke={ink} strokeWidth={stroke} strokeLinecap="round" />);
  } else if (detail === "medium") {
    front.push(<path key="stem" d="M55 36V68" fill="none" stroke={ink} strokeWidth={stroke} strokeLinecap="round" />);
  }
  return (
    <g transform={transform}>
      <rect x="28" y="20" width="44" height="56" rx="8" fill={accent} transform="rotate(-12 50 82)" />
      <g transform="rotate(5 50 82)">{front}</g>
    </g>
  );
}

function tileFill(tile: string): { fill?: string; style?: { fill: string } } {
  return tile.startsWith("var(") ? { style: { fill: tile } } : { fill: tile };
}

export function LogoMark({ size = 28, detail, bleed = false, className, title, tile = BRAND.ink }: LogoMarkProps) {
  const level = detail ?? detailFor(size);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {/* SVG fill attributes can't read CSS variables, so a var() tile goes through style instead. */}
      {bleed ? (
        <rect width="100" height="100" {...tileFill(tile)} />
      ) : (
        <rect width="100" height="100" rx="24" {...tileFill(tile)} />
      )}
      {/* Full-bleed: scale the cards up to 80% around the centre; every card corner stays inside the 40%-radius safe circle. */}
      {logoCards(level, bleed ? "translate(10 10) scale(0.8)" : undefined)}
    </svg>
  );
}
