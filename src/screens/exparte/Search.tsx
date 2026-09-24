import { useRef, useState, type ReactNode } from 'react';
import {
  attorneys,
  cases,
  casesOf,
  experts,
  firms,
  judges,
  MAIN_PATENT,
  parties,
  patents,
  type Case,
  type Ref,
} from './data';
import { Bar, Card, CourtBadge, EntityLink, RatingCells, Stats, Table, type Open } from './ui';

// Search: the advanced search of the portal, and a page for every kind of entity in the record. Every name
// on a page links to its own page, so a visitor can walk from a case to its judge, from a firm to the
// experts it hires, and back.

export type SearchTab = 'case' | 'patent' | 'attorney' | 'expert';

type Field = { key: string; label: string; placeholder: string };
type Row = { ref: Ref; cells: ReactNode[]; haystack: Record<string, string> };

const firmOf = (id: string) => firms[id].name;
const partyOf = (id: string) => parties[id].name;

function rows(tab: SearchTab): Row[] {
  switch (tab) {
    case 'expert':
      return Object.entries(experts).map(([id, expert]) => ({
        ref: { kind: 'expert', id },
        cells: [expert.name, expert.focus, expert.cases, `${expert.challenger}%`, `${expert.challenges.challenged} / ${expert.challenges.excluded}`],
        haystack: {
          name: expert.name,
          focus: [expert.focus, ...expert.tags].join(' '),
          party: [...expert.onBehalf, ...expert.against].map((entry) => partyOf(entry.party)).join(' '),
          firm: Object.values(firms)
            .filter((firm) => firm.experts.some((entry) => entry.expert === id))
            .map((firm) => firm.name)
            .join(' '),
        },
      }));
    case 'case':
      return Object.entries(cases).map(([id, item]) => ({
        ref: { kind: 'case', id },
        cells: [<CourtBadge court={item.court} />, item.number, item.jurisdiction, item.caption, <span className="text-xpp-muted">{item.filed}</span>, item.status, <span className="text-xpp-muted">{item.keyEvent}</span>],
        haystack: {
          number: item.number,
          caption: item.caption,
          jurisdiction: item.jurisdiction,
          party: [item.plaintiff.party, item.defendant.party].map(partyOf).join(' '),
          firm: [item.plaintiff.firm, item.defendant.firm].map(firmOf).join(' '),
          judge: [item.judge, item.magistrate].filter(Boolean).map((judge) => judges[judge!].name).join(' '),
        },
      }));
    case 'patent':
      return Object.entries(patents).map(([id, patent]) => ({
        ref: { kind: 'patent', id },
        cells: [patent.number, patent.title, partyOf(patent.assignee), patent.artUnit.split(' ')[0], <span className="text-xpp-muted">{patent.expires}</span>],
        haystack: { number: patent.number, title: patent.title, assignee: partyOf(patent.assignee), examiner: patent.examiner },
      }));
    case 'attorney':
      return Object.entries(attorneys).map(([id, attorney]) => ({
        ref: { kind: 'attorney', id },
        cells: [attorney.name, firmOf(attorney.firm), attorney.cases, <RatingCells rating={attorney.rating} />],
        haystack: { name: attorney.name, firm: firmOf(attorney.firm), court: attorney.courts.join(' ') },
      }));
  }
}

