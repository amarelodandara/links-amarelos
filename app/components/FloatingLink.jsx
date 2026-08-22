"use client";
import { useRef, useEffect, useState } from "react";
import PixelTrail from "./PixelTrail";

const R = 12;
const STIFFNESS = 0.1;
const DAMPING = 0.82;
const FLOAT_SPEED = 0.0007;

export default function FloatingLink({ title, url }) {
  const wrapRef = useRef(null);
  const posRef = useRef(null);
  const velRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef(null); // null = idle; { x, y } = follow
  const originRef = useRef(null); // saved pos on cursor enter
  const returnTimerRef = useRef(null);
  const rafRef = useRef(null);
  const t0Ref = useRef(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const section = wrap.parentElement;
    if (!section) return;

    const init = () => {
      const { width, height } = section.getBoundingClientRect();
      const cx = width / 2;
      const cy = height / 2;
      posRef.current = { x: cx, y: cy };
      setPos({ x: cx, y: cy });
      t0Ref.current = performance.now();
      setReady(true);
    };
    init();

    const relPos = (e) => {
      const rect = section.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onEnter = (e) => {
      clearTimeout(returnTimerRef.current);
      originRef.current = { ...posRef.current };
      targetRef.current = relPos(e);
    };

    const onMove = (e) => {
      clearTimeout(returnTimerRef.current);
      targetRef.current = relPos(e);
    };

    const onLeave = () => {
      if (originRef.current) {
        targetRef.current = { ...originRef.current };
        returnTimerRef.current = setTimeout(() => {
          targetRef.current = null;
          originRef.current = null;
        }, 1000);
      } else {
        targetRef.current = null;
      }
    };

    section.addEventListener("mouseenter", onEnter);
    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);

    const animate = (now) => {
      if (!posRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      const elapsed = now - (t0Ref.current ?? now);
      const { width: w, height: h } = section.getBoundingClientRect();

      let tx, ty;
      if (targetRef.current) {
        tx = targetRef.current.x;
        ty = targetRef.current.y;
      } else {
        // Lissajous idle drift across full section
        tx = w / 2 + Math.sin(elapsed * FLOAT_SPEED) * (w / 2 - R - 16);
        ty = h / 2 + Math.cos(elapsed * FLOAT_SPEED * 0.71) * (h / 2 - R - 16);
      }

      let { x, y } = posRef.current;
      let { x: vx, y: vy } = velRef.current;

      vx += (tx - x) * STIFFNESS;
      vy += (ty - y) * STIFFNESS;
      vx *= DAMPING;
      vy *= DAMPING;
      x += vx;
      y += vy;

      posRef.current = { x, y };
      velRef.current = { x: vx, y: vy };
      setPos({ x, y });

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      section.removeEventListener("mouseenter", onEnter);
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(returnTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {ready && (
        <>
          {/* Tooltip */}
          {hovered && (
            <div
              className="absolute pointer-events-auto flex flex-col items-center"
              style={{
                left: pos.x,
                top: pos.y - R - 52,
                transform: "translateX(-50%)",
                zIndex: 30,
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <div className="bg-white border border-sun-light rounded-sm shadow-sm px-3 py-2 flex items-center gap-2">
                <span className="font-manrope font-semibold text-sm text-stone-900 whitespace-nowrap">
                  {title}
                </span>
                <button
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                  className="text-sun-dark hover:text-code transition-colors duration-150"
                  title="Abrir link"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
              </div>
              <div className="w-2.5 h-2.5 bg-white border-r border-b border-sun-light rotate-45 -mt-1.5" />
            </div>
          )}

          {/* Circle */}
          <div
            className="absolute pointer-events-auto cursor-pointer overflow-hidden"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -50%)",
              width: R * 2,
              height: R * 2,
              borderRadius: "50%",
              background: "#ffcc00",
              border: "2px solid rgba(180,140,0,0.5)",
              zIndex: 20,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          >
            <PixelTrail color="255,255,255" />
          </div>
        </>
      )}
    </div>
  );
}
