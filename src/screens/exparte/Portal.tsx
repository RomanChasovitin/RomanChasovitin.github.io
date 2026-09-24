import { useEffect, useRef, useState } from 'react';
import CaseAnalysis from './Assistant';
import { cases, MAIN_CASE, MAIN_PATENT, name, patents, type Ref } from './data';
import Intelligence from './Intelligence';
import { EntityPage, Search } from './Search';
import { CourtBadge, Demo, Icon, type Open } from './ui';

// The Ex Parte portal in a window: the blue rail, a header for the page, and one of three workflows.
// Patent intelligence lives on the Analysis tab of the patent, the assistant on the Analysis tab of the
// case, and search with every entity page in between. The workflow list in the left column of the screen
// switches between them through `exparte:workflow`; the portal reports where it is with `exparte:view`.
//
// The three workflows stay mounted while hidden, so a report in progress, the search filters and the chat
// all survive a trip to another page.

export type Workflow = 'intelligence' | 'search' | 'assistant';

type View = { kind: 'search' } | { kind: 'entity'; ref: Ref; tab: 'overview' | 'analysis' };

const START: Record<Workflow, View> = {
  intelligence: { kind: 'entity', ref: { kind: 'patent', id: MAIN_PATENT }, tab: 'analysis' },
  search: { kind: 'search' },
  assistant: { kind: 'entity', ref: { kind: 'case', id: MAIN_CASE }, tab: 'analysis' },
};

const hasAnalysis = (ref: Ref) => (ref.kind === 'patent' && ref.id === MAIN_PATENT) || (ref.kind === 'case' && ref.id === MAIN_CASE);

function workflowOf(view: View): Workflow {
  if (view.kind === 'entity' && view.tab === 'analysis') return view.ref.kind === 'patent' ? 'intelligence' : 'assistant';
  return 'search';
}

const KIND_LABEL: Record<Ref['kind'], string> = {
  case: '',
  patent: '',
  party: 'Party',
  firm: 'Law Firm',
  attorney: 'Attorney',
  judge: 'Judge',
  expert: 'Expert',
};

