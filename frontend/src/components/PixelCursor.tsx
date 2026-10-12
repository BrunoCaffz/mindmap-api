"use client";

import { useEffect, useRef } from "react";

// Cursor de pixels: um anel de pixels que gira em volta do ponteiro,
// expande e contrai, segue o mouse com atraso e abre em cima de itens clicáveis.
// Usa mix-blend-mode: difference, então funciona no tema claro e no escuro.

const DOTS = 20;
const HOT = "a, button, input, textarea, select, label, [role='button'], [role='switch']";

export function PixelCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!finePointer) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ring = ringRef.current!;
    const dot = dotRef.current!;
    const pts = Array.from(ring.children) as HTMLElement[];
    const c = { mx: -100, my: -100, rx: -100, ry: -100, r: 14, t: 0, on: false, hot: false, down: false };

    document.documentElement.classList.add("pixel-cursor");

    const onMove = (e: PointerEvent) => {
      c.mx = e.clientX;
      c.my = e.clientY;
      if (!c.on) { c.on = true; c.rx = c.mx; c.ry = c.my; }
    };
    const onOver = (e: PointerEvent) => {
      c.hot = !!(e.target as Element | null)?.closest?.(HOT);
    };
    const onDown = () => { c.down = true; };
    const onUp = () => { c.down = false; };
    const onOut = (e: MouseEvent) => { if (!e.relatedTarget) c.on = false; };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerover", onOver);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseout", onOut);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      c.t += dt;

      // Atraso suave do anel, independente da taxa de quadros
      const follow = reduce ? 1 : 1 - Math.pow(0.0005, dt);
      c.rx += (c.mx - c.rx) * follow;
      c.ry += (c.my - c.ry) * follow;

      // Raio: fecha ao clicar, abre em cima de clicáveis
      const target = c.down ? 8 : c.hot ? 22 : 14;
      c.r += (target - c.r) * (1 - Math.pow(0.001, dt));

      ring.style.opacity = dot.style.opacity = c.on ? "1" : "0";
      ring.style.transform = `translate3d(${c.rx}px, ${c.ry}px, 0)`;
      dot.style.transform = `translate3d(${c.mx}px, ${c.my}px, 0)`;

      for (let i = 0; i < pts.length; i++) {
        const base = (i / pts.length) * Math.PI * 2;
        const angle = reduce ? base : base + c.t * 1.1; // gira
        const breathe = reduce ? 0 : Math.sin(c.t * 2.6) * 3 + Math.sin(c.t * 4 + i * 0.9) * 1.2; // expande, contrai e ondula
        const rad = c.r + breathe;
        // Encaixa numa grade de 2px pra manter a cara de pixel
        const x = Math.round((Math.cos(angle) * rad) / 2) * 2;
        const y = Math.round((Math.sin(angle) * rad) / 2) * 2;
        pts[i].style.transform = `translate(${x}px, ${y}px)`;
        pts[i].style.opacity = reduce ? "1" : (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(c.t * 5 + i * 1.7))).toFixed(2);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onOut);
      document.documentElement.classList.remove("pixel-cursor");
    };
  }, []);

  const layer: React.CSSProperties = {
    position: "fixed",
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
    pointerEvents: "none",
    mixBlendMode: "difference",
    zIndex: 9999,
    transition: "opacity 200ms",
  };
  const pixel: React.CSSProperties = {
    position: "absolute",
    left: -1,
    top: -1,
    width: 2,
    height: 2,
    background: "#F2EDE8",
    willChange: "transform, opacity",
  };

  return (
    <>
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          html.pixel-cursor, html.pixel-cursor * { cursor: none !important; }
        }
      `}</style>
      <div ref={ringRef} aria-hidden="true" style={layer}>
        {Array.from({ length: DOTS }, (_, i) => (
          <span key={i} style={pixel} />
        ))}
      </div>
      <div ref={dotRef} aria-hidden="true" style={layer}>
        <span style={{ ...pixel, left: -2, top: -2, width: 4, height: 4, borderRadius: 1 }} />
      </div>
    </>
  );
}
