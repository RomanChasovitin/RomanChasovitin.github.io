import { Fragment, type ReactNode } from 'react';
import type { Court, Kind, Ref, Rating, Report, Review, Section, Trend } from './data';

// The pieces of the Ex Parte portal that every view uses: badges, cards, tables, links into the record,
// the report document and its critique.

export type Open = (ref: Ref, tab?: 'overview' | 'analysis') => void;

const COURT: Record<Court, string> = {
  DCT: 'bg-xpp-dct',
  PTAB: 'bg-xpp-ptab',
  CAFC: 'bg-xpp-cafc',
  ITC: 'bg-xpp-line',
};

export function CourtBadge({ court }: { court: Court }) {
  return <span className={`inline-block rounded px-2 py-0.5 text-[0.7rem] font-medium text-xpp-ink ${COURT[court]}`}>{court}</span>;
}

export function Demo() {
  return (
    <span className="rounded-full border border-xpp-line px-2.5 py-0.5 text-[0.7rem] font-medium text-xpp-text" title="Every name, number and date on this screen is made up">
      Demo data
    </span>
  );
}

export function TrendArrow({ trend }: { trend: Trend }) {
  const path = { up: 'M3 12 9 6l3 3 5-5m0 0h-4m4 0v4', down: 'M3 5l6 6 3-3 5 5m0 0h-4m4 0V9', flat: 'M3 9h13m0 0-4-4m4 4-4 4' }[trend];
  return (
    <svg viewBox="0 0 20 18" className="h-3.5 w-4 text-xpp-blue" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={`Trend ${trend}`}>
      <path d={path} />
    </svg>
  );
}

export function RatingCells({ rating }: { rating: Rating }) {
  return (
    <span className="inline-flex items-center gap-4 tabular-nums">
      <span>{rating.level}</span>
      <span>{rating.grade}</span>
      <TrendArrow trend={rating.trend} />
    </span>
  );
}