export default function Portal() {
  const [history, setHistory] = useState<View[]>([START.intelligence]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const started = useRef(false);
  const view = history.at(-1)!;
  const workflow = workflowOf(view);

  function go(next: View) {
    setHistory((all) => (JSON.stringify(all.at(-1)) === JSON.stringify(next) ? all : [...all, next]));
  }

  const open: Open = (ref, tab) => go({ kind: 'entity', ref, tab: tab ?? 'overview' });

  function generate() {
    started.current = true;
    setStartedAt(Date.now());
  }

  useEffect(() => {
    document.dispatchEvent(new CustomEvent('exparte:view', { detail: { workflow } }));
  }, [workflow]);

  useEffect(() => {
    const onWorkflow = (event: Event) => go(START[(event as CustomEvent<{ workflow: Workflow }>).detail.workflow]);
    // The first time the screen opens, the reports start on their own: the pipeline is the point of it.
    const onScreen = (event: Event) => {
      if ((event as CustomEvent<{ id: string }>).detail.id !== 'exparte' || started.current) return;
      started.current = true;
      setTimeout(() => setStartedAt((value) => value ?? Date.now()), 900);
    };
    document.addEventListener('exparte:workflow', onWorkflow);
    document.addEventListener('screen:change', onScreen);
    if (document.documentElement.dataset.activeScreen === 'exparte') onScreen(new CustomEvent('screen:change', { detail: { id: 'exparte' } }));
    return () => {
      document.removeEventListener('exparte:workflow', onWorkflow);
      document.removeEventListener('screen:change', onScreen);
    };
  }, []);

  const entity = view.kind === 'entity' ? view.ref : null;
  const railButton = (active: boolean) =>
    `flex h-10 w-full cursor-pointer items-center justify-center ${active ? 'bg-white/15 text-white' : 'text-white/75 hover:text-white'}`;

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl bg-xpp-page font-ubuntu text-[0.85rem] text-xpp-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]">
      <nav className="flex w-11 shrink-0 flex-col items-center bg-xpp-blue py-3 text-white" aria-label="Portal">
        <svg viewBox="0 0 33 20" className="mb-6 h-4 w-6" aria-hidden="true">
          <path fill="#fff" d="M32.77 0H16.384v4.128h16.384zM32.77 15.872H16.384V20h16.384zM32.77 7.923H0v4.128h32.77z" />
        </svg>
        <button type="button" aria-label="Patent intelligence" onClick={() => go(START.intelligence)} className={railButton(view.kind === 'entity')}>
          <Icon.grid className="size-4" />
        </button>
        <button type="button" aria-label="Advanced search" onClick={() => go(START.search)} className={railButton(view.kind === 'search')}>
          <Icon.search className="size-4" />
        </button>
        <span className="flex h-10 items-center text-white/75" aria-hidden="true">
          <Icon.bookmark className="size-4" />
        </span>
        <span className="mt-auto flex size-7 items-center justify-center rounded-full bg-white/20 text-[0.6rem] font-medium">RC</span>
        <Icon.sliders className="mt-3 size-4 text-white/75" />
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-xpp-line bg-white px-4 py-2.5">
          {history.length > 1 && (
            <button type="button" aria-label="Back" onClick={() => setHistory((all) => all.slice(0, -1))} className="cursor-pointer rounded p-1 text-xpp-text hover:bg-xpp-page">
              <Icon.back className="size-4" />
            </button>
          )}
          {entity ? (
            <>
              <span className="rounded bg-xpp-page p-1.5 text-xpp-text" aria-hidden="true">
                <Icon.bookmark className="size-3.5" />
              </span>
              {entity.kind === 'case' && <CourtBadge court={cases[entity.id].court} />}
              {entity.kind === 'case' && <span className="text-xpp-muted">{cases[entity.id].number}</span>}
              <h3 className="truncate text-[1.05rem] font-medium">{name(entity)}</h3>
              {entity.kind === 'patent' && <span className="truncate text-xpp-muted">{patents[entity.id].title}</span>}
              {KIND_LABEL[entity.kind] && <span className="text-xpp-muted">{KIND_LABEL[entity.kind]}</span>}
            </>
          ) : (
            <h3 className="text-[1.05rem] font-medium">Advanced Search</h3>
          )}
          <span className="ml-auto shrink-0">
            <Demo />
          </span>
        </header>

        {entity && hasAnalysis(entity) && (
          <div className="flex shrink-0 gap-2 border-b border-xpp-line bg-white px-6 text-[0.85rem]" role="tablist">
            {(['overview', 'analysis'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={view.kind === 'entity' && view.tab === tab}
                onClick={() => go({ kind: 'entity', ref: entity, tab })}
                className="cursor-pointer border-b-2 border-transparent px-4 py-2 text-xpp-text aria-selected:border-xpp-blue aria-selected:font-medium aria-selected:text-xpp-ink"
              >
                {tab === 'overview' ? 'Overview' : 'Analysis'}
              </button>
            ))}
          </div>
        )}

        <div className={workflow === 'intelligence' ? 'flex min-h-0 flex-1' : 'hidden'}>
          <Intelligence startedAt={startedAt} onGenerate={generate} onOpen={open} />
        </div>
        <div className={workflow === 'assistant' ? 'flex min-h-0 flex-1' : 'hidden'}>
          <CaseAnalysis onOpen={open} />
        </div>
        <div className={view.kind === 'search' ? 'flex min-h-0 flex-1' : 'hidden'}>
          <Search onOpen={open} />
        </div>
        {entity && view.kind === 'entity' && view.tab === 'overview' && <EntityPage key={`${entity.kind}:${entity.id}`} entity={entity} onOpen={open} />}
      </div>
    </div>
  );
}
