"use client";

import { useEffect, useRef, useState } from "react";

const HOME_URL = "https://www.jackpota.com/home";
const LOGIN_URL = "https://www.jackpota.com/login";
type ViewMode = "loggedOut" | "loggedIn";

function ViewToggle({
  active,
  label,
  ariaLabel,
  onClick,
}: {
  active: boolean;
  label: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-14 min-w-[82px] items-center justify-center rounded-[1rem] border px-3 text-[11px] font-medium leading-none tracking-[-0.03em] whitespace-nowrap transition sm:text-[13px] ${
        active
          ? "border-[#49f17b] bg-[#09110d] text-[#49f17b] shadow-[0_0_0_1px_rgba(73,241,123,0.08),0_10px_24px_rgba(0,0,0,0.22)]"
          : "border-transparent bg-transparent text-[#a1aab6] hover:text-white"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────
   JACKPOT WIDGET — rendered inline in the phone
───────────────────────────────────────────── */
const START_AMOUNT = 249840;
const TARGET_AMOUNT = 250000;
const STEP_SEQUENCE = [18, 14, 23, 11, 17, 20, 13, 16, 28];


/* ─────────────────────────────────────────────
   JACKPOT WHEEL SVG — 12 segments, navy/gold
───────────────────────────────────────────── */
// Clockwise from top, matching the reference wheel image exactly
// ─── Wheel segments (clockwise, index 0 = top = Ultra) ───────────────────────
const SEGMENTS = [
  { label: "Ultra", fill: "url(#ultraSegGrad)", textFill: "url(#ultraTxtGold)", special: true  },
  { label: "Mini",  fill: "#091650",            textFill: "#ffffff",         special: false },
  { label: "Minor", fill: "#1b40d4",            textFill: "#ffffff",         special: false },
  { label: "Major", fill: "#091650",            textFill: "#ffffff",         special: false },
  { label: "Grand", fill: "url(#grandGrad)",    textFill: "#ffffff",         special: false },
  { label: "Mini",  fill: "#1b40d4",            textFill: "#ffffff",         special: false },
  { label: "Minor", fill: "#091650",            textFill: "#ffffff",         special: false },
  { label: "Major", fill: "#1b40d4",            textFill: "#ffffff",         special: false },
  { label: "Minor", fill: "#091650",            textFill: "#ffffff",         special: false },
  { label: "Mini",  fill: "#1b40d4",            textFill: "#ffffff",         special: false },
  { label: "Grand", fill: "url(#grandGrad)",    textFill: "#ffffff",         special: false },
  { label: "Major", fill: "#091650",            textFill: "#ffffff",         special: false },
];

// ─── Wheel SVG geometry (wheel only — pointer is a separate static element) ──
const N          = SEGMENTS.length;
const ANGLE      = 360 / N;   // 30° per segment
const WCX        = 107;       // wheel centre x in its own 214×214 SVG
const WCY        = 107;       // wheel centre y
const WR         = 86;        // segment outer radius
const RING_OUTER = 104;       // gold ring outer radius (ring thickness = 18)

function wSegPath(i: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const s = i * ANGLE - 90;
  const e = s + ANGLE;
  const x1 = WCX + WR * Math.cos(toRad(s));
  const y1 = WCY + WR * Math.sin(toRad(s));
  const x2 = WCX + WR * Math.cos(toRad(e));
  const y2 = WCY + WR * Math.sin(toRad(e));
  return `M ${WCX} ${WCY} L ${x1} ${y1} A ${WR} ${WR} 0 0 1 ${x2} ${y2} Z`;
}

function wLabelPos(i: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const mid = i * ANGLE - 90 + ANGLE / 2;
  const lr  = WR * 0.60;
  return { x: WCX + lr * Math.cos(toRad(mid)), y: WCY + lr * Math.sin(toRad(mid)), rotate: mid };
}

function JackpotWheel() {
  // Layout (all px, container = 214 wide × 247 tall):
  //   Wheel SVG 214×214 sits at the BOTTOM  → wheel.top = 33px in container
  //   Hub centre in container               → 33 + WCY(107) = 140px
  //   Pointer SVG 56 wide × 144 tall, top:0 → tip at y=144 ≈ hub (140) ✓
  //   Ring outer top in container           → 33 + (107-RING_OUTER) = 33+3 = 36
  //   Pointer triangle base at y=36         → aligns with ring outer top ✓
  const SPIN = "spin 5.8s linear infinite";
  const ultraLbl = wLabelPos(0);

  return (
    <div className="relative shrink-0" style={{ width: 214, height: 247 }}>

      {/* ── Static pointer — never rotates ── */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 20, pointerEvents: "none" }}>
        {/* Pointer — one unified triangle: flat top cap + V-rails share the same
            corner points (4,4) and (52,4), tip at hub (28,142).
            Interior transparent; gold strokes on all three edges. */}
        <svg width="56" height="144" viewBox="0 0 56 144" style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="railL" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#fff4a0" />
              <stop offset="45%"  stopColor="#e0a018" />
              <stop offset="100%" stopColor="#7a4400" />
            </linearGradient>
            <linearGradient id="railR" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%"   stopColor="#fff4a0" />
              <stop offset="45%"  stopColor="#e0a018" />
              <stop offset="100%" stopColor="#7a4400" />
            </linearGradient>
            <linearGradient id="topEdgeG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#fff8b0" />
              <stop offset="100%" stopColor="#c07810" />
            </linearGradient>
            <filter id="pF" x="-40%" y="-15%" width="180%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.65)" />
            </filter>
          </defs>

          <g filter="url(#pF)">
            {/* Full triangle tint — very subtle gold wash over interior */}
            <polygon points="4,4 52,4 28,142"
              fill="rgba(200,145,0,0.07)" stroke="none" />

            {/* Cap triangle area extra tint (top third only) */}
            <polygon points="4,4 52,4 28,50"
              fill="rgba(240,185,20,0.18)" stroke="none" />
            {/* Cap metallic sheen */}
            <polygon points="9,7 47,7 28,42"
              fill="rgba(255,250,160,0.38)" stroke="none" />

            {/* ── Left rail — full length from cap corner to hub ── */}
            <path d="M 4,4 L 28,142"
              stroke="url(#railL)" strokeWidth="8"
              strokeLinecap="round" fill="none" />
            <path d="M 8,7 L 28,137"
              stroke="rgba(255,248,160,0.42)" strokeWidth="2.5"
              strokeLinecap="round" fill="none" />

            {/* ── Right rail — full length from cap corner to hub ── */}
            <path d="M 52,4 L 28,142"
              stroke="url(#railR)" strokeWidth="8"
              strokeLinecap="round" fill="none" />
            <path d="M 48,7 L 28,137"
              stroke="rgba(255,248,160,0.42)" strokeWidth="2.5"
              strokeLinecap="round" fill="none" />

            {/* ── Flat top edge of cap ── */}
            <path d="M 3,4 L 53,4"
              stroke="url(#topEdgeG)" strokeWidth="7"
              strokeLinecap="round" fill="none" />
            <path d="M 5,4 L 51,4"
              stroke="rgba(255,252,185,0.55)" strokeWidth="2.5"
              strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </div>

      {/* ── Spinning wheel ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 214, height: 214, animation: SPIN }}>
        <svg viewBox="0 0 214 214" width={214} height={214} style={{ display: "block", overflow: "visible" }}>
          <defs>
            {/* Gold ring */}
            <radialGradient id="gRing" cx="50%" cy="26%" r="74%">
              <stop offset="0%"   stopColor="#fff4b0" />
              <stop offset="25%"  stopColor="#f0c030" />
              <stop offset="60%"  stopColor="#c07810" />
              <stop offset="100%" stopColor="#5e3000" />
            </radialGradient>
            <radialGradient id="gSheen" cx="50%" cy="18%" r="55%">
              <stop offset="0%"   stopColor="rgba(255,255,200,0.5)" />
              <stop offset="100%" stopColor="rgba(255,255,200,0)" />
            </radialGradient>
            {/* Ultra segment fill — pink→purple aurora (matches reference) */}
            <linearGradient id="ultraSegGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%"   stopColor="#e04888" />
              <stop offset="45%"  stopColor="#5828b8" />
              <stop offset="100%" stopColor="#28087a" />
            </linearGradient>
            {/* Ultra text — gold/yellow gradient */}
            <linearGradient id="ultraTxtGold" gradientUnits="userSpaceOnUse"
              x1={ultraLbl.x} y1={ultraLbl.y - 9}
              x2={ultraLbl.x} y2={ultraLbl.y + 9}>
              <stop offset="0%"   stopColor="#fff8a0" />
              <stop offset="50%"  stopColor="#f0b020" />
              <stop offset="100%" stopColor="#b06808" />
            </linearGradient>
            {/* Grand segment */}
            <linearGradient id="grandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#e8a020" />
              <stop offset="100%" stopColor="#9a5c08" />
            </linearGradient>
            {/* Hub */}
            <radialGradient id="hubG" cx="30%" cy="26%" r="70%">
              <stop offset="0%"   stopColor="#484848" />
              <stop offset="40%"  stopColor="#111111" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
            {/* Text shadow */}
            <filter id="tF" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="rgba(0,0,0,0.8)" />
            </filter>
          </defs>

          {/* Outer gold ring */}
          <circle cx={WCX} cy={WCY} r={RING_OUTER + 1} fill="#3a1e00" />
          <circle cx={WCX} cy={WCY} r={RING_OUTER}     fill="url(#gRing)" />
          <circle cx={WCX} cy={WCY} r={RING_OUTER}     fill="url(#gSheen)" />
          {/* Ring inner dark separator */}
          <circle cx={WCX} cy={WCY} r={WR + 2}         fill="#04030e" />

          {/* Segments */}
          {SEGMENTS.map((seg, i) => {
            const { x, y, rotate } = wLabelPos(i);
            return (
              <g key={i}>
                <path d={wSegPath(i)} fill={seg.fill} stroke="#04030e" strokeWidth={1.5} />
                <text
                  x={x} y={y}
                  textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${rotate},${x},${y})`}
                  fontSize={seg.special ? 14 : 12}
                  fontWeight="bold"
                  fontFamily='"Arial Rounded MT Bold","Helvetica Rounded",Arial,sans-serif'
                  fill={seg.textFill}
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth={seg.special ? 2.5 : 3}
                  paintOrder="stroke fill"
                  filter="url(#tF)"
                >
                  {seg.label}
                </text>
              </g>
            );
          })}

          {/* Dividers */}
          {SEGMENTS.map((_, i) => {
            const toRad = (d: number) => (d * Math.PI) / 180;
            const deg = i * ANGLE - 90;
            return (
              <line key={i}
                x1={WCX} y1={WCY}
                x2={WCX + (WR + 2) * Math.cos(toRad(deg))}
                y2={WCY + (WR + 2) * Math.sin(toRad(deg))}
                stroke="#04030e" strokeWidth={1.8}
              />
            );
          })}

          {/* Ring highlight rims */}
          <circle cx={WCX} cy={WCY} r={WR + 10}        fill="none" stroke="rgba(255,215,60,0.22)" strokeWidth={3} />
          <circle cx={WCX} cy={WCY} r={RING_OUTER - 5} fill="none" stroke="rgba(255,245,140,0.20)" strokeWidth={2} />

          {/* Centre hub — black glossy ball */}
          <circle cx={WCX} cy={WCY} r={14} fill="url(#hubG)" />
          <circle cx={WCX} cy={WCY} r={14} fill="none" stroke="rgba(160,100,0,0.45)" strokeWidth={1.5} />
          <circle cx={WCX - 4.5} cy={WCY - 4.5} r={4.5} fill="rgba(255,255,255,0.17)" />
          <circle cx={WCX - 6}   cy={WCY - 6}   r={1.8} fill="rgba(255,255,255,0.65)" />
        </svg>
      </div>
    </div>
  );
}

function JackpotWidget() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const amountRef = useRef(START_AMOUNT);
  const triggeredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  const startTicker = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    amountRef.current = START_AMOUNT;
    triggeredRef.current = false;
    setSheetOpen(false);
    setModalOpen(false);
    stepRef.current = 0;

    timerRef.current = setInterval(() => {
      const step = STEP_SEQUENCE[stepRef.current % STEP_SEQUENCE.length];
      stepRef.current += 1;
      amountRef.current = Math.min(amountRef.current + step, TARGET_AMOUNT);
      if (amountRef.current >= TARGET_AMOUNT) {
        clearInterval(timerRef.current!);
        setTimeout(() => {
          if (!triggeredRef.current) {
            triggeredRef.current = true;
            setSheetOpen(true);
          }
        }, 520);
      }
    }, 180);
  };

  useEffect(() => {
    const id = setTimeout(startTicker, 0);
    return () => {
      clearTimeout(id);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const blurred = sheetOpen || modalOpen;

  return (
    <div className="relative h-[720px] overflow-hidden bg-black" style={{ fontFamily: '"Avenir Next", "Helvetica Neue", Arial, sans-serif' }}>

      {/* ── REAL JACKPOTA SITE (blurred when sheet/modal open) ── */}
      <iframe
        src={HOME_URL}
        title="Jackpota live preview"
        className="h-full w-full border-0"
        style={{
          transition: "filter 0.3s, transform 0.3s",
          filter: blurred ? "blur(4px) brightness(0.45)" : "none",
          transform: blurred ? "scale(1.015)" : "scale(1)",
          transformOrigin: "center center",
        }}
      />


      {/* ── SHEET BACKDROP ── */}
      {sheetOpen && (
        <div className="absolute inset-0 z-[5] bg-gradient-to-b from-transparent via-black/20 to-black/60" />
      )}

      {/* ── JACKPOT OPT-IN SHEET ── */}
      <div
        className="absolute bottom-3 left-3 right-3 z-[6] overflow-hidden rounded-[26px] border border-[#f6b449]/40 p-4 transition-transform duration-[340ms]"
        style={{
          background: "radial-gradient(circle at 72% 18%, rgba(246,180,73,0.14), transparent 24%), linear-gradient(180deg, rgba(18,14,8,0.98), rgba(8,8,8,0.98))",
          boxShadow: "0 24px 46px rgba(0,0,0,0.56), inset 0 0 0 1px rgba(246,180,73,0.09)",
          transform: sheetOpen ? "translateY(0)" : "translateY(calc(100% + 20px))",
        }}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(false)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-xl text-white"
          aria-label="Close widget"
        >
          ×
        </button>

        {/* Wheel centred above copy */}
        <div className="flex justify-center">
          <JackpotWheel />
        </div>
        <div className="mt-2 text-center">
          <p className="font-bold uppercase leading-tight text-white" style={{ fontFamily: '"Arial Rounded MT Bold", Arial, sans-serif', fontSize: "1.05rem", letterSpacing: "-0.03em" }}>
            Big Jackpot just reached
          </p>
          <p
            className="font-black uppercase"
            style={{
              fontFamily: '"Arial Rounded MT Bold", Arial, sans-serif',
              fontSize: "2.2rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              background: "linear-gradient(180deg, #fff7a0 0%, #f6b449 40%, #e07b00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
              filter: "drop-shadow(0 0 12px rgba(246,180,73,0.7)) drop-shadow(0 2px 6px rgba(0,0,0,0.8))",
              animation: "jackpotPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both, jackpotPulse 2.4s ease-in-out 0.5s infinite",
            }}
          >
            SC 250,000!
          </p>
          <p className="mt-1 text-[0.72rem] uppercase text-white/80">Don&apos;t miss your chance. Opt-in now.</p>
        </div>

        <button
          type="button"
          onClick={() => { setSheetOpen(false); setModalOpen(true); }}
          className="mt-3 w-full rounded-[18px] py-3.5 text-base font-black text-white"
          style={{
            fontFamily: '"Arial Rounded MT Bold", Arial, sans-serif',
            background: "linear-gradient(180deg, #1a9a3a, #0f6a28)",
            boxShadow: "0 14px 28px rgba(73,241,123,0.25), inset 0 1px 0 rgba(255,255,255,0.16)",
            letterSpacing: "-0.03em",
          }}
        >
          Opt-in now!
        </button>
        <p className="mt-2 text-center text-[0.7rem] font-bold text-white/80 underline underline-offset-2">SC Jackpots T&amp;Cs apply</p>
      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {modalOpen && (
        <div
          className="absolute inset-0 z-[7] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="relative w-full overflow-hidden rounded-[28px] p-6"
            style={{
              border: "1px solid rgba(246,180,73,0.34)",
              background: "radial-gradient(circle at top, rgba(246,180,73,0.14), transparent 28%), linear-gradient(180deg, rgba(18,14,8,0.98), rgba(10,10,10,0.99))",
              boxShadow: "0 30px 60px rgba(0,0,0,0.56)",
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-xl text-white"
              aria-label="Close modal"
            >
              ×
            </button>
            <p className="text-center font-black italic text-[#f6b449]" style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem" }}>Jackpota</p>
            <h4 className="mt-1 text-center text-[1.3rem] font-black uppercase tracking-tight text-white" style={{ fontFamily: '"Arial Rounded MT Bold", Arial, sans-serif' }}>
              You Are Opted In
            </h4>
            <p className="text-center text-[1rem] font-bold text-[#f6b449]" style={{ fontFamily: '"Arial Rounded MT Bold", Arial, sans-serif' }}>Start playing now!</p>

            <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[
                "evo_6477", "blive_launch_rng_jpota_crash", "evo_6425",
                "pls_royal_coins_2_hold_and_win", "oa_aztec_fire", "adg_godfather_megaways", "fug_dogecoinlink",
              ].map((code) => (
                <div
                  key={code}
                  className="h-[108px] w-[78px] shrink-0 overflow-hidden rounded-[14px] bg-[#121212]"
                  style={{ border: "1px solid rgba(246,180,73,0.18)" }}
                >
                  <img
                    src={`https://storage.googleapis.com/www.jackpota.com/tiles-v3/${code}/source.png`}
                    alt={code}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            <p className="mt-3 text-center text-[0.7rem] text-white/70">
              <span className="underline underline-offset-2 cursor-pointer">SC Jackpots</span> rules apply
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes jackpotPop {
          0%   { transform: scale(0.4); opacity: 0; filter: drop-shadow(0 0 28px rgba(246,180,73,1)) drop-shadow(0 2px 6px rgba(0,0,0,0.8)); }
          60%  { transform: scale(1.22); opacity: 1; }
          80%  { transform: scale(0.92); }
          100% { transform: scale(1);   opacity: 1; filter: drop-shadow(0 0 12px rgba(246,180,73,0.7)) drop-shadow(0 2px 6px rgba(0,0,0,0.8)); }
        }
        @keyframes jackpotPulse {
          0%   { transform: scale(1);    filter: drop-shadow(0 0  8px rgba(246,180,73,0.45)) drop-shadow(0 2px 6px rgba(0,0,0,0.8)); }
          50%  { transform: scale(1.1); filter: drop-shadow(0 0 26px rgba(246,180,73,0.9))  drop-shadow(0 3px 8px rgba(0,0,0,0.9)); }
          100% { transform: scale(1);    filter: drop-shadow(0 0  8px rgba(246,180,73,0.45)) drop-shadow(0 2px 6px rgba(0,0,0,0.8)); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function Home() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("loggedOut");
  const [jackpotWidgetOn, setJackpotWidgetOn] = useState(false);

  const resetPreview = () => {
    setPreviewKey((current) => current + 1);
    iframeRef.current?.focus();
  };

  const loginInFrame = () => {
    if (iframeRef.current) iframeRef.current.src = LOGIN_URL;
  };

  const goHomeInFrame = () => {
    if (iframeRef.current) iframeRef.current.src = HOME_URL;
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(247,189,67,0.14),_transparent_22%),linear-gradient(180deg,_#110c15_0%,_#0a0810_55%,_#07060b_100%)] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur md:p-6 xl:flex-row">

        {/* ── SIDEBAR ── */}
        <aside className="w-full rounded-[1.75rem] border border-white/10 bg-[#120d18]/90 p-5 xl:w-[320px] xl:flex-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-amber-300/80">Jackpota lab</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Jackpota mobile preview</h1>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/12 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.24em] text-emerald-200">
              Public POC
            </span>
          </div>

          {/* View mode toggle */}
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">View mode</p>
            <div className="inline-flex rounded-[1.2rem] border border-white/10 bg-[#070c12] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_28px_rgba(0,0,0,0.22)]">
              <ViewToggle active={viewMode === "loggedOut"} label="Logged Out" ariaLabel="Logged Out" onClick={() => setViewMode("loggedOut")} />
              <ViewToggle active={viewMode === "loggedIn"} label="Logged In" ariaLabel="Logged In" onClick={() => setViewMode("loggedIn")} />
            </div>
          </div>

          {/* ── FEATURE TOGGLES ── */}
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">Feature toggles</p>
            <div className="mt-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Jackpot widget</p>
                  <p className="mt-0.5 text-[0.72rem] leading-snug text-white/50">
                    Opt-in sheet triggered at SC 250,000
                  </p>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={jackpotWidgetOn}
                  onClick={() => setJackpotWidgetOn((v) => !v)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ${
                    jackpotWidgetOn ? "border-[#49f17b] bg-[#49f17b]" : "border-white/20 bg-white/10"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      jackpotWidgetOn ? "translate-x-5" : "translate-x-0.5"
                    }`}
                    style={{ marginTop: "1px" }}
                  />
                </button>
              </div>
              {jackpotWidgetOn && (
    <p className="mt-3 rounded-xl bg-[#49f17b]/10 px-3 py-2 text-[0.72rem] leading-snug text-[#49f17b]">
              Widget active &mdash; watch the jackpot counter reach SC 250,000 and the opt-in sheet slides up.
            </p>
              )}
            </div>
          </div>

          {/* Preview state info */}
          <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">Preview state</p>
            <p className="mt-2 text-base font-medium text-white">
              Live Jackpota — {viewMode === "loggedOut" ? "logged out" : "logged in"} view
            </p>
            <p className="mt-1 text-sm leading-6 text-white/55">
              {jackpotWidgetOn
                ? "Widget prototype is active. The live iframe is hidden while the widget is on."
                : <>Use <strong className="text-white/80">Log in (inside frame)</strong> below — the login page loads inside the phone so cookies are set on jackpota.com directly.</>}
            </p>
          </div>

          {/* Same-frame controls — only relevant for live iframe */}
          {!jackpotWidgetOn && (
            <>
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">Same-frame controls</p>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={resetPreview}
                    className="inline-flex items-center justify-center rounded-[1.25rem] border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-300/16"
                  >
                    Reset preview to home
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[1.35rem] border border-[#3a5a3a] bg-[#0d1a0d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400/70">Session login</p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Log in inside the phone frame — cookies stay on jackpota.com so the session is real. After logging in, tap <strong className="text-white/80">Go to home</strong>.
                </p>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={loginInFrame}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[1.1rem] bg-[linear-gradient(135deg,_#1a7a3a_0%,_#0f5a28_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(26,122,58,0.35)] transition hover:brightness-110"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-none">
                      <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
                    </svg>
                    Log in (inside frame)
                  </button>
                  <button
                    type="button"
                    onClick={goHomeInFrame}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[1.1rem] border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/14 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-none">
                      <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
                    </svg>
                    Go to home
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="mt-4 grid gap-3">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">Environment</p>
              <p className="mt-2 text-base font-medium text-white">Single Jackpota public environment</p>
              <p className="mt-1 text-sm text-white/55">
                Refreshing the page resets the preview back to the Jackpota home page and the logged out state.
              </p>
            </div>
          </div>
        </aside>

        {/* ── PREVIEW SECTION ── */}
        <section className="flex min-w-0 flex-1 flex-col rounded-[1.75rem] border border-white/10 bg-[#0b0910]/85 p-4 md:p-6">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-white/40">Live mobile view</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {jackpotWidgetOn ? "Jackpot widget prototype" : viewMode === "loggedOut" ? "Jackpota — logged out" : "Jackpota — logged in"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                {jackpotWidgetOn
                  ? "Demo lobby with the live jackpot counter. Watch it reach SC 250,000 — the opt-in sheet slides up automatically."
                  : <>Live site inside the phone shell. Use <strong className="text-white/80">Log in (inside frame)</strong> in the sidebar — login happens inside the device so cookies stay valid.</>}
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
              <span className={`h-2.5 w-2.5 rounded-full shadow-[0_0_16px_rgba(74,222,128,0.85)] ${jackpotWidgetOn ? "bg-amber-400" : "bg-emerald-400"}`} />
              {jackpotWidgetOn ? "Widget prototype" : "Embedded live preview"}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-2 py-6 md:px-6">
            <div className="w-full max-w-[430px] rounded-[2.8rem] border border-white/12 bg-[#18121f] p-3 shadow-[0_35px_90px_rgba(0,0,0,0.55)]">
              <div className="rounded-[2.3rem] border border-white/8 bg-[#050507] p-3">
                <div className="mx-auto mb-3 h-7 w-32 rounded-full bg-white/8" />
                <div
                  title="Jackpota mobile preview"
                  className="relative overflow-hidden rounded-[1.8rem] border border-white/8 bg-black"
                >
                  {jackpotWidgetOn ? (
                    <JackpotWidget />
                  ) : (
                    <iframe
                      key={previewKey}
                      ref={iframeRef}
                      title="Jackpota mobile preview frame"
                      src={HOME_URL}
                      className="h-[720px] w-full bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
