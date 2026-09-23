import { useEffect, useRef, useState } from 'react';
import { INTRO_GEO } from '../lib/introGeo';

interface IntroGlobeProps {
  onComplete: () => void;
}

// Faithful port of the mockup's intro (maquettes/…/Main.dc.html, `globe(t)`):
// orthographic globe Terre → zoom on France → Paris 13e pin → fade into the app.
const ACCENT = '#c8553d';
const APP_BG = '#0d0f15';
const W = 1440;
const H = 900;
const CX = 720;
const CY = 450;
const RAD = Math.PI / 180;
const T1 = 2800;
const T2 = 5400;
const T3 = 6900;
const T4 = 8400;
const TEND = 8600;

const CAPTIONS: Array<[string, string]> = [
  ['La Terre', 'Chargement des couches · BDNB · PLU · cadastre'],
  ['France', 'Base de données nationale des bâtiments'],
  ['Paris 13e', 'Îlots Chevaleret – Tolbiac · analyse du potentiel foncier'],
];
const LABELS = ['Terre', 'France', 'Paris 13e'];

type Ring = ReadonlyArray<readonly [number, number]>;

function ease(x: number): number {
  x = Math.max(0, Math.min(1, x));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function globe(t: number) {
  let lon0: number;
  let lat0: number;
  let R: number;
  let gratOp = 0.5;
  let pinOp = 0;
  let fade = 0;
  let lineOp = 0;
  let stage = 0;
  let shOp = 0.55;
  let frMix = 0;

  if (t < T1) {
    const u = ease(t / T1);
    lon0 = -80 + 82.4 * u;
    lat0 = 14 + 32.6 * u;
    R = 270 + 30 * u;
  } else if (t < T2) {
    const u = ease((t - T1) / (T2 - T1));
    lon0 = 2.4;
    lat0 = 46.6;
    R = 300 * Math.pow(4400 / 300, u);
    gratOp = 0.5 * (1 - u);
    lineOp = Math.max(0, (u - 0.3) / 0.7);
    frMix = lineOp;
    shOp = 0.55 * (1 - u);
    stage = 1;
  } else if (t < T3) {
    const u = (t - T2) / (T3 - T2);
    lon0 = 2.4;
    lat0 = 46.6;
    R = 4400 * (1 + 0.035 * u);
    lineOp = 1;
    frMix = 1;
    gratOp = 0;
    shOp = 0;
    pinOp = Math.min(1, u * 3);
    stage = 2;
  } else {
    const u = ease(Math.min(1, (t - T3) / (T4 - T3)));
    lon0 = 2.4 - 0.05 * u;
    lat0 = 46.6 + 2.25 * Math.min(1, u * 1.5);
    R = 4554 * Math.pow(60000 / 4554, u);
    lineOp = 1 - u;
    frMix = 1;
    gratOp = 0;
    shOp = 0;
    pinOp = 1 - u;
    fade = Math.max(0, (u - 0.5) / 0.5);
    stage = 2;
  }
  if (t >= T4) fade = 1;

  const l0 = lon0 * RAD;
  const p0 = lat0 * RAD;
  const sp0 = Math.sin(p0);
  const cp0 = Math.cos(p0);
  const raw = (lo: number, la: number): [number, number, number] => {
    const l = lo * RAD - l0;
    const p = la * RAD;
    const cp = Math.cos(p);
    const sp = Math.sin(p);
    const cl = Math.cos(l);
    return [CX + R * cp * Math.sin(l), CY - R * (cp0 * sp - sp0 * cp * cl), sp0 * sp + cp0 * cp * cl];
  };
  const clamp = (v: number) => Math.max(-4000, Math.min(5500, v));
  // Points behind the horizon are pushed onto the limb, so fills stay closed.
  const polys = (list: Ring[]) => {
    let s = '';
    for (const poly of list) {
      let any = false;
      let part = '';
      poly.forEach(([lo, la], i) => {
        const [rx, ry, c] = raw(lo, la);
        let x = rx;
        let y = ry;
        if (c >= 0) any = true;
        else {
          const dx = x - CX;
          const dy = y - CY;
          const m = Math.hypot(dx, dy) || 1;
          x = CX + (dx / m) * R;
          y = CY + (dy / m) * R;
        }
        part += (i ? 'L' : 'M') + clamp(x).toFixed(1) + ' ' + clamp(y).toFixed(1);
      });
      if (any) s += part + 'Z';
    }
    return s;
  };
  const line = (arr: Array<[number, number]>) => {
    let s = '';
    let prev = false;
    for (const [lo, la] of arr) {
      const q = raw(lo, la);
      if (q[2] < 0) {
        prev = false;
        continue;
      }
      s += (prev ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      prev = true;
    }
    return s;
  };

  let grat = '';
  if (gratOp > 0.01) {
    for (let la = -60; la <= 60; la += 20) {
      const a: Array<[number, number]> = [];
      for (let lo = -180; lo <= 180; lo += 4) a.push([lo, la]);
      grat += line(a);
    }
    for (let lo = -180; lo < 180; lo += 20) {
      const a: Array<[number, number]> = [];
      for (let la = -80; la <= 80; la += 4) a.push([lo, la]);
      grat += line(a);
    }
  }

  const pr = raw(2.35, 48.85);
  const pin = pr[2] >= 0 ? pr : [-100, -100];
  const fr = Math.round(252 - 10 * frMix);
  const fg = Math.round(252 - 30 * frMix);
  const fb = Math.round(255 - 40 * frMix);

  return {
    r: R,
    grat,
    gratOp,
    land: polys(INTRO_GEO.land),
    water: polys(INTRO_GEO.water),
    fr: polys([INTRO_GEO.frOutline, INTRO_GEO.coOutline]),
    frFill: `rgb(${fr},${fg},${fb})`,
    lineOp,
    shx: CX + R * 0.25,
    shy: CY + R * 0.95,
    shr: R * 0.8,
    shry: R * 0.16,
    shOp,
    px: pin[0],
    py: pin[1],
    pinOp,
    fade,
    stage,
  };
}

export function IntroGlobe({ onComplete }: IntroGlobeProps) {
  const [t, setT] = useState(0);
  const doneRef = useRef(onComplete);
  useEffect(() => {
    doneRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let raf = 0;
    let t0: number | null = null;
    const tick = (now: number) => {
      if (t0 == null) t0 = now;
      const elapsed = now - t0;
      if (elapsed >= TEND) {
        doneRef.current();
        return;
      }
      setT(elapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const g = globe(t);
  const [caption, sub] = CAPTIONS[g.stage];

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden text-[#1f1e29] select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% 42%, #ffffff 0%, #f1f0f6 48%, #e2e1ec 100%)',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 block h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="afSphere" cx="38%" cy="32%" r="72%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#eeedf6" />
            <stop offset="0.85" stopColor="#d9d8ea" />
            <stop offset="1" stopColor="#c6c7e6" />
          </radialGradient>
          <filter id="afEmboss" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <feDropShadow dx="-1.6" dy="2.2" stdDeviation="1.6" floodColor="#7f82b8" floodOpacity="0.55" />
          </filter>
          <filter id="afSoft" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <ellipse cx={g.shx} cy={g.shy} rx={g.shr} ry={g.shry} fill="#a9abd6" opacity={g.shOp} filter="url(#afSoft)" />
        <circle
          cx={CX}
          cy={CY}
          r={g.r + 6}
          fill="none"
          stroke="#9aa6ff"
          strokeOpacity="0.22"
          strokeWidth="10"
          filter="url(#afSoft)"
        />
        <circle cx={CX} cy={CY} r={g.r} fill="url(#afSphere)" />
        <path d={g.grat} fill="none" stroke="#b7b8d8" strokeWidth="0.7" opacity={g.gratOp} />
        <g filter="url(#afEmboss)">
          <path d={g.land} fill="#fcfcff" stroke="#e4e4f1" strokeWidth="0.6" strokeLinejoin="round" />
          <path
            d={g.fr}
            fill={g.frFill}
            stroke={ACCENT}
            strokeOpacity={g.lineOp}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </g>
        <path d={g.water} fill="#e6e5f1" />
        <circle cx={CX} cy={CY} r={g.r} fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.5" />
        <g opacity={g.pinOp}>
          <circle className="af-ring" cx={g.px} cy={g.py} r="14" fill="none" stroke={ACCENT} strokeWidth="2" />
          <circle cx={g.px} cy={g.py} r="6" fill={ACCENT} stroke="#ffffff" strokeWidth="2" />
        </g>
        {g.pinOp > 0.02 && (
          <foreignObject x={g.px + 22} y={g.py - 58} width="160" height="48" opacity={g.pinOp}>
            <div
              className="inline-flex items-baseline gap-2.5 rounded px-3.5 py-2 text-white"
              style={{ background: '#1f1e29', border: `1px solid ${ACCENT}` }}
            >
              <span className="text-xl font-bold">Paris</span>
              <span className="text-lg text-[#ff7a5c]" style={{ fontFamily: "'DM Mono', monospace" }}>
                13e
              </span>
            </div>
          </foreignObject>
        )}
      </svg>

      {/* Logo */}
      <div className="absolute top-10 left-12 flex items-center gap-3">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <ellipse cx="15" cy="21" rx="13" ry="6" fill="#ffffff" stroke="#b3b2cc" strokeWidth="1.2" />
          <rect x="6" y="11" width="6" height="10" fill="#e9e8f1" stroke="#b3b2cc" strokeWidth="1" />
          <rect x="13" y="4" width="8" height="17" fill={ACCENT} />
          <rect x="21" y="4" width="3" height="17" fill="#9e3f2b" />
        </svg>
        <span className="text-xl font-bold tracking-[.2px]">Atlas Foncier</span>
        <span className="rounded-[3px] border border-[#d3d2df] px-1.5 py-0.5 text-xs tracking-[.6px] text-[#6b6a7d] uppercase">
          Databricks App
        </span>
      </div>

      {/* Steps + caption */}
      <div className="absolute bottom-14 left-12 flex flex-col gap-3.5">
        <div className="flex gap-2">
          {LABELS.map((label, i) => (
            <div key={label} className="flex w-[132px] flex-col gap-1.5">
              <div className="h-[3px] rounded-sm" style={{ background: i <= g.stage ? ACCENT : '#d6d5e2' }} />
              <span
                className="text-xs tracking-[.8px] uppercase"
                style={{ color: i <= g.stage ? '#1f1e29' : '#a2a1b2' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="text-[56px] leading-none font-bold tracking-[-1px]">{caption}</div>
        <div className="text-base text-[#6b6a7d]">{sub}</div>
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="absolute right-12 bottom-14 h-11 cursor-pointer rounded border border-[#cfcedd] bg-white/80 px-5 text-[15px] font-medium text-[#1f1e29] transition hover:bg-white"
      >
        Passer l&rsquo;intro
      </button>

      {/* Final fade into the app */}
      <div className="pointer-events-none absolute inset-0" style={{ background: APP_BG, opacity: g.fade }} />
    </div>
  );
}
