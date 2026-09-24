import { useEffect, useRef, useState, type ReactNode } from 'react';
import Window from '../../components/Window';
import CaseAnalysis from './Assistant';
import { cases, MAIN_CASE, MAIN_PATENT, name, patents, type Ref } from './data';
import Intelligence from './Intelligence';
import { EntityPage, Search, type Workflow } from './Search';
import { CourtBadge, Demo, Icon, type Open } from './ui';

// The Ex Parte portal in a browser window. Its three tabs are the three workflows: patent intelligence on
// the Analysis tab of the patent, search with every entity page, and the assistant on the Analysis tab of
// the case. Each tab keeps its own history, as a browser does, and the icons of the blue rail switch
// between them.
//
// The three workflows stay mounted while hidden, so a report in progress, the search filters and the chat
// all survive a trip to another page.

type View = { kind: 'search' } | { kind: 'entity'; ref: Ref; tab: 'overview' | 'analysis' };

const START: Record<Workflow, View> = {
  intelligence: { kind: 'entity', ref: { kind: 'patent', id: MAIN_PATENT }, tab: 'analysis' },
  search: { kind: 'search' },
  assistant: { kind: 'entity', ref: { kind: 'case', id: MAIN_CASE }, tab: 'analysis' },
};

const WORKFLOWS: { id: Workflow; label: string; icon: (className: string) => ReactNode }[] = [
  { id: 'intelligence', label: 'Patent intelligence', icon: (className) => <Icon.grid className={className} /> },
  { id: 'search', label: 'Advanced search', icon: (className) => <Icon.search className={className} /> },
  { id: 'assistant', label: 'Assistant', icon: (className) => <Icon.chat className={className} /> },
];

const hasAnalysis = (ref: Ref) => (ref.kind === 'patent' && ref.id === MAIN_PATENT) || (ref.kind === 'case' && ref.id === MAIN_CASE);

/** What a view shows: one of the three workflows, or an entity page. */
function shows(view: View): Workflow | 'entity' {
  if (view.kind === 'search') return 'search';
  if (view.tab === 'analysis') return view.ref.kind === 'patent' ? 'intelligence' : 'assistant';
  return 'entity';
}

const KIND_LABEL: Record<Ref['kind'], string> = {
  case: '',
  patent: '',
  party: 'Party',
  firm: 'Law Firm',
  attorney: 'Attorney',
  judge: 'Judge',
  expert: 'Expert',
  engineer: 'Engineer',
};

const short = (ref: Ref) => (ref.kind === 'case' ? cases[ref.id].number : name(ref));

function title(view: View) {
  if (view.kind === 'search') return 'Advanced Search';
  if (view.tab === 'analysis') return `${short(view.ref)} · ${view.ref.kind === 'case' ? 'Assistant' : 'Analysis'}`;
  return short(view.ref);
}

function path(view: View) {
  if (view.kind === 'search') return '/search/experts';
  return `/${view.ref.kind}/${view.ref.id}${view.tab === 'analysis' ? '/analysis' : ''}`;
}

export default function Portal() {
  const [tabs, setTabs] = useState<Record<Workflow, View[]>>({
    intelligence: [START.intelligence],
    search: [START.search],
    assistant: [START.assistant],
  });
  const [current, setCurrent] = useState<Workflow>('intelligence');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const started = useRef(false);
  const history = tabs[current];
  const view = history.at(-1)!;
  const showing = shows(view);

  function go(next: View) {
    setTabs((all) => {
      const list = all[current];
      return JSON.stringify(list.at(-1)) === JSON.stringify(next) ? all : { ...all, [current]: [...list, next] };
    });
  }

  const back = () => setTabs((all) => ({ ...all, [current]: all[current].slice(0, -1) }));
  const open: Open = (ref, tab) => go({ kind: 'entity', ref, tab: tab ?? 'overview' });

  function generate() {
    started.current = true;
    setStartedAt(Date.now());
  }

  // The first time the screen opens, the reports start on their own: the pipeline is the point of it.
  useEffect(() => {
    const onScreen = (event: Event) => {
      if ((event as CustomEvent<{ id: string }>).detail.id !== 'exparte' || started.current) return;
      started.current = true;
      setTimeout(() => setStartedAt((value) => value ?? Date.now()), 900);
    };
    document.addEventListener('screen:change', onScreen);
    if (document.documentElement.dataset.activeScreen === 'exparte') onScreen(new CustomEvent('screen:change', { detail: { id: 'exparte' } }));
    return () => document.removeEventListener('screen:change', onScreen);
  }, []);

  const entity = view.kind === 'entity' ? view.ref : null;
  const railButton = (active: boolean) =>
    `flex h-10 w-full cursor-pointer items-center justify-center ${active ? 'bg-white/15 text-white' : 'text-white/75 hover:text-white'}`;

  return (
    <Window
      tabs={WORKFLOWS.map((workflow) => ({ id: workflow.id, label: title(tabs[workflow.id].at(-1)!), icon: workflow.icon('text-xpp-blue') }))}
      active={current}
      onTab={(id) => setCurrent(id as Workflow)}
      url={`portal.exparte.com${path(view)}`}
    >
      <div className="flex min-h-0 flex-1 bg-xpp-page font-ubuntu text-[0.85rem] text-xpp-ink">
        <nav className="flex w-11 shrink-0 flex-col items-center bg-xpp-blue py-3 text-white" aria-label="Portal">
          <svg viewBox="0 0 33 20" className="mb-6 h-4 w-6" aria-hidden="true">
            <path fill="#fff" d="M32.77 0H16.384v4.128h16.384zM32.77 15.872H16.384V20h16.384zM32.77 7.923H0v4.128h32.77z" />
          </svg>
          {WORKFLOWS.map((workflow) => (
            <button key={workflow.id} type="button" aria-label={workflow.label} aria-pressed={current === workflow.id} onClick={() => setCurrent(workflow.id)} className={railButton(current === workflow.id)}>
              {workflow.icon('size-4')}
            </button>
          ))}
          <button
            type="button"
            aria-label="My profile"
            onClick={() => open({ kind: 'engineer', id: 'roman' })}
            className="mt-auto flex size-7 cursor-pointer items-center justify-center rounded-full bg-white/20 text-[0.6rem] font-medium hover:bg-white/35"
          >
            RC
          </button>
          <Icon.sliders className="mt-3 size-4 text-white/75" />
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center gap-3 border-b border-xpp-line bg-white px-4 py-2.5">
            {history.length > 1 && (
              <button type="button" aria-label="Back" onClick={back} className="cursor-pointer rounded p-1 text-xpp-text hover:bg-xpp-page">
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

          <div className={showing === 'intelligence' ? 'flex min-h-0 min-w-0 flex-1' : 'hidden'}>
            <Intelligence startedAt={startedAt} onGenerate={generate} onOpen={open} />
          </div>
          <div className={showing === 'assistant' ? 'flex min-h-0 min-w-0 flex-1' : 'hidden'}>
            <CaseAnalysis onOpen={open} />
          </div>
          <div className={showing === 'search' ? 'flex min-h-0 min-w-0 flex-1' : 'hidden'}>
            <Search onOpen={open} />
          </div>
          {entity && showing === 'entity' && <EntityPage key={`${entity.kind}:${entity.id}`} entity={entity} onOpen={open} onWorkflow={setCurrent} />}
        </div>
      </div>
    </Window>
  );
}
