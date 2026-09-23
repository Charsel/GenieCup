import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@databricks/appkit-ui/react';
import { Send } from 'lucide-react';
import { DEMO_BUILDINGS, computeSurelevationM2, isPassoireThermique } from '../lib/demoAttributes';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  sql?: string;
  items?: Array<{ name: string; value: string }>;
}

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `m${messageCounter}`;
}

const CHIPS = [
  'Quels bâtiments ont le plus de marge de hauteur ?',
  'Passoires thermiques (DPE F ou G)',
  'Quel est le meilleur potentiel de surélévation ?',
];

function initialMessage(): ChatMessage {
  return {
    id: nextId(),
    role: 'bot',
    text: "Bonjour ! Mode démo : je réponds sur les 3 parcelles d'exemple de la carte en attendant l'agent Superviseur (Chantier 3) branché sur les vraies données BDNB et PLU.",
  };
}

function answer(question: string): ChatMessage {
  const t = question.toLowerCase();
  const entries = Object.entries(DEMO_BUILDINGS);

  if (/(passoire|dpe|thermique)/.test(t)) {
    const hits = entries.filter(([, b]) => isPassoireThermique(b.dpe_classe));
    return {
      id: nextId(),
      role: 'bot',
      text: `${hits.length} bâtiment(s) d'exemple en passoire thermique (DPE F/G).`,
      sql: "SELECT batiment_groupe_id, adresse, dpe_classe\nFROM workspace.gold.batiments_plu\nWHERE dpe_classe IN ('F', 'G');",
      items: hits.map(([, b]) => ({ name: b.adresse, value: `DPE ${b.dpe_classe}` })),
    };
  }

  if (/(hauteur|monter|elev|culmin|plafond|gabarit|marge)/.test(t)) {
    const ranked = [...entries].sort(
      ([, a], [, b]) => b.plafond_hauteur_m - b.hauteur_m - (a.plafond_hauteur_m - a.hauteur_m),
    );
    return {
      id: nextId(),
      role: 'bot',
      text: 'Classement par marge de hauteur disponible (plafond PLU − hauteur actuelle).',
      sql: 'SELECT batiment_groupe_id, adresse, hauteur_m, plafond_hauteur_m,\n       (plafond_hauteur_m - hauteur_m) AS marge_m\nFROM workspace.gold.batiments_plu\nORDER BY marge_m DESC;',
      items: ranked.map(([, b]) => ({
        name: b.adresse,
        value: `+${(b.plafond_hauteur_m - b.hauteur_m).toFixed(1)} m`,
      })),
    };
  }

  if (/(surelev|niveau|etage|potentiel|construct)/.test(t)) {
    const ranked = [...entries].sort(([, a], [, b]) => computeSurelevationM2(b) - computeSurelevationM2(a));
    return {
      id: nextId(),
      role: 'bot',
      text: 'Estimation de surélévation possible (emprise × niveaux gagnés × 0,88).',
      sql: 'SELECT batiment_groupe_id, adresse, sdp_residuelle_m2\nFROM workspace.gold.batiments_plu\nORDER BY sdp_residuelle_m2 DESC;',
      items: ranked.map(([, b]) => ({
        name: b.adresse,
        value: `${computeSurelevationM2(b).toLocaleString('fr-FR')} m²`,
      })),
    };
  }

  return {
    id: nextId(),
    role: 'bot',
    text: "Je n'ai pas reconnu de critère dans les 3 parcelles d'exemple. Essayez la hauteur, le DPE, ou le potentiel de surélévation — ou revenez une fois l'agent Superviseur branché sur les données complètes.",
  };
}

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [initialMessage()]);
  const [draft, setDraft] = useState('');

  function send(text: string) {
    const question = text.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: question }, answer(question)]);
    setDraft('');
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Assistant territoire</CardTitle>
          <p className="text-xs text-muted-foreground">Questions → SQL sur Unity Catalog</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          Mode démo
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden pt-0">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground'
                  : 'max-w-[90%] space-y-2 rounded-lg rounded-bl-sm bg-muted px-3 py-2 text-sm'
              }
            >
              <p>{m.text}</p>
              {m.sql && (
                <pre className="overflow-x-auto rounded bg-background/60 p-2 font-mono text-[11px] leading-relaxed">
                  {m.sql}
                </pre>
              )}
              {m.items && m.items.length > 0 && (
                <div className="space-y-1">
                  {m.items.map((it) => (
                    <div key={it.name} className="flex items-center justify-between text-xs">
                      <span>{it.name}</span>
                      <span className="font-mono text-primary">{it.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="rounded-full border px-2.5 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
            >
              {c}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ex. quels bâtiments peuvent monter le plus ?"
          />
          <Button type="submit" size="icon" aria-label="Envoyer">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
