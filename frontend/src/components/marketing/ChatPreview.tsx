"use client";

/**
 * ChatPreview — a self-contained, looping "typing" demo of a shopper talking to
 * Leo. Independently authored for the ShopAgent marketing site; renders a small
 * chat panel (header → message thread → faux input) meant to sit inside the
 * hero's browser frame.
 */
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";

type Speaker = "shopper" | "leo";
type Turn = { from: Speaker; text: string };

const SCRIPT: Turn[] = [
  { from: "shopper", text: "Any waterproof hiking boots under $150?" },
  {
    from: "leo",
    text: "Yes — the TrailGrip GTX is $129 and rated for heavy rain. Want me to grab them?",
  },
  { from: "shopper", text: "Add size 10, ship to home." },
  {
    from: "leo",
    text: "Done ✓ Order #2208 placed — $129 paid, arriving Tue–Thu.",
  },
];

function Bubble({ turn, typing = false }: { turn: Turn; typing?: boolean }) {
  const isLeo = turn.from === "leo";
  return (
    <div className={`flex items-end gap-2 ${isLeo ? "" : "flex-row-reverse"}`}>
      {isLeo ? (
        <LogoMark className="h-6 w-6 flex-shrink-0" />
      ) : (
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-500">
          You
        </span>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isLeo
            ? "rounded-bl-md bg-white text-gray-700 border border-gray-100 shadow-sm"
            : "rounded-br-md bg-emerald-600 text-white"
        }`}
      >
        {turn.text}
        {typing && <span className="ml-0.5 inline-block w-1.5 animate-pulse">▍</span>}
      </div>
    </div>
  );
}

export function ChatPreview() {
  const [done, setDone] = useState(0); // count of fully-revealed turns
  const [typed, setTyped] = useState("");
  const [cursor, setCursor] = useState(0); // index of the turn currently typing

  useEffect(() => {
    // Finished the script → pause, then loop.
    if (cursor >= SCRIPT.length) {
      const restart = setTimeout(() => {
        setDone(0);
        setTyped("");
        setCursor(0);
      }, 3200);
      return () => clearTimeout(restart);
    }

    const turn = SCRIPT[cursor];
    const speed = turn.from === "leo" ? 20 : 34;
    let i = 0;
    let advance: ReturnType<typeof setTimeout> | undefined;
    const tick = setInterval(() => {
      i += 1;
      setTyped(turn.text.slice(0, i));
      if (i >= turn.text.length) {
        clearInterval(tick);
        advance = setTimeout(() => {
          setDone((d) => d + 1);
          setTyped("");
          setCursor((c) => c + 1);
        }, 600);
      }
    }, speed);

    return () => {
      clearInterval(tick);
      if (advance) clearTimeout(advance);
    };
  }, [cursor]);

  const revealed = SCRIPT.slice(0, done);
  const active = cursor < SCRIPT.length ? SCRIPT[cursor] : null;

  return (
    <div className="flex h-[420px] flex-col">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
        <LogoMark className="h-7 w-7" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">Leo</p>
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            online
          </p>
        </div>
      </div>

      {/* thread */}
      <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden px-4 py-4">
        {revealed.map((t, i) => (
          <Bubble key={i} turn={t} />
        ))}
        {active && typed && <Bubble turn={{ ...active, text: typed }} typing />}
      </div>

      {/* faux input */}
      <div className="border-t border-gray-100 px-3 py-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-400">
          Message Leo…
          <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
