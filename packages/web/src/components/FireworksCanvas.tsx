import { useEffect, useRef } from "react";

const PALETTE = [
  "#e8c07a", "#d4a15a", "#6f8f6a", "#a8c5a0",
  "#f3ebe0", "#c8e6c9", "#ffd54f", "#ffb74d",
  "#80cbc4", "#ce93d8",
];

type Spark = {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  opacity: number;
  trail: Array<{ x: number; y: number }>;
};

type Rocket = {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
  launched: boolean;
  exploded: boolean;
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function FireworksCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    canvas.width = W();
    canvas.height = H();

    const onResize = () => { canvas.width = W(); canvas.height = H(); };
    window.addEventListener("resize", onResize);

    const sparks: Spark[] = [];

    function explode(x: number, y: number, color: string) {
      const count = 70 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 2.5 + Math.random() * 5;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          color,
          size: 2.5 + Math.random() * 3.5,
          opacity: 1,
          trail: [],
        });
      }
      // ring sparks in a second color
      const c2 = pick(PALETTE);
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const speed = 7 + Math.random() * 3;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: c2,
          size: 1.8,
          opacity: 0.8,
          trail: [],
        });
      }
    }

    // Schedule 8 rockets
    const rockets: Rocket[] = [0, 350, 700, 1050, 1400, 1750, 2100, 2500].map((delay, i) => ({
      x: W() * (0.12 + (i % 5) * 0.18) + (Math.random() - 0.5) * 60,
      y: H(),
      vy: -(12 + Math.random() * 6),
      targetY: H() * (0.12 + Math.random() * 0.28),
      color: pick(PALETTE),
      launched: false,
      exploded: false,
      _delay: delay,
    } as Rocket & { _delay: number }));

    let startMs = 0;
    let rafId = 0;

    function frame(now: number) {
      if (!ctx || !canvas) return;
      if (!startMs) startMs = now;
      const elapsed = now - startMs;

      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Launch pending rockets
      for (const r of rockets) {
        const rk = r as Rocket & { _delay: number };
        if (!rk.launched && elapsed >= rk._delay) {
          rk.launched = true;
          rk.x = canvas.width * (0.12 + Math.random() * 0.76);
          rk.y = canvas.height + 10;
        }
        if (!rk.launched || rk.exploded) continue;

        rk.y += rk.vy;
        rk.vy += 0.22; // gravity slows it

        // Draw rocket trail
        ctx.save();
        ctx.beginPath();
        ctx.arc(rk.x, rk.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = rk.color;
        ctx.shadowColor = rk.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();

        if (rk.y <= rk.targetY) {
          rk.exploded = true;
          explode(rk.x, rk.y, rk.color);
        }
      }

      // Update sparks
      for (const s of sparks) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 5) s.trail.shift();

        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.09;
        s.vx *= 0.97;
        s.opacity -= 0.013;

        if (s.opacity <= 0) continue;

        // Trail
        ctx.save();
        for (let t = 0; t < s.trail.length; t++) {
          const pt = s.trail[t]!;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, s.size * (t / s.trail.length) * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.opacity * (t / s.trail.length) * 0.4;
          ctx.fill();
        }
        // Head
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.opacity;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      // Remove dead sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        if (sparks[i]!.opacity <= 0) sparks.splice(i, 1);
      }

      if (elapsed < 5500) {
        rafId = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9000,
      }}
    />
  );
}
