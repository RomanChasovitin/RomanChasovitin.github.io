import { useEffect, useRef, useState } from 'react';
import { reports, type Report } from './data';
import { Critique, Doc, Icon, Spinner, Verdict, type Open } from './ui';

// Patent intelligence: three AI reports on one patent, written at the same time. Each one is drafted,
// then triage checks every section and sends the doubtful ones to a panel of reviewers; a change request
// sends the section back for a revision. Progress comes from the start time alone, so leaving the view and
// coming back finds the reports where they would be.

type Stage = 'draft' | 'triage' | 'review' | 'revise' | 'ready';

const STAGES: { id: Stage; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'triage', label: 'Triage' },
  { id: 'review', label: 'Reviewers' },
  { id: 'ready', label: 'Ready' },
];

function stageOf(report: Report, elapsed: number): { stage: Stage; progress: number } {
  const { draft, triage, review, revise } = report.timing;
  const ends: [Stage, number, number][] = [
    ['draft', draft, 0],
    ['triage', draft + triage, draft],
    ['review', draft + triage + review, draft + triage],
    ['revise', draft + triage + review + revise, draft + triage + review],
  ];
  for (const [stage, end, start] of ends) {
    if (elapsed < end) return { stage, progress: (elapsed - start) / (end - start) };
  }
  return { stage: 'ready', progress: 1 };
}

const count = (progress: number, total: number) => Math.min(total, Math.ceil(progress * total));

type Props = { startedAt: number | null; onGenerate: () => void; onOpen: Open };

