import type { IconSvgElement } from "@hugeicons/react";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Builds a Hugeicons icon as a plain SVG node. Editor widgets are DOM, not React, so they cannot render the
 * Icon component. This uses the same icon data, the same 18px box and the same 1.5 stroke as Icon.tsx.
 */
export function svgIcon(icon: IconSvgElement, size = 18): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("class", "md-icon");
  for (const [tag, attrs] of icon) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "key") continue;
      element.setAttribute(key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), String(value));
    }
    svg.append(element);
  }
  return svg;
}
