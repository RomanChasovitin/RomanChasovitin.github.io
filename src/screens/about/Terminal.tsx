import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { run, skills, type Line, type Step } from './skills';

// A light terminal with an agent that answers from the site's own data. Enter runs a command,
// Shift+Enter adds a line (for pasted job posts and code), the up arrow brings back the last command.

const GREEN = '#0a7d3b';
const DIM = '#6e6e6e';
const SPINNER = ['·', '✢', '✳', '✶', '✻', '✽'];
const TOOL_MS = 380;
const LINE_MS = 28;

type Entry = {
  id: number;
  command: string;
  steps: Step[];
  /** Steps fully shown so far. */
  shown: number;
  /** Lines of the current output step shown so far. */
  lines: number;
  startedAt: number;
  thoughtMs?: number;
};

let nextId = 0;

function Segments({ line }: { line: Line }) {
  return (
    <p className="min-h-[1.5em] whitespace-pre-wrap">
      {line.map((segment, index) => (
        <span
          key={index}
          style={{ color: segment.dim ? DIM : segment.color, fontWeight: segment.bold ? 700 : undefined }}
        >
          {segment.text}
        </span>
      ))}
    </p>
  );
}

function help(): Step[] {
  return [
    {
      kind: 'out',
      lines: [
        ...skills.map((skill): Line => [{ text: skill.usage.padEnd(28), bold: true }, { text: skill.summary, dim: true }]),
        [{ text: '/clear'.padEnd(28), bold: true }, { text: 'Clear the screen', dim: true }],
      ],
    },
  ];
}

export default function Terminal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const history = useRef<string[]>([]);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const introduced = useRef(false);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [entries]);

  // The spinner turns only while something runs.
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setTick((value) => value + 1), 120);
    return () => clearInterval(timer);
  }, [busy]);

  function play(entry: Entry) {
    const update = (patch: Partial<Entry>) =>
      setEntries((all) => all.map((item) => (item.id === entry.id ? { ...item, ...patch } : item)));
    let shown = 0;
    const next = () => {
      const step = entry.steps[shown];
      if (!step) {
        setBusy(false);
        return;
      }
      if (step.kind === 'think') {
        setTimeout(() => {
          shown++;
          update({ shown, thoughtMs: step.ms });
          next();
        }, step.ms);
      } else if (step.kind === 'tool') {
        setTimeout(() => {
          shown++;
          update({ shown });
          next();
        }, TOOL_MS);
      } else {
        let lines = 0;
        const stream = () => {
          lines++;
          update({ lines });
          if (lines < step.lines.length) setTimeout(stream, LINE_MS);
          else {
            shown++;
            update({ shown, lines: 0 });
            next();
          }
        };
        stream();
      }
    };
    next();
  }

  function submit(command: string) {
    const trimmed = command.trim();
    if (!trimmed || busy) return;
    history.current.push(trimmed);
    setDraft('');
    if (trimmed === '/clear') {
      setEntries([]);
      return;
    }
    const steps =
      trimmed === '/help'
        ? help()
        : (run(trimmed) ?? [
            { kind: 'out', lines: [[{ text: `${trimmed.split(/\s/)[0]} is not a skill I have. Type /help to see them.` }]] },
          ]);
    const entry: Entry = { id: nextId++, command: trimmed, steps, shown: 0, lines: 0, startedAt: Date.now() };
    setEntries((all) => [...all, entry]);
    setBusy(true);
    play(entry);
  }

  // On the first visit the agent introduces itself.
  useEffect(() => {
    const onScreen = (event: Event) => {
      if ((event as CustomEvent<{ id: string }>).detail.id !== 'about') return;
      input.current?.focus({ preventScroll: true });
      if (introduced.current) return;
      introduced.current = true;
      setTimeout(() => submit('/about'), 500);
    };
    document.addEventListener('screen:change', onScreen);
    if (document.documentElement.dataset.activeScreen === 'about') onScreen(new CustomEvent('screen:change', { detail: { id: 'about' } }));
    return () => document.removeEventListener('screen:change', onScreen);
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit(draft);
    } else if (event.key === 'ArrowUp' && !draft.includes('\n') && history.current.length) {
      event.preventDefault();
      setDraft(history.current.at(-1)!);
    }
  }

  function pick(usage: string) {
    const needsText = usage.includes('<');
    if (needsText) {
      setDraft(`${usage.split(' ')[0]} `);
      input.current?.focus();
    } else submit(usage.split(' ')[0]);
  }

  return (
    <div className="flex h-full flex-col font-jetbrains text-[0.9rem] leading-[1.5] text-black">
      <div className="border-b border-black/10 pb-5">
        <p>
          <span className="font-bold">✻ roman</span>
          <span style={{ color: DIM }}> An agent that knows my projects, my stack and my history. Five skills:</span>
        </p>
        <ul className="mt-3 grid grid-cols-[auto_1fr] gap-x-8 gap-y-1">
          {skills.map((skill) => (
            <li key={skill.name} className="contents">
              <button type="button" onClick={() => pick(skill.usage)} className="cursor-pointer text-left font-bold hover:underline">
                {skill.usage}
              </button>
              <span style={{ color: DIM }}>{skill.summary}</span>
            </li>
          ))}
        </ul>
      </div>

      <div ref={log} className="min-h-0 flex-1 overflow-y-auto py-5" aria-live="polite">
        {entries.map((entry) => (
          <div key={entry.id} className="mb-6">
            <p className="font-bold">› {entry.command.split('\n')[0]}{entry.command.includes('\n') ? ' …' : ''}</p>
            {entry.steps.map((step, index) => {
              if (index > entry.shown) return null;
              const current = index === entry.shown;
              if (step.kind === 'think') {
                return (
                  <p key={index} style={{ color: DIM }}>
                    {current ? `${SPINNER[tick % SPINNER.length]} ${step.label}…` : `✻ Thought for ${(step.ms / 1000).toFixed(1)}s`}
                  </p>
                );
              }
              if (step.kind === 'tool') {
                if (current) return null;
                return (
                  <div key={index}>
                    <p>
                      <span style={{ color: GREEN }}>● </span>
                      {step.call}
                    </p>
                    <p style={{ color: DIM }}>{`  ⎿ ${step.result}`}</p>
                  </div>
                );
              }
              const visible = current ? step.lines.slice(0, entry.lines) : step.lines;
              return (
                <div key={index} className="mt-2">
                  {visible.map((line, lineIndex) => (
                    <Segments key={lineIndex} line={line} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <form
        className="flex items-start gap-2 border-t border-black/10 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <span className="font-bold">›</span>
        <textarea
          ref={input}
          value={draft}
          rows={Math.min(6, draft.split('\n').length)}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={busy ? 'Working…' : 'Type a skill, for example /stack. Shift+Enter for a new line.'}
          aria-label="Command"
          className="min-w-0 flex-1 resize-none bg-transparent outline-none placeholder:text-black/35"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
