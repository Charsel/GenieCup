import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@databricks/appkit-ui/react';
import { Send, Sparkles, Database } from 'lucide-react';
import { HERO_BUILDINGS, isPassoireThermique } from '../lib/demoAttributes';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  sql?: string;
  items?: Array<{ id: string; name: string; value: string }>;
}

const CHIPS = [
  'Quels bâtiments peuvent monter à 31 m ?',
  'Passoires thermiques (DPE F ou G)',
  'Parcelles mutables > 3 000 m²',
  'Quel est le meilleur potentiel de surélévation ?',
];

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `m${messageCounter}`;
}

function answerQuestion(question: string): ChatMessage {
  const t = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const entries = Object.entries(HERO_BUILDINGS);

  if (/(passoire|dpe|thermique|energie)/.test(t)) {
    const hits = entries.filter(([, b]) => isPassoireThermique(b.dpe_classe));
    return {
      id: nextId(),
      role: 'bot',
      text: `${hits.length} bâtiment(s) identifié(s) comme passoire thermique (DPE F ou G) éligible(s) à une surélévation avec rénovation thermique globale.`,
      sql: `SELECT batiment_groupe_id, adresse, dpe_classe, conso_kwh_m2_an\nFROM workspace.gold.batiments_plu\nWHERE dpe_classe IN ('F', 'G')\nORDER BY conso_kwh_m2_an DESC;`,
      items: hits.map(([id, b]) => ({ id, name: b.name || b.adresse, value: `DPE ${b.dpe_classe} (${b.conso_kwh_m2_an} kWh)` })),
    };
  }

  if (/(31\s*m|35\s*m|28\s*m|hauteur|plafond|monter|gabarit|marge)/.test(t)) {
    const ranked = [...entries].sort(
      ([, a], [, b]) => b.plafond_hauteur_m - b.hauteur_m - (a.plafond_hauteur_m - a.hauteur_m)
    );
    return {
      id: nextId(),
      role: 'bot',
      text: 'Classement par marge de hauteur disponible (plafond PLU bioclimatique − hauteur actuelle).',
      sql: `SELECT batiment_groupe_id, adresse, hauteur_m, plafond_hauteur_m,\n       (plafond_hauteur_m - hauteur_m) AS marge_m\nFROM workspace.gold.batiments_plu\nWHERE plafond_hauteur_m > hauteur_m\nORDER BY marge_m DESC;`,
      items: ranked.map(([id, b]) => ({
        id,
        name: b.name || b.adresse,
        value: `+${(b.plafond_hauteur_m - b.hauteur_m).toFixed(1)} m (Plafond ${b.plafond_hauteur_m} m)`,
      })),
    };
  }

  if (/(mutable|mutation|friche|atelier|garage|entrepot)/.test(t)) {
    const hits = entries.filter(([, b]) => b.mutable);
    return {
      id: nextId(),
      role: 'bot',
      text: `${hits.length} parcelle(s) mutable(s) à forte valeur d'opportunité urbaine détectée(s) :`,
      sql: `SELECT batiment_groupe_id, adresse, sdp_existante_m2, sdp_residuelle_m2\nFROM workspace.gold.batiments_plu\nWHERE est_mutable = true\nORDER BY sdp_residuelle_m2 DESC;`,
      items: hits.map(([id, b]) => ({
        id,
        name: b.name || b.adresse,
        value: `+${b.sdp_residuelle_m2.toLocaleString('fr-FR')} m² à créer`,
      })),
    };
  }

  if (/(surelev|surélév|potentiel|logement|capacite|creer)/.test(t)) {
    const ranked = [...entries].sort(([, a], [, b]) => b.sdp_residuelle_m2 - a.sdp_residuelle_m2);
    return {
      id: nextId(),
      role: 'bot',
      text: 'Potentiel total de constructibilité résiduelle calculé par application du PLU :',
      sql: `SELECT batiment_groupe_id, adresse, sdp_existante_m2, sdp_residuelle_m2\nFROM workspace.gold.batiments_plu\nORDER BY sdp_residuelle_m2 DESC;`,
      items: ranked.map(([id, b]) => ({
        id,
        name: b.name || b.adresse,
        value: `+${b.sdp_residuelle_m2.toLocaleString('fr-FR')} m² (≈ ${b.logts_potentiels} logts)`,
      })),
    };
  }

  return {
    id: nextId(),
    role: 'bot',
    text: "Requête analysée. Posez une question sur les plafonds de hauteur PLU (ex: 31 m), les passoires thermiques, ou le potentiel de surélévation résiduel.",
  };
}