const TABS: Record<SearchTab, { label: string; head: string[]; groups: [string, Field[]][] }> = {
  case: {
    label: 'Case',
    head: ['Type', 'Case #', 'Jurisdiction', 'Caption', 'Filed', 'Status', 'Recent Key Event'],
    groups: [
      ['CASE & COURT', [
        { key: 'number', label: 'Case #', placeholder: 'e.g. 2:26-cv-04817' },
        { key: 'caption', label: 'Caption', placeholder: 'e.g. Northwind v. Kestrel' },
        { key: 'jurisdiction', label: 'Jurisdiction', placeholder: 'e.g. E.D. Texas, PTAB' },
      ]],
      ['PARTIES & COUNSEL', [
        { key: 'party', label: 'Party', placeholder: 'e.g. Orbis Mobile' },
        { key: 'firm', label: 'Law Firm', placeholder: 'e.g. Halvorsen & Pike' },
        { key: 'judge', label: 'Judge', placeholder: 'e.g. Margaret A. Thorne' },
      ]],
    ],
  },
  patent: {
    label: 'Patent',
    head: ['Patent #', 'Title', 'Assignee', 'Art Unit', 'Expiration'],
    groups: [
      ['PATENT', [
        { key: 'number', label: 'Patent', placeholder: 'e.g. US 13,104,287' },
        { key: 'title', label: 'Title', placeholder: 'e.g. crosstalk' },
      ]],
      ['PROSECUTION', [
        { key: 'assignee', label: 'Assignee', placeholder: 'e.g. Northwind Acoustics' },
        { key: 'examiner', label: 'Examiner', placeholder: 'e.g. Alan Whitcombe' },
      ]],
    ],
  },
  attorney: {
    label: 'Attorney',
    head: ['Name', 'Law Firm', 'Cases', 'Rating'],
    groups: [
      ['ATTORNEY', [
        { key: 'name', label: 'Name', placeholder: 'e.g. Sarah J. Bellamy' },
        { key: 'firm', label: 'Law Firm', placeholder: 'e.g. Crane Whitfield' },
      ]],
      ['EXPERIENCE', [{ key: 'court', label: 'Court', placeholder: 'e.g. PTAB, E.D. Texas' }]],
    ],
  },
  expert: {
    label: 'Expert',
    head: ['Name', 'Technical Focus', 'Cases', 'Challenger', 'Challenged / Excluded'],
    groups: [
      ['EXPERT', [
        { key: 'name', label: 'Name', placeholder: 'e.g. Elena Varga' },
        { key: 'focus', label: 'Technical Focus', placeholder: 'e.g. Bluetooth, acoustics' },
      ]],
      ['APPEARANCES', [
        { key: 'party', label: 'Party', placeholder: 'e.g. Kestrel Devices' },
        { key: 'firm', label: 'Law Firm', placeholder: 'e.g. Crane Whitfield' },
      ]],
    ],
  },
};

