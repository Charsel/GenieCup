import { useState, useEffect } from 'react';
import { Sparkles, MapPin, X } from 'lucide-react';

interface IntroGlobeProps {
  onComplete: () => void;
}

export function IntroGlobe({ onComplete }: IntroGlobeProps) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 2000);
    const t2 = setTimeout(() => setStage(2), 4000);
    const t3 = setTimeout(() => {
      onComplete();
    }, 6200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const stages = [
    {
      title: 'La Terre',
      sub: 'Ingestion globale & modélisation des îlots urbains',
      scale: 'scale-75',
      accent: 'Terre',
    },
    {
      title: 'France · BDNB',
      sub: 'Base Nationale des Bâtiments & Diagnostics DPE',
      scale: 'scale-125',
      accent: 'France',
    },
    {
      title: 'Paris 13e',
      sub: 'Îlots Chevaleret – Tolbiac · Analyse de potentiel 3D & PLU',
      scale: 'scale-150',
      accent: 'Paris 13e',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0d0f15] via-[#141720] to-[#1e2230] p-8 text-white select-none">
      {/* Top Header */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c8553d] shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">Atlas Foncier</span>
            <span className="ml-2 rounded border border-[#3a4054] px-1.5 py-0.5 font-mono text-[10px] text-[#ff7a5c]">
              Databricks App · 3D
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="flex items-center gap-2 rounded-md border border-[#3a4054] bg-[#1b1f2c]/80 px-4 py-2 text-xs font-semibold text-[#eceef5] backdrop-blur hover:bg-[#232838] transition"
        >
          Passer l&rsquo;intro
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Center 3D Holographic Globe SVG */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Glow halo */}
        <div className="absolute h-96 w-96 rounded-full bg-[#c8553d]/15 blur-3xl animate-pulse" />

        <div className={`relative transition-all duration-1000 transform ${stages[stage].scale}`}>
          <svg width="340" height="340" viewBox="0 0 340 340" className="animate-spin-slow">
            <circle cx="170" cy="170" r="140" fill="none" stroke="#2c3142" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="170" cy="170" r="120" fill="none" stroke="#3a4054" strokeWidth="1.2" />
            <circle cx="170" cy="170" r="100" fill="#161a25" stroke="#c8553d" strokeWidth="2" />
            <ellipse cx="170" cy="170" rx="100" ry="35" fill="none" stroke="#3a4054" strokeWidth="1" />
            <ellipse cx="170" cy="170" rx="35" ry="100" fill="none" stroke="#3a4054" strokeWidth="1" />
          </svg>

          {/* Central Target Pin */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c8553d] shadow-2xl ring-4 ring-[#ff7a5c]/30 animate-bounce">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Indicator & Captions */}
      <div className="flex w-full max-w-xl flex-col gap-4">
        {/* Step bars */}
        <div className="grid grid-cols-3 gap-3">
          {stages.map((s, i) => (
            <div key={s.accent} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= stage ? 'bg-[#c8553d]' : 'bg-[#2c3142]'
                }`}
              />
              <span
                className={`text-[11px] font-mono uppercase tracking-wider ${
                  i <= stage ? 'text-[#ff7a5c] font-bold' : 'text-[#6b6a7d]'
                }`}
              >
                {s.accent}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight text-white">{stages[stage].title}</div>
          <p className="text-sm text-[#9aa0b8]">{stages[stage].sub}</p>
        </div>
      </div>
    </div>
  );
}
