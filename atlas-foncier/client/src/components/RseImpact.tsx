import { Popover, PopoverContent, PopoverTrigger } from '@databricks/appkit-ui/react';
import { Building2, Flame, Leaf, Sprout } from 'lucide-react';

/** « Impact RSE » block for the perimeter panel: why densifying this stock is the low-impact option. */
export function RseImpact({ residM2 }: { residM2: number }) {
  const items = [
    {
      icon: Sprout,
      kpi: '0 m²',
      title: 'de sol naturel artificialisé',
      text: `${residM2.toLocaleString('fr-FR')} m² créés par surélévation ou mutation de parcelles déjà bâties — trajectoire ZAN (loi Climat & Résilience).`,
    },
    {
      icon: Flame,
      kpi: 'DPE F/G',
      title: 'passoires thermiques ciblées',
      text: 'Densification couplée à une rénovation énergétique globale de l’existant.',
    },
    {
      icon: Building2,
      kpi: 'Réhabiliter',
      title: 'plutôt que démolir',
      text: 'La surélévation conserve la structure existante et le carbone qu’elle contient (logique RE2020).',
    },
  ];

  return (
    <div className="space-y-1.5 rounded border border-[#2f4a3c] bg-[#121a16] p-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 font-mono text-[10px] font-semibold tracking-wider text-[#7fb89f] uppercase">
          <Leaf className="h-3 w-3" />
          Impact RSE
        </span>
        <span className="rounded border border-[#2f4a3c] px-1 py-px font-mono text-[9px] text-[#7fb89f]">
          ZAN · Climat &amp; Résilience
        </span>
      </div>
      {items.map(({ icon: Icon, kpi, title, text }) => (
        <div key={title} className="flex gap-2">
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7fb89f]" />
          <div className="min-w-0">
            <div className="text-[11px] leading-tight">
              <span className="font-mono font-bold text-white">{kpi}</span>{' '}
              <span className="text-[#c3c7d8]">{title}</span>
            </div>
            <p className="text-[10px] leading-snug text-[#8d93a8]">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const GREEN_IT = [
  'Intro animée jouée une fois par session, et sautée si « réduire les animations » est activé.',
  'Vue gold = vue SQL dans Unity Catalog : aucune copie des données sources.',
  'Rendus de Génération IA calculés uniquement à la demande.',
  'Assistant Genie : 50 lignes affichées au plus, export CSV seulement sur demande.',
  'Interface sombre : moins d’énergie consommée sur les écrans OLED.',
];

/** Header badge listing the eco-design choices actually applied in the app. */
export function GreenItBadge() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-[#2f4a3c] bg-[#121a16] px-2 py-1 text-[11px] font-semibold text-[#7fb89f] transition hover:border-[#7fb89f]"
        >
          <Leaf className="h-3.5 w-3.5" />
          Numérique responsable
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 border-[#2f4a3c] bg-[#141720] p-3 text-[#eceef5]">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white">
          <Leaf className="h-3.5 w-3.5 text-[#7fb89f]" />
          Éco-conception d’Atlas Foncier
        </div>
        <ul className="space-y-1.5">
          {GREEN_IT.map((t) => (
            <li key={t} className="flex gap-1.5 text-[11px] leading-snug text-[#c3c7d8]">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#7fb89f]" />
              {t}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
