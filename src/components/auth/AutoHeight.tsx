"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Animates the height of its content when the content changes size (a field appears, an error shows).
 * The transition is in globals.css (.auth-height) and is switched off under prefers-reduced-motion.
 */
export function AutoHeight({ children }: { children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const element = innerRef.current;
    if (!element) return;
    const measure = () => setHeight(element.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="auth-height" style={{ height }}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