export function Card({ title, aside, children, className = '' }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-xpp-line bg-white ${className}`}>
      {title && (
        <header className="flex items-baseline gap-2 border-b border-xpp-line px-5 py-3">
          <h3 className="text-[0.95rem] font-medium text-xpp-ink">{title}</h3>
          {aside && <span className="text-[0.85rem] text-xpp-muted">{aside}</span>}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function Stats({ items, cols = 3 }: { items: [string, ReactNode][]; cols?: number }) {
  return (
    <dl className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[0.75rem] font-medium text-xpp-muted">{label}</dt>
          <dd className="mt-1 text-xpp-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Table({ head, rows, onRow }: { head: string[]; rows: ReactNode[][]; onRow?: (index: number) => void }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="bg-xpp-line/70 text-[0.75rem] text-xpp-muted">
          {head.map((cell) => (
            <th key={cell} className="px-3 py-2 font-medium first:pl-5">
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={index}
            onClick={onRow && (() => onRow(index))}
            className={`border-b border-xpp-line last:border-0 ${onRow ? 'cursor-pointer hover:bg-xpp-soft/60' : ''}`}
          >
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="px-3 py-2.5 text-xpp-ink first:pl-5">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A share of cases or a win rate, on a light track; `loss` tints the track red, as the portal does for win rates. */
export function Bar({ value, loss = false }: { value: number; loss?: boolean }) {
  return (
    <span className={`block h-1.5 w-24 overflow-hidden rounded-full ${loss ? 'bg-xpp-loss' : 'bg-xpp-page'}`}>
      <span className="block h-full rounded-full bg-xpp-blue" style={{ width: `${value}%` }} />
    </span>
  );
}

export function EntityLink({ to, onOpen, children }: { to: Ref; onOpen: Open; children: ReactNode }) {
  return (
    <button type="button" onClick={() => onOpen(to)} className="cursor-pointer text-left text-xpp-blue hover:underline">
      {children}
    </button>
  );
}

const TOKENS = /(\[\[\w+:[\w-]+\|[^\]]+\]\]|\[\d+\])/;

/** Text with [[kind:id|Label]] links into the record and [n] citations of context items. */
export function Rich({ text, onOpen, onCite }: { text: string; onOpen: Open; onCite?: (index: number | null) => void }) {
  return (
    <>
      {text.split(TOKENS).map((part, index) => {
        const link = part.match(/^\[\[(\w+):([\w-]+)\|([^\]]+)\]\]$/);
        if (link) {
          return (
            <EntityLink key={index} to={{ kind: link[1] as Kind, id: link[2] }} onOpen={onOpen}>
              {link[3]}
            </EntityLink>
          );
        }
        const cite = part.match(/^\[(\d+)\]$/);
        if (cite) {
          const number = Number(cite[1]);
          return (
            <sup
              key={index}
              onMouseEnter={() => onCite?.(number)}
              onMouseLeave={() => onCite?.(null)}
              className="mx-0.5 cursor-default rounded bg-xpp-soft px-1 text-[0.7em] font-medium text-xpp-blue"
            >
              {number}
            </sup>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 146 20" className={className} role="img" aria-label="Ex Parte">
      <path
        fill="currentColor"
        d="M65.36 0c5.538 0 7.718 2.718 7.718 6.692s-2.18 6.667-7.718 6.667h-3.693v6.615H57.54V0zm-3.693 3.846v5.692h3.693c2.718 0 3.59-.948 3.59-2.82s-.898-2.872-3.59-2.872zM86.487 16.051h-8.154L76.846 20H72.64l7.666-20h4.205l7.667 20h-4.205zm-6.718-3.846h5.282l-2.641-7zM106.257 12.282 111.359 20h-4.743l-4.744-7.23h-2.795V20H94.95V0h7.821c5.538 0 7.718 2.564 7.718 6.385 0 2.564-1.257 4.897-4.257 5.871zm-7.18-8.436v5.077h3.693c2.718 0 3.589-1.026 3.589-2.513 0-1.666-.897-2.564-3.589-2.564zM112.41 0h15.949v3.846h-5.898V20h-4.153V3.846h-5.898zM135.462 16.154h10.18V20h-14.308V0h14.308v3.846h-10.18v4h10.18v3.846h-10.18z"
      />
      <path fill="#2860f6" d="M32.77 0H16.384v4.128h16.384zM32.77 15.872H16.384V20h16.384zM32.77 7.923H0v4.128h32.77zM54.23 19.974h-4.923l-4.179-6.435-4.18 6.435h-4.923L42.666 9.77 36.333 0h4.923l3.872 5.974L49.025 0h4.924l-6.36 9.77z" />
    </svg>
  );
}

function Blocks({ section, onOpen }: { section: Section; onOpen: Open }) {
  return (
    <>
      {section.blocks.map((block, index) => {
        if (block.kind === 'table') {
          return (
            <div key={index} className="mt-4 overflow-hidden rounded border border-xpp-line text-[0.85em]">
              <Table head={block.head} rows={block.rows.map((row) => row.map((cell) => <Rich text={cell} onOpen={onOpen} />))} />
            </div>
          );
        }
        if (block.kind === 'fields') {
          return (
            <div key={index} className="mt-3">
              <p className="flex gap-3 font-medium text-xpp-ink">
                <span className="mt-[0.55em] size-1.5 shrink-0 bg-xpp-ink" />
                {block.label}:
              </p>
              <ul className="mt-1.5 flex flex-col gap-1.5 pl-9">
                {block.rows.map(([label, value]) => (
                  <li key={label} className="flex gap-3">
                    <span className="mt-[0.6em] size-1 shrink-0 bg-xpp-muted" />
                    <span>
                      <b className="font-medium text-xpp-ink">{label}:</b> <Rich text={value} onOpen={onOpen} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        return (
          <p key={index} className="mt-3 flex gap-3 text-justify">
            <span className="mt-[0.55em] size-1.5 shrink-0 bg-xpp-ink" />
            <span>
              {block.label && <b className="font-medium text-xpp-ink">{block.label}: </b>}
              <Rich text={block.text} onOpen={onOpen} />
            </span>
          </p>
        );
      })}
    </>
  );
}

/**
 * A report as the portal prints it: a white page on grey. `shown` limits it to the sections written so
 * far, while the report is drafted; the last of them gets a cursor.
 */
export function Doc({ report, onOpen, zoom = 1, shown, highlight }: { report: Report; onOpen: Open; zoom?: number; shown?: number; highlight?: string | null }) {
  const sections = shown === undefined ? report.sections : report.sections.slice(0, shown);
  return (
    <article className="mx-auto max-w-[44rem] rounded-lg bg-white px-[8%] py-10 leading-relaxed text-xpp-text shadow-[0_1px_3px_rgb(0_0_0/0.06)]" style={{ fontSize: `${0.88 * zoom}rem` }}>
      <header className="flex items-center justify-between">
        <Wordmark className="h-3.5 w-auto text-xpp-ink" />
        <span className="text-[0.75em] tracking-wide text-xpp-ink uppercase">{report.title}</span>
      </header>
      {sections.map((section, index) => (
        <section key={section.id} id={`doc-${report.id}-${section.id}`} className={`mt-8 scroll-mt-4 rounded transition-colors duration-500 ${highlight === section.id ? 'bg-xpp-soft/70' : ''}`}>
          <h2 className="text-[1.35em] font-medium text-xpp-ink">{section.heading}</h2>
          <Blocks section={section} onOpen={onOpen} />
          {shown !== undefined && index === sections.length - 1 && <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-xpp-blue align-middle" />}
        </section>
      ))}
    </article>
  );
}

export function Verdict({ verdict }: { verdict: Review['verdict'] }) {
  return verdict === 'approve' ? (
    <span className="rounded bg-xpp-cafc px-1.5 py-0.5 text-[0.7rem] font-medium text-[#1f5b43]">Approved</span>
  ) : (
    <span className="rounded bg-xpp-dct px-1.5 py-0.5 text-[0.7rem] font-medium text-[#6b5a0c]">Changes requested</span>
  );
}

/** What the reviewers panel said about a report, and what each change request led to. */
export function Critique({ report, onSection }: { report: Report; onSection?: (section: string) => void }) {
  const heading = (id?: string) => report.sections.find((section) => section.id === id)?.heading;
  const changes = report.reviews.filter((review) => review.verdict === 'changes').length;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.8rem] text-xpp-text">
        {report.reviews.length} reviewers · {changes ? `${changes} change ${changes === 1 ? 'request' : 'requests'}, resolved` : 'approved as drafted'}
      </p>
      {report.reviews.map((review) => (
        <div key={review.reviewer} className="rounded-lg border border-xpp-line bg-white p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p>
              <b className="font-medium text-xpp-ink">{review.reviewer}</b>
              <span className="ml-2 text-[0.75rem] text-xpp-muted">{review.focus}</span>
            </p>
            <Verdict verdict={review.verdict} />
          </div>
          {review.section && (
            <button type="button" onClick={() => onSection?.(review.section!)} className="mt-1 cursor-pointer text-[0.75rem] text-xpp-blue hover:underline">
              {heading(review.section)}
            </button>
          )}
          <p className="mt-1.5 text-[0.85rem] text-xpp-text">{review.comment}</p>
          {review.resolution && (
            <p className="mt-2 flex gap-1.5 text-[0.8rem] text-[#1f5b43]">
              <Icon.check className="mt-0.5 size-3.5 shrink-0" />
              {review.resolution}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

type IconProps = { className?: string };
const stroke = (d: string) =>
  function StrokeIcon({ className = 'size-4' }: IconProps) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
    );
  };

export const Icon = {
  grid: stroke('M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z'),
  search: stroke('M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM21 21l-5.2-5.2'),
  bookmark: stroke('M6 3h12v18l-6-4.5L6 21z'),
  sliders: stroke('M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6'),
  doc: stroke('M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h6'),
  target: stroke('M12 21a9 9 0 1 0-9-9M12 16a4 4 0 1 0-4-4M12 12l9-9M17 3h4v4'),
  toc: stroke('M4 6h2M4 12h2M4 18h2M9 6h11M9 12h11M9 18h11'),
  expand: stroke('M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5'),
  minus: stroke('M5 12h14'),
  plus: stroke('M12 5v14M5 12h14'),
  link: stroke('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'),
  word: stroke('M14 3H6v18h12V7zM14 3v4h4M8.5 11l1.5 6 2-4.5 2 4.5 1.5-6'),
  pdf: stroke('M14 3H6v18h12V7zM14 3v4h4M8 17v-5h1.5a1.5 1.5 0 0 1 0 3H8M13 12v5M13 12h2.5M13 14.5h2'),
  chat: stroke('M4 5h11v8H8l-4 3zM9 16v2h7l4 3v-8h-3'),
  clip: stroke('M20 11.5 12.5 19a5 5 0 0 1-7-7L13 4.5a3.3 3.3 0 0 1 4.7 4.7L10.2 16.7a1.7 1.7 0 0 1-2.4-2.4l7-7'),
  send: stroke('M4 12 20 4l-6 16-3-7z M11 13l9-9'),
  check: stroke('M5 12.5 10 17l9-10'),
  flag: stroke('M5 21V4M5 4h11l-2 4 2 4H5'),
  back: stroke('M15 5l-7 7 7 7'),
  chevron: stroke('M6 9l6 6 6-6'),
  sparkle: stroke('M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8'),
};

export function Spinner({ className = 'size-3.5' }: IconProps) {
  return <span className={`inline-block shrink-0 animate-spin rounded-full border-2 border-xpp-blue/25 border-t-xpp-blue ${className}`} aria-hidden="true" />;
}