export default function Intelligence({ startedAt, onGenerate, onOpen }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [active, setActive] = useState(reports[0].id);
  const [mode, setMode] = useState<'report' | 'critique'>('report');
  const [zoom, setZoom] = useState(1);
  const [toc, setToc] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const area = useRef<HTMLDivElement>(null);

  // The clock catches up with a new start one render late, so the first render of a run counts from zero.
  const elapsed = startedAt === null ? -1 : Math.max(0, now - startedAt);
  const state = (report: Report) => (elapsed < 0 ? null : stageOf(report, elapsed));
  const running = elapsed >= 0 && reports.some((report) => state(report)!.stage !== 'ready');

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(timer);
  }, [running]);

  // The clock stands still between runs; a new run starts from the time of the click.
  useEffect(() => {
    setNow(Date.now());
  }, [startedAt]);

  const report = reports.find((item) => item.id === active)!;
  const current = state(report);

  function openSection(reportId: string, section: string) {
    setActive(reportId);
    setMode('report');
    setToc(false);
    setHighlight(section);
    setTimeout(() => document.getElementById(`doc-${reportId}-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    setTimeout(() => setHighlight(null), 1600);
  }

  const shownItems = (item: Report) => item.items.filter(([label]) => label.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-3 p-3 @max-lg/window:p-2">
      {/* Context; a narrow window leaves it out, the table of contents does its job there */}
      <aside className="@max-lg/window:hidden flex w-52 shrink-0 flex-col overflow-hidden rounded-lg border border-xpp-line bg-white">
        <p className="px-4 pt-3.5 pb-2 text-[0.95rem] font-medium text-xpp-ink">Context</p>
        <label className="mx-3 mb-2 flex items-center gap-2 border-b border-xpp-line pb-2 text-xpp-muted">
          <Icon.search className="size-3.5" />
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Find patent documents..." className="min-w-0 flex-1 bg-transparent text-[0.8rem] text-xpp-ink outline-none placeholder:text-xpp-muted" />
        </label>
        <div className="min-h-0 flex-1 overflow-y-auto text-[0.8rem]">
          <p className="bg-xpp-line/70 px-4 py-1.5 text-[0.7rem] font-medium tracking-wide text-xpp-muted">INTELLIGENCE</p>
          {startedAt === null && <p className="px-4 py-3 text-xpp-muted">Not generated yet</p>}
          {startedAt !== null &&
            reports.map((item) => {
              const ready = state(item)!.stage === 'ready';
              return (
                <div key={item.id} className="py-1">
                  <button type="button" onClick={() => setActive(item.id)} className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 font-medium text-xpp-ink">
                    <Icon.chevron className="size-3.5 text-xpp-muted" />
                    {item.tab}
                    {!ready && <Spinner className="ml-auto size-3" />}
                  </button>
                  {shownItems(item).map(([label, section], index) => (
                    <button
                      key={label}
                      type="button"
                      disabled={!ready}
                      onClick={() => openSection(item.id, section)}
                      className="flex w-full cursor-pointer items-center gap-2 py-1.5 pr-3 pl-8 text-left text-xpp-ink hover:bg-xpp-soft disabled:cursor-default disabled:text-xpp-muted disabled:hover:bg-transparent"
                    >
                      {index === item.items.length - 1 ? <Icon.target className="size-3.5 text-xpp-blue" /> : <Icon.doc className="size-3.5 text-xpp-blue" />}
                      {label}
                    </button>
                  ))}
                </div>
              );
            })}
          <p className="mt-1 bg-xpp-line/70 px-4 py-1.5 text-[0.7rem] font-medium tracking-wide text-xpp-muted">PATENTS</p>
          <button type="button" onClick={() => onOpen({ kind: 'patent', id: 'crosstalk' }, 'overview')} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-xpp-ink hover:bg-xpp-soft">
            <Icon.doc className="size-3.5 text-xpp-blue" />
            US 13,104,287 B2
          </button>
        </div>
      </aside>

      {/* Reports */}
      <div className="@container flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-xpp-line bg-white">
        {startedAt !== null && (
          <div className="flex shrink-0 border-b border-xpp-line text-[0.8rem] @max-md:overflow-x-auto" role="tablist">
            {reports.map((item) => {
              const itemState = state(item)!;
              const selected = item.id === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(item.id)}
                  className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-r border-b-2 border-r-xpp-line px-3 py-2.5 text-left @max-md:flex-none @max-md:gap-1.5 @max-md:px-2.5 ${selected ? 'border-b-xpp-blue text-xpp-ink' : 'border-b-transparent text-xpp-text'}`}
                >
                  <Icon.sparkle className="size-3.5 shrink-0 text-xpp-blue" />
                  <span className="truncate">{item.tab}</span>
                  <span className="ml-auto shrink-0 text-[0.7rem] text-xpp-muted">
                    {itemState.stage === 'ready' ? <Icon.check className="size-3.5 text-[#1f8a5b]" /> : STAGES.find((stage) => stage.id === (itemState.stage === 'revise' ? 'review' : itemState.stage))!.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Toolbar */}
        <div className="relative flex shrink-0 items-center gap-1.5 border-b border-xpp-line px-2.5 py-1.5 text-[0.8rem] text-xpp-ink">
          <button type="button" disabled={current?.stage !== 'ready'} onClick={() => setToc((value) => !value)} className="flex cursor-pointer items-center gap-1.5 rounded bg-xpp-line/70 px-2.5 py-1 font-medium disabled:cursor-default disabled:opacity-50">
            <Icon.toc className="size-3.5" /> <span className="@max-md:hidden">Table of Contents</span>
          </button>
          {toc && (
            <div className="absolute top-full left-2.5 z-10 mt-1 w-64 max-w-[calc(100%-1.25rem)] rounded-lg border border-xpp-line bg-white p-1.5 shadow-lg">
              {report.sections.map((section) => (
                <button key={section.id} type="button" onClick={() => openSection(report.id, section.id)} className="block w-full cursor-pointer rounded px-2.5 py-1.5 text-left hover:bg-xpp-soft">
                  {section.heading}
                </button>
              ))}
            </div>
          )}
          <span className="mx-1 h-5 w-px bg-xpp-line @max-md:hidden" />
          <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.8, value - 0.1))} className="cursor-pointer rounded border border-xpp-line p-1 @max-md:hidden">
            <Icon.minus className="size-3.5" />
          </button>
          <span className="w-12 rounded border border-xpp-line py-0.5 text-center tabular-nums @max-md:hidden">{zoom === 1 ? 'Auto' : `${Math.round(zoom * 100)}%`}</span>
          <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.3, value + 0.1))} className="cursor-pointer rounded border border-xpp-line p-1 @max-md:hidden">
            <Icon.plus className="size-3.5" />
          </button>
          <span className="mx-1 hidden h-5 w-px bg-xpp-line @xl:block" />
          <span className="hidden gap-1 text-xpp-text @xl:flex" aria-hidden="true">
            <Icon.link className="size-7 rounded border border-xpp-line p-1.5" />
            <Icon.word className="size-7 rounded border border-xpp-line p-1.5" />
            <Icon.pdf className="size-7 rounded border border-xpp-line p-1.5" />
          </span>
          <button type="button" onClick={() => onOpen({ kind: 'engineer', id: 'roman' })} className="ml-auto flex cursor-pointer items-center gap-2 text-[0.75rem] text-xpp-text hover:text-xpp-ink">
            <span className="hidden @2xl:inline">Requested by</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-xpp-soft text-[0.65rem] font-medium text-xpp-blue">RC</span>
          </button>
          <span className="ml-2 flex shrink-0 rounded-md bg-xpp-line/70 p-0.5">
            {(['report', 'critique'] as const).map((value) => (
              <button
                key={value}
                type="button"
                disabled={current?.stage !== 'ready'}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className="cursor-pointer rounded px-3 py-1 font-medium text-xpp-ink @max-md:px-2 disabled:cursor-default disabled:opacity-50 aria-pressed:bg-white aria-pressed:text-xpp-blue"
              >
                {value === 'report' ? 'Report' : 'Critique™'}
              </button>
            ))}
          </span>
        </div>

        {/* The page */}
        <div ref={area} className="min-h-0 flex-1 overflow-y-auto bg-xpp-line/70 p-5 @max-md:p-2">
          {startedAt === null || !current ? (
            <div className="mx-auto mt-[10%] flex max-w-sm flex-col items-center text-center">
              <Icon.sparkle className="size-9 text-xpp-blue" />
              <p className="mt-3 text-[1.1rem] font-medium text-xpp-ink">No intelligence for this patent yet</p>
              <p className="mt-1.5 text-[0.85rem] text-xpp-text">Three reports: prosecution history, examiner search and an invalidity framework. Each one passes triage and a panel of reviewers.</p>
              <button type="button" onClick={onGenerate} className="mt-5 cursor-pointer rounded-md bg-xpp-blue px-5 py-2 font-medium text-white hover:bg-[#1d4fd8]">
                Generate intelligence
              </button>
            </div>
          ) : current.stage === 'ready' ? (
            mode === 'report' ? (
              <Doc report={report} onOpen={onOpen} zoom={zoom} highlight={highlight} />
            ) : (
              <div className="mx-auto max-w-[40rem]">
                <Critique report={report} onSection={(section) => openSection(report.id, section)} />
              </div>
            )
          ) : (
            <Run report={report} stage={current.stage} progress={current.progress} onOpen={onOpen} />
          )}
        </div>
      </div>
    </div>
  );
}

