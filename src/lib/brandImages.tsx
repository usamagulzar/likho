import { LogoMark } from "@/components/brand/LogoMark";
import { site } from "@/lib/site";

const { light, ink, paper } = site.colors;

/** The app mark for next/og images: the same SVG as the in-app logo. `padded` = full-bleed (maskable / Apple). */
export function AppMark({ size, padded = false }: { size: number; padded?: boolean }) {
  return <LogoMark size={size} bleed={padded} detail="full" />;
}

/** 1200×630 social card: a ruled notepad sheet with the name, tagline and a few Markdown examples. */
export function SocialCard() {
  const rule = "rgba(31, 30, 29, 0.09)";
  const lines = ["- Bullets that continue on Enter", "# Headings, --- rules, ```code```", "Save as .md or .txt"];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: light,
        padding: 48,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: paper,
          borderRadius: 28,
          border: "2px solid rgba(31, 30, 29, 0.10)",
          padding: "56px 72px",
          position: "relative",
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 55px, ${rule} 55px, ${rule} 56px)`,
        }}
      >
        <div style={{ position: "absolute", left: 48, top: 0, bottom: 0, width: 2, background: "rgba(31, 30, 29, 0.10)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <AppMark size={72} />
          <div style={{ fontSize: 76, color: "#141413", letterSpacing: -2 }}>{site.name}</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 40, color: ink, display: "flex" }}>{site.tagline}</div>
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
          {lines.map((text) => (
            <div key={text} style={{ fontSize: 30, color: "#4d4c47", display: "flex" }}>
              {text}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", fontSize: 26, color: "#4d4c47", display: "flex" }}>
          Free · No sign-up needed · Open source
        </div>
      </div>
    </div>
  );
}
