import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Input,
  useAnalyticsQuery,
} from '@databricks/appkit-ui/react';
import { Send } from 'lucide-react';
import type { BuildingRow } from './MapView';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  sql?: string;
  items?: Array<{ id: string; name: string; value: string }>;
}

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `m${messageCounter}`;
}

const CHIPS = [
  'Passoires thermiques (DPE F ou G)',
  'Bâtiments les plus hauts',
  "Immeubles avec le plus de logements",
];

function initialMessage(): ChatMessage {
  return {
    id: nextId(),
    role: 'bot',
    text: 'Bonjour ! Je réponds sur les bâtiments réels du périmètre (BDNB). Le plafond de hauteur PLU et la génération IA arrivent avec les Chantiers 2 à 4 — en attendant, le Supervisor Agent (Chantier 3) remplacera cette logique simulée.',
  };
}

function label(row: BuildingRow): string {
  return row.adresse ?? row.batiment_groupe_id;
}

function answer(question: string, rows: BuildingRow[]): ChatMessage {
  const t = question.toLowerCase();
  const matched = rows.filter((r) => !!r.adresse);

  if (/(passoire|dpe|thermique)/.test(t)) {
    const hits = matched.filter((r) => r.dpe_classe === 'F' || r.dpe_classe === 'G');
    return {
      id: nextId(),
      role: 'bot',
      text: `${hits.length} bâtiment(s) en passoire thermique (DPE F/G) sur ${matched.length} avec données BDNB.`,
      sql: "SELECT batiment_groupe_id, adresse, dpe_classe\nFROM workspace.gold.batiments_plu\nWHERE dpe_classe IN ('F', 'G');",
      items: hits.slice(0, 10).map((r) => ({ id: r.batiment_groupe_id, name: label(r), value: `DPE ${r.dpe_classe}` })),
    };
  }

  if (/(haut|hauteur|elev|culmin)/.test(t)) {
    const ranked = matched.filter((r) => r.hauteur_m != null).sort((a, b) => (b.hauteur_m ?? 0) - (a.hauteur_m ?? 0));
    return {
      id: nextId(),
      role: 'bot',
      text: 'Classement par hauteur (le plafond PLU arrivera au Chantier 2).',
      sql: 'SELECT batiment_groupe_id, adresse, hauteur_m\nFROM workspace.gold.batiments_plu\nORDER BY hauteur_m DESC;',
      items: ranked.slice(0, 10).map((r) => ({ id: r.batiment_groupe_id, name: label(r), value: `${r.hauteur_m} m` })),
    };
  }

  if (/(logement|résidentiel|residentiel)/.test(t)) {
    const ranked = matched
      .filter((r) => r.nombre_logements != null)
      .sort((a, b) => (b.nombre_logements ?? 0) - (a.nombre_logements ?? 0));
    return {
      id: nextId(),
      role: 'bot',
      text: 'Classement par nombre de logements.',
      sql: 'SELECT batiment_groupe_id, adresse, nombre_logements\nFROM workspace.gold.batiments_plu\nORDER BY nombre_logements DESC;',
      items: ranked
        .slice(0, 10)
        .map((r) => ({ id: r.batiment_groupe_id, name: label(r), value: `${r.nombre_logements} logements` })),
    };
  }

  if (/(surelev|potentiel|plafond|marge|construct)/.test(t)) {
    return {
      id: nextId(),
      role: 'bot',
      text: "Le calcul de potentiel constructible a besoin du plafond de hauteur PLU, qui n'est pas encore branché (Chantier 2). Dès qu'il le sera, cette question deviendra répondable.",
    };
  }

  return {
    id: nextId(),
    role: 'bot',
    text: "Je n'ai pas reconnu de critère dans les données disponibles (hauteur, DPE, logements). Le potentiel constructible et les recommandations arriveront avec le PLU et le Supervisor Agent.",
  };
}

export function AssistantChat() {
  const { data } = useAnalyticsQuery('batiments_perimetre', {});
  const [messages, setMessages] = useState<ChatMessage[]>(() => [initialMessage()]);
  const [draft, setDraft] = useState('');

  function send(text: string) {
    const question = text.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: question }, answer(question, data ?? [])]);
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
          Données réelles · logique simulée
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
                    <div key={it.id} className="flex items-center justify-between text-xs">
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
            placeholder="Ex. quels bâtiments sont des passoires thermiques ?"
          />
          <Button type="submit" size="icon" aria-label="Envoyer">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