function Run({ report, stage, progress, onOpen }: { report: Report; stage: Stage; progress: number; onOpen: Open }) {
  const reached = STAGES.findIndex((item) => item.id === (stage === 'revise' ? 'review' : stage));
  const heading = (id?: string) => report.sections.find((section) => section.id === id)?.heading;
  const sentToReview = report.triage.filter((check) => check.verdict === 'review').length;
  return (
    <div className="mx-auto max-w-[44rem]">
      <ol className="mb-4 flex flex-wrap items-center gap-2 text-[0.8rem]">
        {STAGES.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${index < reached ? 'bg-xpp-cafc text-[#1f5b43]' : index === reached ? 'bg-xpp-blue text-white' : 'bg-white text-xpp-muted'}`}
            >
              {index < reached && <Icon.check className="size-3" />}
              {index === reached && <Spinner className="size-3 border-white/30 border-t-white" />}
              {item.label}
            </span>
            {index < STAGES.length - 1 && <span className="h-px w-6 bg-xpp-muted/50 @max-md:w-2" />}
          </li>
        ))}
      </ol>

      {stage === 'draft' && <Doc report={report} onOpen={onOpen} shown={count(progress, report.sections.length)} />}

      {stage !== 'draft' && (
        <div className="rounded-lg bg-white p-4">
          <p className="text-[0.85rem] font-medium text-xpp-ink">
            Triage
            {stage !== 'triage' && <span className="ml-2 font-normal text-xpp-text">{report.triage.length - sentToReview} passed, {sentToReview} sent to reviewers</span>}
          </p>
          <ul className="mt-2 flex flex-col gap-2 text-[0.8rem]">
            {report.triage.slice(0, stage === 'triage' ? count(progress, report.triage.length) : undefined).map((check) => (
              <li key={check.section} className="flex gap-2.5">
                {check.verdict === 'pass' ? <Icon.check className="mt-0.5 size-3.5 shrink-0 text-[#1f8a5b]" /> : <Icon.flag className="mt-0.5 size-3.5 shrink-0 text-[#b7791f]" />}
                <span>
                  <b className="font-medium text-xpp-ink">{heading(check.section)}</b>
                  <span className="ml-2 text-xpp-text">{check.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(stage === 'review' || stage === 'revise') && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-[0.85rem] font-medium text-xpp-ink">Reviewers panel</p>
          {report.reviews.slice(0, stage === 'review' ? count(progress, report.reviews.length) : undefined).map((review) => (
            <div key={review.reviewer} className="rounded-lg bg-white p-3.5 text-[0.8rem]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-[10rem] flex-1">
                  <b className="font-medium text-xpp-ink">{review.reviewer}</b>
                  <span className="ml-2 text-xpp-muted">{review.focus}</span>
                </p>
                <Verdict verdict={review.verdict} />
              </div>
              <p className="mt-1 text-xpp-text">{review.comment}</p>
              {stage === 'revise' && review.verdict === 'changes' && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xpp-blue">
                  <Spinner className="size-3" /> Revising {heading(review.section)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
