"use client";

import { useEffect, useRef, useState } from "react";

// Proxy routes keep everything same-origin so SameSite=Strict cookies survive.
// The proxy strips X-Frame-Options / CSP frame-ancestors from responses.
const HOME_URL = "/api/proxy/home";
const LOGIN_URL = "/api/proxy/login";
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
const SEGMENTS = [
  { label: "Ultra", color: "#7b5fe0", isSpecial: true  }, // purple iridescent — top
  { label: "Mini",  color: "#1e2fa8", isSpecial: false }, // navy
  { label: "Minor", color: "#c8860a", isSpecial: false }, // gold
  { label: "Major", color: "#1e2fa8", isSpecial: false }, // navy
  { label: "Grand", color: "#c8860a", isSpecial: false }, // gold
  { label: "Mini",  color: "#1e2fa8", isSpecial: false }, // navy
  { label: "Minor", color: "#c8860a", isSpecial: false }, // gold
  { label: "Major", color: "#1e2fa8", isSpecial: false }, // navy
  { label: "Grand", color: "#c8860a", isSpecial: false }, // gold
  { label: "Mini",  color: "#1e2fa8", isSpecial: false }, // navy
  { label: "Minor", color: "#c8860a", isSpecial: false }, // gold
  { label: "Major", color: "#1e2fa8", isSpecial: false }, // navy
];

const N = SEGMENTS.length;
const ANGLE = 360 / N; // 30° per segment
const R = 100;          // wheel radius in SVG units (viewBox 0 0 220 220, centre 110,110)
const CX = 110;
const CY = 110;

function segmentPath(index: number): string {
  const startDeg = index * ANGLE - 90; // -90 so segment 0 points up
  const endDeg = startDeg + ANGLE;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = CX + R * Math.cos(toRad(startDeg));
  const y1 = CY + R * Math.sin(toRad(startDeg));
  const x2 = CX + R * Math.cos(toRad(endDeg));
  const y2 = CY + R * Math.sin(toRad(endDeg));
  return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

function labelTransform(index: number) {
  const midDeg = index * ANGLE - 90 + ANGLE / 2;
  const toRad = (d: number) => (d * Math.PI) / 180;
  // Place text along the spoke, 62% from centre
  const labelR = R * 0.62;
  const x = CX + labelR * Math.cos(toRad(midDeg));
  const y = CY + labelR * Math.sin(toRad(midDeg));
  // Rotate text so it runs along the spoke radially (outward from centre).
  // midDeg already points from centre → rim, so rotate by midDeg makes text
  // run along that axis. We add 90 so the text baseline is perpendicular to
  // the spoke... actually we want the text to BE the spoke direction.
  // From the reference: text reads outward, so rotate = midDeg.
  // textAnchor="middle" centres it on the label point.
  return { x, y, rotate: midDeg };
}

function JackpotWheel() {
  return (
    <div className="relative shrink-0" style={{ width: 160, height: 178 }}>
      {/* Pointer arrow + diamond finial */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: -2 }}>
        {/* Diamond */}
        <div style={{
          width: 16, height: 16, background: "linear-gradient(135deg,#ffe87a,#c8860a)",
          transform: "rotate(45deg)", margin: "0 auto", borderRadius: 3,
          boxShadow: "0 1px 6px rgba(0,0,0,0.55)",
        }} />
        {/* Arrow body */}
        <div style={{
          width: 0, height: 0, margin: "0 auto",
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "20px solid #e8a020",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.55))",
        }} />
      </div>

      {/* Wheel */}
      <div style={{ animation: "spin 5.8s linear infinite", marginTop: 18 }}>
        <svg
          viewBox="0 0 220 220"
          width={160}
          height={160}
          style={{ display: "block" }}
        >
          <defs>
            {/* Gold ring gradient */}
            <radialGradient id="goldRing" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffe87a" />
              <stop offset="40%" stopColor="#d4900a" />
              <stop offset="100%" stopColor="#7a4800" />
            </radialGradient>
            {/* Ultra segment iridescent */}
            <linearGradient id="ultraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a56eff" />
              <stop offset="50%" stopColor="#5b8fff" />
              <stop offset="100%" stopColor="#e070d0" />
            </linearGradient>
            {/* Hub — dark brownish-olive glossy ball (matches reference) */}
            <radialGradient id="hub" cx="32%" cy="26%" r="72%">
              <stop offset="0%"   stopColor="#6b6040" />
              <stop offset="30%"  stopColor="#2e2710" />
              <stop offset="70%"  stopColor="#0f0c04" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
            {/* Segment inner shadow for depth */}
            <filter id="segShadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="rgba(0,0,0,0.4)" />
            </filter>
          </defs>

          {/* Outer gold ring */}
          <circle cx={CX} cy={CY} r={R + 10} fill="url(#goldRing)" />
          {/* Inner dark ring to separate ring from segments */}
          <circle cx={CX} cy={CY} r={R + 1} fill="#1a1200" />

          {/* Segments */}
          {SEGMENTS.map((seg, i) => {
            const { x, y, rotate } = labelTransform(i);
            const fill = seg.isSpecial ? "url(#ultraGrad)" : seg.color;
            const isGold = !seg.isSpecial && seg.color === "#c8860a";
            return (
              <g key={i}>
                <path
                  d={segmentPath(i)}
                  fill={fill}
                  stroke="#0a0a1a"
                  strokeWidth={1.5}
                />
                {/* Subtle lighter inner edge for depth */}
                {isGold && (
                  <path d={segmentPath(i)} fill="rgba(255,255,255,0.07)" stroke="none" />
                )}
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${rotate},${x},${y})`}
                  fontSize={seg.isSpecial ? 13 : 12}
                  fontWeight="bold"
                  fontFamily='"Arial Rounded MT Bold", Arial, sans-serif'
                  fill="#ffffff"
                  filter="url(#segShadow)"
                >
                  {seg.label}
                </text>
              </g>
            );
          })}

          {/* Divider lines between segments */}
          {SEGMENTS.map((_, i) => {
            const deg = i * ANGLE - 90;
            const toRad = (d: number) => (d * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={CX + (R + 1) * Math.cos(toRad(deg))}
                y2={CY + (R + 1) * Math.sin(toRad(deg))}
                stroke="#0a0a1a"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Gold ring highlight arc */}
          <circle cx={CX} cy={CY} r={R + 5.5} fill="none" stroke="rgba(255,230,100,0.3)" strokeWidth={2} />

          {/* Centre hub — dark brownish glossy ball */}
          <circle cx={CX} cy={CY} r={16} fill="url(#hub)" />
          <circle cx={CX} cy={CY} r={16} fill="none" stroke="#b87820" strokeWidth={2} />
          {/* Primary specular — large soft glow top-left */}
          <circle cx={CX - 5} cy={CY - 5} r={5} fill="rgba(255,255,255,0.22)" />
          {/* Secondary specular — tiny sharp dot */}
          <circle cx={CX - 7} cy={CY - 7} r={2} fill="rgba(255,255,255,0.55)" />
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
        @keyframes spin { from { transform: rotate(-10deg); } to { transform: rotate(350deg); } }
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