export function Search({ onOpen }: { onOpen: Open }) {
  const [tab, setTab] = useState<SearchTab>('expert');
  const [values, setValues] = useState<Record<string, string>>({});
  const results = useRef<HTMLDivElement>(null);
  const config = TABS[tab];
  const found = rows(tab).filter((row) =>
    Object.entries(values).every(([key, value]) => !value.trim() || (row.haystack[key] ?? '').toLowerCase().includes(value.trim().toLowerCase())),
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <div className="rounded-lg border border-xpp-line bg-white p-5">
        <div className="mx-auto flex w-fit rounded-md border border-xpp-line p-0.5 text-[0.8rem]" role="tablist">
          {(Object.keys(TABS) as SearchTab[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setValues({});
              }}
              className="cursor-pointer rounded px-5 py-1 font-medium text-xpp-ink aria-selected:bg-xpp-soft aria-selected:text-xpp-blue"
            >
              {TABS[key].label}
            </button>
          ))}
        </div>

        <form
          className="mt-4 grid grid-cols-2 gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {config.groups.map(([title, fields]) => (
            <fieldset key={title} className="rounded-lg bg-xpp-page p-4">
              <legend className="float-left mb-3 w-full text-[0.7rem] font-medium tracking-wide text-xpp-text">{title}</legend>
              <div className="clear-both flex flex-col gap-3">
                {fields.map((field) => (
                  <label key={field.key} className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-medium text-xpp-ink">{field.label}</span>
                    <input
                      value={values[field.key] ?? ''}
                      onChange={(event) => setValues((all) => ({ ...all, [field.key]: event.target.value }))}
                      placeholder={field.placeholder}
                      className="rounded-md border border-xpp-line bg-white px-3 py-1.5 text-[0.8rem] text-xpp-ink outline-none placeholder:text-xpp-muted focus:border-xpp-blue"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="col-span-2 flex items-center justify-end gap-5 text-[0.8rem]">
            <button type="button" onClick={() => setValues({})} className="cursor-pointer text-xpp-ink hover:underline">
              Clear filters
            </button>
            <button type="submit" className="cursor-pointer rounded-md bg-xpp-blue px-4 py-2 font-medium text-white hover:bg-[#1d4fd8]">
              Search {config.label === 'Case' ? 'Cases' : `${config.label}s`}
            </button>
          </div>
        </form>
      </div>

      <div ref={results} className="mt-5 scroll-mt-3">
        <p className="mb-2.5 text-[1rem] font-medium text-xpp-ink">
          {config.label} search results <span className="ml-1 text-xpp-muted">{found.length}</span>
        </p>
        <div className="overflow-hidden rounded-lg border border-xpp-line bg-white text-[0.8rem]">
          {found.length ? (
            <Table head={config.head} rows={found.map((row) => row.cells)} onRow={(index) => onOpen(found[index].ref)} />
          ) : (
            <p className="px-5 py-6 text-xpp-text">Nothing matches these filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Entity pages.

/** A page with its own section menu on the left, as every entity page of the portal has. */
function Page({ sections }: { sections: [string, ReactNode][] }) {
  const [active, setActive] = useState(sections[0][0]);
  const scroller = useRef<HTMLDivElement>(null);
  const idOf = (title: string) => `xp-section-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <div className="flex min-h-0 flex-1">
      <nav className="w-36 shrink-0 pt-5 pl-5 text-[0.8rem]">
        {sections.map(([title]) => (
          <button
            key={title}
            type="button"
            onClick={() => {
              setActive(title);
              scroller.current?.querySelector(`#${idOf(title)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`flex w-full cursor-pointer items-center gap-2 border-b border-xpp-line py-2.5 text-left ${active === title ? 'font-medium text-xpp-ink' : 'text-xpp-muted'}`}
          >
            <span className={`size-1.5 rounded-full ${active === title ? 'bg-xpp-blue' : 'bg-transparent'}`} />
            {title}
          </button>
        ))}
      </nav>
      <div ref={scroller} className="min-w-0 flex-1 overflow-y-auto px-5 pt-4 pb-8 text-[0.85rem]">
        {sections.map(([title, content]) => (
          <section key={title} id={idOf(title)} className="mb-6 scroll-mt-3">
            <h2 className="mb-3 text-[1.05rem] font-medium text-xpp-ink">{title}</h2>
            <div className="flex flex-col gap-3">{content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

function CaseList({ ids, onOpen }: { ids: string[]; onOpen: Open }) {
  if (!ids.length) return <Card>No cases in the record.</Card>;
  return (
    <div className="overflow-hidden rounded-lg border border-xpp-line bg-white text-[0.8rem]">
      <Table
        head={['Type', 'Case #', 'Caption', 'Filed', 'Status']}
        rows={ids.map((id) => [<CourtBadge court={cases[id].court} />, cases[id].number, cases[id].caption, <span className="text-xpp-muted">{cases[id].filed}</span>, cases[id].status])}
        onRow={(index) => onOpen({ kind: 'case', id: ids[index] })}
      />
    </div>
  );
}

function List({ rows }: { rows: [ReactNode, ReactNode, ReactNode?][] }) {
  return (
    <ul className="flex flex-col">
      {rows.map(([name, value, extra], index) => (
        <li key={index} className="flex items-center gap-4 border-b border-xpp-line py-2 last:border-0">
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <span className="w-14 text-right text-xpp-text tabular-nums">{value}</span>
          {extra !== undefined && <span className="flex w-36 items-center justify-end gap-3 text-xpp-text tabular-nums">{extra}</span>}
        </li>
      ))}
    </ul>
  );
}

function Side({ title, side, court, onOpen }: { title: string; side: Case['plaintiff']; court: Case['court']; onOpen: Open }) {
  const party = parties[side.party];
  const rating = party.ratings.find(([ratingCourt]) => ratingCourt === court)?.[1] ?? party.ratings[0][1];
  return (
    <Card title={title}>
      <p className="text-[0.75rem] font-medium text-xpp-muted">Party</p>
      <div className="mt-1.5 flex items-center gap-2">
        <EntityLink to={{ kind: 'party', id: side.party }} onOpen={onOpen}>
          {party.name}
        </EntityLink>
        {party.type === 'NPE' && <span className="text-[0.7rem] text-xpp-muted">NPE</span>}
        <span className="ml-auto">
          <RatingCells rating={rating} />
        </span>
      </div>
      <p className="mt-4 text-[0.75rem] font-medium text-xpp-muted">Attorney</p>
      <div className="mt-1.5 flex items-center">
        <EntityLink to={{ kind: 'firm', id: side.firm }} onOpen={onOpen}>
          <b className="font-medium">{firms[side.firm].name}</b>
        </EntityLink>
        <span className="ml-auto text-[0.75rem] text-xpp-text">{firms[side.firm].winRate}% win rate</span>
      </div>
      {side.attorneys.map((id) => (
        <div key={id} className="mt-1.5 flex items-center pl-4">
          <EntityLink to={{ kind: 'attorney', id }} onOpen={onOpen}>
            {attorneys[id].name}
          </EntityLink>
          <span className="ml-auto">
            <RatingCells rating={attorneys[id].rating} />
          </span>
        </div>
      ))}
    </Card>
  );
}

function CasePage({ id, onOpen }: { id: string; onOpen: Open }) {
  const item = cases[id];
  const ptab = item.court === 'PTAB';
  const owner = ptab ? item.defendant : item.plaintiff;
  const judge = judges[item.judge];
  // Other cases of either party. With no experts disclosed yet, the page shows who testified in those,
  // each expert once, with the newest case.
  const related = [...new Set([...casesOf({ kind: 'party', id: item.plaintiff.party }), ...casesOf({ kind: 'party', id: item.defendant.party })])].filter((other) => other !== id);
  const earlierExperts = related
    .flatMap((other) => cases[other].experts.map((entry) => ({ ...entry, case: other })))
    .filter((entry, index, all) => all.findIndex((other) => other.expert === entry.expert) === index);
  return (
    <Page
      sections={[
        [
          'General',
          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <Card title="General">
              <Stats
                items={[
                  ['Filed', item.filed],
                  ['Cause of Action', item.cause],
                  ['Sector', item.sector],
                  ['Status', item.status],
                  ['Patent Owner', parties[owner.party].type],
                  ['Source', <span className="text-xpp-blue">{ptab ? 'P-TACTS' : 'PACER'}</span>],
                ]}
              />
            </Card>
            <Card title="Court" aside={item.jurisdiction}>
              <Stats
                cols={2}
                items={[
                  [ptab ? 'Panel' : 'Judge', <EntityLink to={{ kind: 'judge', id: item.judge }} onOpen={onOpen}>{judge.name}</EntityLink>],
                  ['PO Win Rate', `${judge.poWinRate}%`],
                  ...(item.magistrate
                    ? ([['Magistrate', <EntityLink to={{ kind: 'judge', id: item.magistrate }} onOpen={onOpen}>{judges[item.magistrate].name}</EntityLink>]] as [string, ReactNode][])
                    : []),
                ]}
              />
            </Card>
          </div>,
        ],
        [
          'Parties',
          <div className="grid grid-cols-2 gap-3">
            <Side title={ptab ? 'Petitioner' : 'Plaintiff'} side={item.plaintiff} court={item.court} onOpen={onOpen} />
            <Side title={ptab ? 'Patent Owner' : 'Defendant'} side={item.defendant} court={item.court} onOpen={onOpen} />
          </div>,
        ],
        [
          'Patents',
          item.patents.length ? (
            <div className="overflow-hidden rounded-lg border border-xpp-line bg-white text-[0.8rem]">
              <Table
                head={['Patent #', 'Title', 'Art Unit', 'Expiration']}
                rows={item.patents.map((patent) => [patents[patent].number, patents[patent].title, patents[patent].artUnit.split(' ')[0], <span className="text-xpp-muted">{patents[patent].expires}</span>])}
                onRow={(index) => onOpen({ kind: 'patent', id: item.patents[index] })}
              />
            </div>
          ) : (
            <Card>No patents in the record for this case.</Card>
          ),
        ],
        [
          'Experts',
          <Card>
            {item.experts.length ? (
              <List rows={item.experts.map((entry) => [<EntityLink to={{ kind: 'expert', id: entry.expert }} onOpen={onOpen}>{experts[entry.expert].name}</EntityLink>, '', entry.side])} />
            ) : (
              <>
                <p className="text-xpp-text">No experts disclosed yet. In other cases of these parties:</p>
                <div className="mt-2">
                  <List
                    rows={earlierExperts.map((entry) => [
                      <EntityLink to={{ kind: 'expert', id: entry.expert }} onOpen={onOpen}>{experts[entry.expert].name}</EntityLink>,
                      '',
                      <EntityLink to={{ kind: 'case', id: entry.case }} onOpen={onOpen}>{cases[entry.case].number}</EntityLink>,
                    ])}
                  />
                </div>
              </>
            )}
          </Card>,
        ],
        ['Related Cases', <CaseList ids={related} onOpen={onOpen} />],
      ]}
    />
  );
}

function PatentPage({ id, onOpen }: { id: string; onOpen: Open }) {
  const patent = patents[id];
  return (
    <Page
      sections={[
        [
          'General',
          <Card title="General">
            <Stats
              items={[
                ['Patent', patent.number],
                ['Filed', patent.filed],
                ['Issued', patent.issued],
                ['Expiration', patent.expires],
                ['Assignee', <EntityLink to={{ kind: 'party', id: patent.assignee }} onOpen={onOpen}>{parties[patent.assignee].name}</EntityLink>],
                ['Art Unit', patent.artUnit],
                ['Examiner', patent.examiner],
              ]}
            />
          </Card>,
        ],
        ...(id === MAIN_PATENT
          ? ([
              [
                'Intelligence',
                <Card>
                  <p className="text-xpp-text">Prosecution history, examiner search and an invalidity framework, each reviewed before release.</p>
                  <button type="button" onClick={() => onOpen({ kind: 'patent', id }, 'analysis')} className="mt-3 cursor-pointer rounded-md bg-xpp-blue px-4 py-1.5 font-medium text-white hover:bg-[#1d4fd8]">
                    Open analysis
                  </button>
                </Card>,
              ],
            ] as [string, ReactNode][])
          : []),
        ['Litigation', <CaseList ids={casesOf({ kind: 'patent', id })} onOpen={onOpen} />],
      ]}
    />
  );
}

function PartyPage({ id, onOpen }: { id: string; onOpen: Open }) {
  const party = parties[id];
  return (
    <Page
      sections={[
        [
          'General',
          <div className="grid grid-cols-[1.6fr_1fr] gap-3">
            <Card title="General">
              <Stats
                items={[
                  ['Total Cases', party.totalCases.toLocaleString('en-US')],
                  ['Active Cases', party.activeCases],
                  ['Patents', party.patents.toLocaleString('en-US')],
                  ['Courts', <span className="flex flex-col">{party.courts.map((court) => <span key={court}>{court}</span>)}</span>],
                  ['Type', party.type],
                ]}
              />
            </Card>
            <Card title="Ratings">
              <ul className="flex flex-col gap-3">
                {party.ratings.map(([court, rating]) => (
                  <li key={court} className="flex items-center justify-between">
                    <CourtBadge court={court} />
                    <RatingCells rating={rating} />
                  </li>
                ))}
              </ul>
            </Card>
          </div>,
        ],
        [
          'Analytics',
          <Card title="Law Firms" aside="for Party">
            <List
              rows={party.firms.map((entry) => [
                <EntityLink to={{ kind: 'firm', id: entry.firm }} onOpen={onOpen}>{firms[entry.firm].name}</EntityLink>,
                entry.cases,
                <>
                  {entry.winRate}% <Bar value={entry.winRate} loss />
                </>,
              ])}
            />
          </Card>,
        ],
        ['Cases', <CaseList ids={casesOf({ kind: 'party', id })} onOpen={onOpen} />],
      ]}
    />
  );
}

function FirmPage({ id, onOpen }: { id: string; onOpen: Open }) {
  const firm = firms[id];
  const members = Object.keys(attorneys).filter((attorney) => attorneys[attorney].firm === id);
  return (
    <Page
      sections={[
        [
          'General',
          <Card title="General">
            <Stats
              cols={4}
              items={[
                ['Cases', firm.cases],
                ['Win Rate', `${firm.winRate}%`],
                ['Attorneys', members.length],
                ['Courts', firm.courts.join(', ')],
              ]}
            />
          </Card>,
        ],
        [
          'Attorneys',
          <Card>
            <List rows={members.map((attorney) => [<EntityLink to={{ kind: 'attorney', id: attorney }} onOpen={onOpen}>{attorneys[attorney].name}</EntityLink>, attorneys[attorney].cases, <RatingCells rating={attorneys[attorney].rating} />])} />
          </Card>,
        ],
        [
          'Clients',
          <Card>
            <List rows={firm.clients.map((entry) => [<EntityLink to={{ kind: 'party', id: entry.party }} onOpen={onOpen}>{parties[entry.party].name}</EntityLink>, entry.cases])} />
          </Card>,
        ],
        [
          'Experts',
          <Card title="Experts" aside="retained">
            <List rows={firm.experts.map((entry) => [<EntityLink to={{ kind: 'expert', id: entry.expert }} onOpen={onOpen}>{experts[entry.expert].name}</EntityLink>, entry.cases, experts[entry.expert].focus])} />
          </Card>,
        ],
        ['Cases', <CaseList ids={casesOf({ kind: 'firm', id })} onOpen={onOpen} />],
      ]}
    />
  );
}

function AttorneyPage({ id, onOpen }: { id: string; onOpen: Open }) {
  const attorney = attorneys[id];
  return (
    <Page
      sections={[
        [
          'General',
          <Card title="General">
            <Stats
              cols={4}
              items={[
                ['Law Firm', <EntityLink to={{ kind: 'firm', id: attorney.firm }} onOpen={onOpen}>{firms[attorney.firm].name}</EntityLink>],
                ['Cases', attorney.cases],
                ['Courts', attorney.courts.join(', ')],
                ['Rating', <RatingCells rating={attorney.rating} />],
              ]}
            />
          </Card>,
        ],
        ['Cases', <CaseList ids={casesOf({ kind: 'attorney', id })} onOpen={onOpen} />],
      ]}
    />
  );
}

function JudgePage({ id, onOpen }: { id: string; onOpen: Open }) {
  const judge = judges[id];
  return (
    <Page
      sections={[
        [
          'General',
          <Card title="General">
            <Stats
              items={[
                ['Court', judge.court],
                ['Role', judge.role],
                ['Cases', judge.cases],
                ['PO Win Rate', `${judge.poWinRate}%`],
                ['Time to Trial', judge.timeToTrial],
                ['Claim Construction', judge.markman],
              ]}
            />
          </Card>,
        ],
        [
          'Analytics',
          <Card title="Law Firms" aside="before this judge">
            <List
              rows={judge.firms.map((entry) => [
                <EntityLink to={{ kind: 'firm', id: entry.firm }} onOpen={onOpen}>{firms[entry.firm].name}</EntityLink>,
                entry.cases,
                <>
                  {entry.winRate}% <Bar value={entry.winRate} loss />
                </>,
              ])}
            />
          </Card>,
        ],
        ['Cases', <CaseList ids={casesOf({ kind: 'judge', id })} onOpen={onOpen} />],
      ]}
    />
  );
}

function ExpertPage({ id, onOpen }: { id: string; onOpen: Open }) {
  const expert = experts[id];
  const appearances = (entries: typeof expert.onBehalf) =>
    entries.map((entry) => [
      <EntityLink to={{ kind: 'party', id: entry.party }} onOpen={onOpen}>{parties[entry.party].name}</EntityLink>,
      entry.cases,
      <>
        {entry.exposure}% <Bar value={entry.exposure * 4} />
      </>,
    ]) as [ReactNode, ReactNode, ReactNode][];
  return (
    <Page
      sections={[
        [
          'General',
          <>
            <Card>
              <Stats
                cols={5}
                items={[
                  ['Cases', expert.cases],
                  ['Challenger', `${expert.challenger}%`],
                  ['Patent Owner', `${expert.patentOwner}%`],
                  ['NPE', `${expert.npe}%`],
                  ['Survival rate', expert.survival],
                ]}
              />
              <div className="mt-4 grid grid-cols-3 gap-6 border-t border-xpp-line pt-4">
                <div>
                  <p className="text-[0.75rem] font-medium text-xpp-muted">Credentials</p>
                  {expert.credentials.map(([label, type]) => (
                    <p key={label} className="mt-1.5 flex items-center gap-1.5 text-[0.7rem]">
                      <span className="rounded bg-xpp-blue px-1.5 py-0.5 font-medium text-white">{label}</span>
                      <span className="rounded bg-xpp-page px-1.5 py-0.5 font-medium text-xpp-text uppercase">{type}</span>
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-[0.75rem] font-medium text-xpp-muted">Challenge Activity</p>
                  <p className="mt-1.5">{expert.challenges.challenged} challenged</p>
                  <p>{expert.challenges.excluded} excluded</p>
                  <p>{expert.challenges.survived} survived</p>
                </div>
                <div>
                  <p className="text-[0.75rem] font-medium text-xpp-muted">Top Appearances</p>
                  {expert.onBehalf.map((entry) => (
                    <p key={entry.party} className="mt-1.5">
                      <EntityLink to={{ kind: 'party', id: entry.party }} onOpen={onOpen}>{parties[entry.party].name}</EntityLink>
                    </p>
                  ))}
                </div>
              </div>
            </Card>
            <Card title="Technical Focus">
              <p className="text-xpp-text">{expert.summary}</p>
              <p className="mt-3 flex flex-wrap gap-1.5">
                {expert.tags.map((tag) => (
                  <span key={tag} className="rounded bg-xpp-page px-2 py-0.5 text-[0.75rem] font-medium text-xpp-ink">
                    {tag}
                  </span>
                ))}
              </p>
            </Card>
          </>,
        ],
        [
          'Analytics',
          <div className="grid grid-cols-2 gap-3">
            <Card title="On Behalf Of">
              <List rows={appearances(expert.onBehalf)} />
            </Card>
            <Card title="Against">
              <List rows={appearances(expert.against)} />
            </Card>
          </div>,
        ],
        ['Cases', <CaseList ids={casesOf({ kind: 'expert', id })} onOpen={onOpen} />],
      ]}
    />
  );
}

export function EntityPage({ entity, onOpen }: { entity: Ref; onOpen: Open }) {
  const props = { id: entity.id, onOpen };
  switch (entity.kind) {
    case 'case':
      return <CasePage {...props} />;
    case 'patent':
      return <PatentPage {...props} />;
    case 'party':
      return <PartyPage {...props} />;
    case 'firm':
      return <FirmPage {...props} />;
    case 'attorney':
      return <AttorneyPage {...props} />;
    case 'judge':
      return <JudgePage {...props} />;
    case 'expert':
      return <ExpertPage {...props} />;
  }
}

