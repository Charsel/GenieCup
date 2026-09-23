import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, useGenieChat } from '@databricks/appkit-ui/react';
import type { GenieMessageItem } from '@databricks/appkit-ui/react';
import { GenieVisual } from './GenieVisual';
import { Send, Sparkles, Database, RotateCcw } from 'lucide-react';

// Alias registered in server/server.ts → Genie space « PLU Règlement - Q&A ».
const GENIE_ALIAS = 'plu';

const CHIPS = [
  'Quelles sont les règles de construction en zone UA ?',
  'Quelle est la hauteur maximale autorisée en zone UG ?',
  "Quelles sont les règles d'emprise au sol en zone UA ?",
  'Quelles destinations sont autorisées en zone UV ?',
];

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Question envoyée…',
  FILTERING_CONTEXT: 'Analyse du contexte…',
  ASKING_AI: 'Genie réfléchit…',
  PENDING_WAREHOUSE: 'Démarrage du SQL warehouse…',
  EXECUTING_QUERY: 'Exécution de la requête…',
};

/** Minimal Markdown for Genie answers: `**bold**` and `- ` bullet lists. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

function GenieMarkdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul${blocks.length}`} className="list-disc space-y-0.5 pl-4">
          {bullets.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };
  for (const line of text.split('\n')) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      bullets.push(bullet[1]);
    } else {
      flush();
      if (line.trim()) blocks.push(<p key={`p${blocks.length}`}>{renderInline(line)}</p>);
    }
  }
  flush();
  return <div className="space-y-1.5 leading-relaxed">{blocks}</div>;
}

/** Rows that carry a batiment_groupe_id become clickable, to open the parcel sheet. */
function buildingItems(message: GenieMessageItem): Array<{ id: string; label: string }> {
  for (const result of message.queryResults.values()) {
    const cols = result.manifest.schema.columns.map((c) => c.name);
    const idIdx = cols.indexOf('batiment_groupe_id');
    if (idIdx < 0) continue;
    const labelIdx = cols.findIndex((_, i) => i !== idIdx);
    return (result.result.data_array ?? [])
      .filter((row) => row[idIdx])
      .slice(0, 8)
      .map((row) => ({ id: String(row[idIdx]), label: labelIdx >= 0 ? String(row[labelIdx] ?? '') : '' }));
  }
  return [];
}

