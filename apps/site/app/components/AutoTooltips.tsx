"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import IconButton from "./IconButton";

const ITEMS = [
  {
    key: "textos",
    href: "https://open.substack.com/pub/valternascimento/p/biscoito-passatempo-dinossauros-e?utm_source=share&utm_medium=android&r=2x1xhg",
  },
  {
    key: "livros",
    href: "https://www.goodreads.com/book/show/207298822-what-i-ate-in-one-year",
  },
  {
    key: "documentários",
    href: "https://letterboxd.com/film/dahomey/",
  },
  {
    key: "coisas",
    href: "https://ivansouto.github.io/microbaile/",
  },
];

function longestCommonPrefix(a: string, b: string) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

// A null step is the "breath" between items, not an index into ITEMS.
const SEQUENCE: readonly (number | null)[] = [null, 0, 1, 2, 3];

type Timer = ReturnType<typeof setTimeout>;
const PAUSE_MS = 3600;
const BREATH_MS = 5000;
const TYPE_MS = 28;
const BACK_MS = 16;

export default function AutoTooltips() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [displayedUrl, setDisplayedUrl] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  const stepRef = useRef(0);
  // Timer handles start undefined rather than null: clearTimeout accepts
  // undefined, and both are equally a no-op before the first tick.
  const seqTimerRef = useRef<Timer | undefined>(undefined);
  const urlTimerRef = useRef<Timer | undefined>(undefined);
  const displayedUrlRef = useRef("");
  const lastItemIdxRef = useRef<number | null>(null);
  const tickRef = useRef<(() => void) | null>(null);

  const setUrl = useCallback((url: string) => {
    displayedUrlRef.current = url;
    setDisplayedUrl(url);
  }, []);

  const animateTo = useCallback(
    (target: string) => {
      clearTimeout(urlTimerRef.current);
      const from = displayedUrlRef.current;
      const pivot = longestCommonPrefix(from, target);

      setIsAnimating(true);

      const typePhase = (len: number) => {
        setUrl(target.substring(0, len));
        if (len < target.length) {
          urlTimerRef.current = setTimeout(() => typePhase(len + 1), TYPE_MS);
        } else {
          setIsAnimating(false);
        }
      };

      const backPhase = (len: number) => {
        setUrl(from.substring(0, len));
        if (len > pivot) {
          urlTimerRef.current = setTimeout(() => backPhase(len - 1), BACK_MS);
        } else {
          typePhase(pivot);
        }
      };

      backPhase(from.length);
    },
    [setUrl],
  );

  const tick = useCallback(() => {
    const idx = SEQUENCE[stepRef.current];
    setActiveIdx(idx);

    if (idx !== null) {
      lastItemIdxRef.current = idx;
      animateTo(ITEMS[idx].href);
    }

    const delay = idx === null ? BREATH_MS : PAUSE_MS;
    seqTimerRef.current = setTimeout(() => {
      stepRef.current = (stepRef.current + 1) % SEQUENCE.length;
      tickRef.current?.();
    }, delay);
  }, [animateTo]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    tick();
    return () => {
      clearTimeout(seqTimerRef.current);
      clearTimeout(urlTimerRef.current);
    };
  }, [tick]);

  const getFullHref = () =>
    lastItemIdxRef.current !== null ? ITEMS[lastItemIdxRef.current].href : "";

  const handleOpen = useCallback(() => {
    const href = getFullHref();
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);

  const wordClass = (i: number) =>
    `transition-colors duration-[600ms] ${
      activeIdx === i ? "text-sun-lighter" : ""
    }`;

  return (
    <div className="flex flex-col gap-4  text-foreground">
      <div className="space-y-2">
        <p className="font-manrope text-2xl tracking-tigther text-balance font-semibold">
          Todo mês, recomendações de{" "}
          <span className={wordClass(0)}>textos</span>
          {", "}
          <span className={wordClass(1)}>livros</span>
          {", "}
          <span className={wordClass(2)}>documentários</span>
          {" e "}
          <span className={wordClass(3)}>coisas</span>
          {" ainda sem taxonomia vigente."}
        </p>

        <p className="font-manrope text-lg">
          Uma curadoria opionada, profunda e otimista do melhor que a internet
          ainda tem pra oferecer.
        </p>
      </div>
      <div className="bg-sun-light flex px-3 py-2 rounded-full text-xs font-space-mono justify-between items-center gap-2">
        <div className="relative flex-1 overflow-hidden min-w-0">
          <span className="whitespace-nowrap block">
            {displayedUrl}
            {isAnimating && "▋"}
          </span>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-sun-light to-transparent pointer-events-none" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <IconButton
            label="Abrir em nova aba"
            onClick={handleOpen}
            disabled={!displayedUrl}
            className="transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-125 active:scale-90 cursor-pointer disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-dark focus-visible:ring-offset-1 rounded-sm"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </IconButton>
        </div>
      </div>
    </div>
  );
}
