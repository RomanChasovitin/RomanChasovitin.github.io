import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { answers, BUDGET, complaint, complaintReport, route, suggestions, upload, type Answer } from './data';
import { Critique, Doc, Icon, Rich, Spinner, type Open } from './ui';

// The assistant on a case: the complaint intelligence on the left, a chat on the right. The visitor can
// upload a document of their own; the agent reads it and links what it finds to the record. For every
// question the agent builds its context in front of the visitor: which documents it takes, which it drops
// and why, and how much of the token budget they use. The answer cites the documents it kept.

type Message =
  | { id: number; role: 'user'; text: string; file?: string }
  | { id: number; role: 'agent'; kind: 'upload'; at: number }
  | { id: number; role: 'agent'; kind: 'answer'; answer: Answer; at: number };

const CANDIDATE_MS = 380;
const WORD_MS = 28;
const UPLOAD_STEPS_MS = [0, 900, 1800, 2600];

/** Words of an answer, with each [[link]] kept whole. */
const words = (text: string) => text.split(/(\[\[[^\]]+\]\]|\s+)/).filter(Boolean);

function answerDone(answer: Answer) {
  return answer.context.length * CANDIDATE_MS + 400 + words(answer.text).length * WORD_MS;
}

let nextId = 0;

export default function CaseAnalysis({ onOpen }: { onOpen: Open }) {
  const [doc, setDoc] = useState<'intelligence' | 'complaint'>('intelligence');
  const [mode, setMode] = useState<'report' | 'critique' | 'assistant'>('assistant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploaded, setUploaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [picker, setPicker] = useState(false);
  const [cite, setCite] = useState<{ message: number; index: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const log = useRef<HTMLDivElement>(null);

  const busy = messages.some(
    (message) =>
      message.role === 'agent' &&
      now - message.at < (message.kind === 'upload' ? UPLOAD_STEPS_MS.at(-1)! : answerDone(message.answer)),
  );

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setNow(Date.now()), 60);
    return () => clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages.length, now]);

  // With the upload in the context, some questions get a different answer, so they come back as suggestions.
  const answerFor = (key: string) => (uploaded && answers[key].after) || answers[key].before;

  function ask(key: string, text?: string) {
    if (busy) return;
    const answer = answerFor(key);
    const at = Date.now();
    setNow(at);
    setMessages((all) => [...all, { id: nextId++, role: 'user', text: text ?? answer.question }, { id: nextId++, role: 'agent', kind: 'answer', answer, at: at + 300 }]);
  }

  function attach() {
    setPicker(false);
    if (busy || uploaded) return;
    const at = Date.now();
    setNow(at);
    setUploaded(true);
    setMessages((all) => [...all, { id: nextId++, role: 'user', text: '', file: upload.file }, { id: nextId++, role: 'agent', kind: 'upload', at: at + 300 }]);
  }

  function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    ask(route(text), text);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  const asked = new Set(messages.flatMap((message) => (message.role === 'agent' && message.kind === 'answer' ? [message.answer] : [])));
  const next = (uploaded ? suggestions.after : suggestions.before).filter((key) => !asked.has(answerFor(key)));

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-xpp-line bg-white">
        <div className="flex shrink-0 border-b border-xpp-line text-[0.8rem]" role="tablist">
          {(
            [
              ['intelligence', complaintReport.tab],
              ['complaint', 'Complaint'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={doc === id}
              onClick={() => setDoc(id)}
              className={`flex w-56 cursor-pointer items-center gap-2 border-r border-b-2 border-r-xpp-line px-3 py-2.5 ${doc === id ? 'border-b-xpp-blue text-xpp-ink' : 'border-b-transparent text-xpp-text'}`}
            >
              {id === 'intelligence' ? <Icon.sparkle className="size-3.5 text-xpp-blue" /> : <Icon.doc className="size-3.5 text-xpp-blue" />}
              {label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 border-b border-xpp-line px-2.5 py-1.5 text-[0.8rem] text-xpp-ink">
          <span className="flex items-center gap-1.5 rounded bg-xpp-line/70 px-2.5 py-1 font-medium">
            <Icon.toc className="size-3.5" /> Table of Contents
          </span>
          <span className="flex gap-1 text-xpp-text" aria-hidden="true">
            <Icon.link className="size-7 rounded border border-xpp-line p-1.5" />
            <Icon.word className="size-7 rounded border border-xpp-line p-1.5" />
            <Icon.pdf className="size-7 rounded border border-xpp-line p-1.5" />
          </span>
          <span className="ml-auto flex rounded-md bg-xpp-line/70 p-0.5">
            {(['report', 'critique', 'assistant'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className="cursor-pointer rounded px-3 py-1 font-medium text-xpp-ink aria-pressed:bg-white aria-pressed:text-xpp-blue"
              >
                {value === 'report' ? 'Report' : value === 'critique' ? 'Critique™' : 'Assistant'}
              </button>
            ))}
          </span>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto bg-xpp-line/70 p-5">
            {doc === 'intelligence' ? (
              <Doc report={complaintReport} onOpen={onOpen} zoom={0.95} />
            ) : (
              <article className="mx-auto max-w-[44rem] rounded-lg bg-white px-[8%] py-10 text-[0.85rem] leading-relaxed text-xpp-text">
                <p className="text-center text-[0.75rem] tracking-wide text-xpp-ink uppercase">In the United States District Court for the Eastern District of Texas</p>
                <p className="mt-4 text-center font-medium text-xpp-ink">Northwind Acoustics LLC v. Kestrel Devices Inc.</p>
                <p className="text-center">Case No. 2:26-cv-04817 · Complaint for Patent Infringement</p>
                {complaint.map(([number, text]) => (
                  <p key={number} className="mt-4 flex gap-3">
                    <span className="w-8 shrink-0 text-right text-xpp-muted">{number}.</span>
                    <span>{text}</span>
                  </p>
                ))}
              </article>
            )}
          </div>

          {mode !== 'report' && (
            <aside className="flex w-[21rem] shrink-0 flex-col border-l border-xpp-line bg-white">
              {mode === 'critique' ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-4 text-[0.85rem]">
                  <p className="mb-3 text-[0.95rem] font-medium text-xpp-ink">Critique™</p>
                  <Critique report={complaintReport} />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-xpp-line px-4 py-3">
                    <p className="text-[0.95rem] font-medium text-xpp-ink">Assistant</p>
                    <span className="flex gap-1 text-xpp-text" aria-hidden="true">
                      <Icon.doc className="size-6 rounded border border-xpp-line p-1" />
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 border-b border-xpp-line px-4 py-2 text-[0.7rem]">
                    <span className="py-0.5 text-xpp-muted">Case documents</span>
                    {['Complaint Intelligence', 'Complaint', 'Docket', ...(uploaded ? [upload.file] : [])].map((item) => (
                      <span key={item} className={`max-w-full truncate rounded px-1.5 py-0.5 ${item === upload.file ? 'bg-xpp-soft text-xpp-blue' : 'bg-xpp-page text-xpp-text'}`}>
                        {item}
                      </span>
                    ))}
                  </div>

                  <div ref={log} className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[0.8rem]">
                    {messages.length === 0 && (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <Icon.chat className="size-9 text-xpp-blue" />
                        <p className="mt-3 text-[1.05rem] font-medium text-xpp-ink">Ask anything about this case</p>
                        <p className="mt-1 text-xpp-text">All the documents might be found and can be added to the context</p>
                        <div className="mt-4 flex flex-col items-center gap-2">
                          {next.map((key) => (
                            <Suggestion key={key} onClick={() => ask(key)} text={answerFor(key).question} />
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((message) =>
                      message.role === 'user' ? (
                        <div key={message.id} className="mb-3 flex justify-end">
                          {message.file ? (
                            <span className="flex max-w-[85%] items-center gap-2 rounded-lg bg-xpp-soft px-3 py-2 text-xpp-ink">
                              <Icon.doc className="size-4 shrink-0 text-xpp-blue" />
                              <span className="min-w-0">
                                <span className="block truncate">{message.file}</span>
                                <span className="text-[0.7rem] text-xpp-muted">{upload.pages} pages, from your computer</span>
                              </span>
                            </span>
                          ) : (
                            <p className="max-w-[85%] rounded-lg bg-xpp-blue px-3 py-2 text-white">{message.text}</p>
                          )}
                        </div>
                      ) : message.kind === 'upload' ? (
                        <Parsed key={message.id} elapsed={now - message.at} onOpen={onOpen} />
                      ) : (
                        <Reply
                          key={message.id}
                          answer={message.answer}
                          elapsed={now - message.at}
                          cited={cite?.message === message.id ? cite.index : null}
                          onCite={(index) => setCite(index === null ? null : { message: message.id, index })}
                          onOpen={onOpen}
                        />
                      ),
                    )}

                    {messages.length > 0 && !busy && next.length > 0 && (
                      <div className="mt-1 flex flex-col items-start gap-1.5">
                        {next.map((key) => (
                          <Suggestion key={key} onClick={() => ask(key)} text={answerFor(key).question} />
                        ))}
                      </div>
                    )}
                  </div>

                  <form
                    className="relative m-3 rounded-lg border border-xpp-line focus-within:border-xpp-blue"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submit();
                    }}
                  >
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={onKeyDown}
                      rows={2}
                      placeholder="Ask about this case..."
                      aria-label="Ask about this case"
                      className="block w-full resize-none bg-transparent px-3 pt-2.5 text-[0.8rem] text-xpp-ink outline-none placeholder:text-xpp-muted"
                    />
                    <div className="flex items-center justify-between px-2 pb-2">
                      <button type="button" aria-label="Upload a document" aria-expanded={picker} disabled={uploaded} onClick={() => setPicker((value) => !value)} className="cursor-pointer rounded p-1 text-xpp-text hover:bg-xpp-page disabled:cursor-default disabled:opacity-40">
                        <Icon.clip className="size-4" />
                      </button>
                      <button type="submit" aria-label="Send" disabled={!draft.trim() || busy} className="cursor-pointer rounded p-1 text-xpp-blue disabled:cursor-default disabled:text-xpp-muted">
                        <Icon.send className="size-4" />
                      </button>
                    </div>
                    {picker && (
                      <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-xpp-line bg-white p-2 text-[0.8rem] shadow-lg">
                        <p className="px-1.5 pb-1.5 text-[0.7rem] font-medium text-xpp-muted">UPLOAD FROM YOUR COMPUTER</p>
                        <button type="button" onClick={attach} className="flex w-full cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-xpp-soft">
                          <Icon.doc className="size-4 shrink-0 text-xpp-blue" />
                          <span className="min-w-0">
                            <span className="block truncate text-xpp-ink">{upload.file}</span>
                            <span className="text-[0.7rem] text-xpp-muted">PDF, {upload.pages} pages, not filed yet</span>
                          </span>
                        </button>
                      </div>
                    )}
                  </form>
                </>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function Suggestion({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer rounded bg-xpp-soft px-2.5 py-1 text-left text-[0.75rem] font-medium text-xpp-blue hover:bg-xpp-ptab/60">
      {text}
    </button>
  );
}

function Parsed({ elapsed, onOpen }: { elapsed: number; onOpen: Open }) {
  const reached = UPLOAD_STEPS_MS.filter((ms) => elapsed >= ms).length;
  const step = (index: number, content: ReactNode) =>
    reached > index && (
      <li className="flex gap-2">
        {reached > index + 1 || index === UPLOAD_STEPS_MS.length - 1 ? <Icon.check className="mt-0.5 size-3.5 shrink-0 text-[#1f8a5b]" /> : <Spinner className="mt-0.5 size-3.5" />}
        <span>{content}</span>
      </li>
    );
  return (
    <div className="mb-3 rounded-lg border border-xpp-line p-3">
      <ul className="flex flex-col gap-1.5 text-xpp-text">
        {step(0, `Reading ${upload.pages} pages`)}
        {step(
          1,
          <>
            Found:
            {upload.found.map((line) => (
              <span key={line} className="block text-xpp-ink">
                {line}
              </span>
            ))}
          </>,
        )}
        {step(
          2,
          <>
            Linked to the record:{' '}
            {upload.linked.map((link, index) => (
              <span key={link}>
                {index > 0 && ', '}
                <Rich text={link} onOpen={onOpen} />
              </span>
            ))}
          </>,
        )}
        {step(3, `Added to the case documents, ${(upload.tokens / 1000).toFixed(1)}k tokens`)}
      </ul>
    </div>
  );
}

function Reply({ answer, elapsed, cited, onCite, onOpen }: { answer: Answer; elapsed: number; cited: number | null; onCite: (index: number | null) => void; onOpen: Open }) {
  const candidates = Math.max(0, Math.min(answer.context.length, Math.floor(elapsed / CANDIDATE_MS) + 1));
  const building = elapsed < answer.context.length * CANDIDATE_MS;
  const textStart = answer.context.length * CANDIDATE_MS + 400;
  const all = words(answer.text);
  const shown = Math.max(0, Math.min(all.length, Math.floor((elapsed - textStart) / WORD_MS)));
  const kept = answer.context.filter((item) => item.kept);
  const used = kept.reduce((sum, item) => sum + item.tokens, 0);
  if (elapsed < 0) {
    return (
      <p className="mb-3 flex items-center gap-2 text-xpp-muted">
        <Spinner className="size-3" /> Thinking
      </p>
    );
  }
  return (
    <div className="mb-3">
      <div className="rounded-lg border border-xpp-line p-3">
        <p className="flex items-center gap-2 font-medium text-xpp-ink">
          {building ? <Spinner className="size-3" /> : <Icon.check className="size-3.5 text-[#1f8a5b]" />}
          Building context
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {answer.context.slice(0, candidates).map((item) => {
            const number = kept.indexOf(item) + 1;
            return (
              <li key={item.label} className={`flex gap-2 rounded px-1 transition-colors ${number && cited === number ? 'bg-xpp-soft' : ''}`}>
                <span className={`mt-px w-4 shrink-0 text-center text-[0.7rem] font-medium ${item.kept ? 'text-xpp-blue' : 'text-xpp-muted'}`}>{item.kept ? number : '–'}</span>
                <span className="min-w-0 flex-1">
                  <span className={item.kept ? 'text-xpp-ink' : 'text-xpp-muted line-through'}>{item.label}</span>
                  <span className="block text-[0.7rem] text-xpp-muted">
                    {item.kept ? 'Kept' : 'Dropped'}: {item.why}
                  </span>
                </span>
                <span className="shrink-0 text-[0.7rem] text-xpp-muted tabular-nums">{(item.tokens / 1000).toFixed(1)}k</span>
              </li>
            );
          })}
        </ul>
        {!building && (
          <div className="mt-2.5">
            <span className="block h-1.5 overflow-hidden rounded-full bg-xpp-page">
              <span className="block h-full rounded-full bg-xpp-blue" style={{ width: `${(used / BUDGET) * 100}%` }} />
            </span>
            <p className="mt-1 text-[0.7rem] text-xpp-muted tabular-nums">
              {(used / 1000).toFixed(1)}k of {BUDGET / 1000}k tokens, {kept.length} of {answer.context.length} documents
            </p>
          </div>
        )}
      </div>
      {shown > 0 && (
        <p className="mt-2 leading-relaxed text-xpp-ink">
          <Rich text={all.slice(0, shown).join('')} onOpen={onOpen} onCite={onCite} />
        </p>
      )}
    </div>
  );
}