export function AssistantChat({ onSelectBuildingId }: { onSelectBuildingId?: (id: string) => void }) {
  const { messages, status, error, sendMessage, reset } = useGenieChat({
    alias: GENIE_ALIAS,
    persistInUrl: false,
  });
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const isBusy = status === 'streaming' || status === 'loading-history';

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    const q = text.trim();
    if (!q || isBusy) return;
    sendMessage(q);
    setDraft('');
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const suggested = lastAssistant?.attachments.flatMap((a) => a.suggestedQuestions ?? []) ?? [];
  const chips = suggested.length > 0 ? suggested.slice(0, 3) : CHIPS;

  return (
    <Card className="flex h-full flex-col border-[#2c3142] bg-[#141720] text-[#eceef5]">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-[#2c3142] p-3 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c8553d] text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-sm font-bold text-white">Assistant territoire</CardTitle>
          <p className="text-[11px] text-[#9aa0b8]">Règlement PLU · Genie sur Unity Catalog</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={reset}
            title="Nouvelle conversation"
            className="flex h-6 w-6 items-center justify-center rounded text-[#9aa0b8] transition hover:bg-[#232838] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        <Badge variant="outline" className="border-[#3a4054] font-mono text-[10px] text-[#ff7a5c]">
          Genie
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
        {/* Messages list */}
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="max-w-[92%] rounded-lg rounded-bl-sm border border-[#2c3142] bg-[#1b1f2c] p-2.5 text-xs leading-relaxed shadow-md">
            {"Bonjour ! Je suis votre Assistant Territoire, connecté à l'espace Genie « PLU Règlement ». " +
              "Posez une question en langage naturel sur les règles d'urbanisme d'une zone."}
          </div>

          {messages.map((m) =>
            m.role === 'user' ? (
              <div
                key={m.id}
                className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-[#c8553d] px-3 py-2 text-xs text-white shadow"
              >
                {m.content}
              </div>
            ) : (
              <AssistantBubble key={m.id} message={m} onSelectBuildingId={onSelectBuildingId} />
            )
          )}

          {error && (
            <div className="max-w-[92%] rounded-lg border border-[#7a2e22] bg-[#2a1614] p-2.5 text-xs text-[#ffb4a3]">
              Erreur Genie : {error}
            </div>
          )}
        </div>

        {/* Suggested Chips */}
        <div className="flex flex-wrap gap-1">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isBusy}
              onClick={() => handleSend(chip)}
              className="rounded-full border border-[#2c3142] bg-[#161a25] px-2 py-0.5 text-left text-[11px] text-[#c3c7d8] transition hover:border-[#c8553d] hover:bg-[#232838] hover:text-white disabled:opacity-50"
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
            placeholder="Ex. quelles sont les règles de construction en zone UA ?"
            className="flex-1 rounded border border-[#2c3142] bg-[#0d0f15] px-2.5 py-1.5 text-xs text-white placeholder-[#6f7690] focus:border-[#c8553d] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isBusy || !draft.trim()}
            className="flex h-8 w-8 items-center justify-center rounded bg-[#c8553d] text-white shadow transition hover:bg-[#b0402a] disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

function AssistantBubble({
  message,
  onSelectBuildingId,
}: {
  message: GenieMessageItem;
  onSelectBuildingId?: (id: string) => void;
}) {
  const pending = !message.content && !message.error && message.attachments.length === 0;
  const queries = message.attachments.filter((a) => a.query?.query);
  const items = buildingItems(message);

  if (pending) {
    return (
      <div className="flex w-fit items-center gap-2 rounded-lg border border-[#2c3142] bg-[#1b1f2c] px-3 py-2 text-xs text-[#9aa0b8]">
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8553d]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8553d] [animation-delay:0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8553d] [animation-delay:0.4s]" />
        </span>
        {STATUS_LABELS[message.status] ?? 'Genie réfléchit…'}
      </div>
    );
  }

  return (
    <div className="max-w-[92%] space-y-2 rounded-lg rounded-bl-sm border border-[#2c3142] bg-[#1b1f2c] p-2.5 text-xs shadow-md">
      {message.content && <GenieMarkdown text={message.content} />}
      {message.error && <p className="text-[#ffb4a3]">{message.error}</p>}
      {queries.map((a) => (
        <details
          key={a.attachmentId ?? a.query?.statementId}
          className="overflow-x-auto rounded border border-[#2c3142] bg-[#0d0f15] p-2 font-mono text-[10px] leading-relaxed text-[#9fb4d8]"
        >
          <summary className="flex cursor-pointer items-center gap-1 text-[9px] uppercase tracking-wider text-[#7d8398]">
            <Database className="h-2.5 w-2.5 text-[#ff7a5c]" />
            Requête Unity Catalog
          </summary>
          {a.query?.description && <p className="mt-1 font-sans text-[10px] text-[#9aa0b8]">{a.query.description}</p>}
          <pre className="mt-1 whitespace-pre-wrap">{a.query?.query}</pre>
        </details>
      ))}
      {queries.map((a) => {
        const data = a.attachmentId ? message.queryResults.get(a.attachmentId) : undefined;
        return data ? (
          <GenieVisual key={`r-${a.attachmentId}`} data={data} title={a.query?.title || a.query?.description} />
        ) : null;
      })}
      {items.length > 0 && (
        <div className="space-y-1 pt-1">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelectBuildingId?.(it.id)}
              className="flex w-full items-center justify-between rounded bg-[#232838] px-2 py-1.5 text-left text-xs transition hover:bg-[#2c3142] hover:ring-1 hover:ring-[#c8553d]"
            >
              <span className="font-semibold text-white">{it.label || it.id}</span>
              <span className="font-mono text-[10px] text-[#ff7a5c]">{it.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
