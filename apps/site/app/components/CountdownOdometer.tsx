"use client";
import { useState, useEffect } from "react";

const TARGET = new Date("2026-07-11T00:00:00");
const H = "1.25em";

function getTimeLeft() {
  const diff = Math.max(0, TARGET.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function Digit({ value }: { value: number }) {
  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ height: H, width: "0.8em" }}
    >
      <span
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        style={{
          transform: `translateY(calc(${value} * -${H}))`,
          transition: "transform 0.45s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} style={{ height: H, display: "flex", alignItems: "center" }}>
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function Num({ value }: { value: number }) {
  if (value < 10) {
    return <Digit value={value} />;
  }
  const s = String(value).padStart(2, "0");
  return (
    <span className="inline-flex">
      <Digit value={+s[0]} />
      <Digit value={+s[1]} />
    </span>
  );
}

export default function CountdownOdometer() {
  const [t, setT] = useState(() => getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center leading-none tabular-nums select-none gap-1.5">
      <Num value={t.days} /><span className="opacity-70">dias</span>
      <Num value={t.hours} /><span className="opacity-70">h</span>
      <Num value={t.minutes} /><span className="opacity-70">m</span>
      <Num value={t.seconds} /><span className="opacity-70">s</span>
    </span>
  );
}