export function AssistantChat({
  onSelectBuildingId,
}: {
  onSelectBuildingId?: (id: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: nextId(),
      role: 'bot',
      text: "Bonjour ! Je suis votre Assistant Territoire. Posez une question en langage naturel pour interroger Unity Catalog et localiser les gisements fonciers en 3D.",
    },
  ]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text: string) => {
    const q = text.trim();
    if (!q) return;

    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');
    setIsTyping(true);

    setTimeout(() => {
      const botMsg = answerQuestion(q);
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <Card className="flex h-full flex-col border-[#2c3142] bg-[#141720] text-[#eceef5]">
      <CardHeader className="flex-row items-center gap-2 space-y-0 border-b border-[#2c3142] p-3 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c8553d] text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-sm font-bold text-white">Assistant territoire</CardTitle>
          <p className="text-[11px] text-[#9aa0b8]">Questions NL → SQL sur Unity Catalog</p>
        </div>
        <Badge variant="outline" className="border-[#3a4054] font-mono text-[10px] text-[#ff7a5c]">
          Agent Bricks
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
        {/* Messages list */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-[#c8553d] px-3 py-2 text-xs text-white shadow'
                  : 'max-w-[92%] space-y-2 rounded-lg rounded-bl-sm border border-[#2c3142] bg-[#1b1f2c] p-2.5 text-xs shadow-md'
              }
            >
              <p className="leading-relaxed">{m.text}</p>
              {m.sql && (
                <div className="overflow-x-auto rounded border border-[#2c3142] bg-[#0d0f15] p-2 font-mono text-[10px] leading-relaxed text-[#9fb4d8]">
                  <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#7d8398]">
                    <Database className="h-2.5 w-2.5 text-[#ff7a5c]" />
                    Requête Unity Catalog
                  </div>
                  <pre className="whitespace-pre-wrap">{m.sql}</pre>
                </div>
              )}
              {m.items && m.items.length > 0 && (
                <div className="space-y-1 pt-1">
                  {m.items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => onSelectBuildingId?.(it.id)}
                      className="flex w-full items-center justify-between rounded bg-[#232838] px-2 py-1.5 text-left text-xs transition hover:bg-[#2c3142] hover:ring-1 hover:ring-[#c8553d]"
                    >
                      <span className="font-semibold text-white">{it.name}</span>
                      <span className="font-mono text-[11px] font-bold text-[#ff7a5c]">{it.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex w-fit items-center gap-1.5 rounded-lg border border-[#2c3142] bg-[#1b1f2c] px-3 py-2 text-xs text-[#9aa0b8]">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8553d]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8553d] [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8553d] [animation-delay:0.4s]" />
            </div>
          )}
        </div>

        {/* Suggested Chips */}
        <div className="flex flex-wrap gap-1">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSend(chip)}
              className="rounded-full border border-[#2c3142] bg-[#161a25] px-2 py-0.5 text-[11px] text-[#c3c7d8] transition hover:border-[#c8553d] hover:bg-[#232838] hover:text-white"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(draft);
          }}
          className="flex gap-1.5 border-t border-[#2c3142] pt-2"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ex. quels bâtiments peuvent monter à 31 m ?"
            className="flex-1 rounded border border-[#2c3142] bg-[#0d0f15] px-2.5 py-1.5 text-xs text-white placeholder-[#6f7690] focus:border-[#c8553d] focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded bg-[#c8553d] text-white shadow transition hover:bg-[#b0402a]"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
