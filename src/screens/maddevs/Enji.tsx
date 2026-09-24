import { useState, type ReactNode } from 'react';
import { brandIcon } from '../../content/icons';
import { users } from './chat';

// enji.ai, the Mad Devs platform for teams: my page in it, as an employee sees their own. I helped build the
// first version of this employee interface. The profile and the current project come from my real page;
// the logged hours are a demo: eight hours on every past workday, four so far today.

const BLUE = '#4350f0';
const INK = '#121218';
const MUTED = '#6b6b78';
const PAGE = '#f5f5f6';
const CHIP = '#eeeef1';

const SKILLS = ['HTML', 'CSS', 'Docker', 'SASS', 'VueJS', 'ReactJS', 'Webpack', 'Angular'];
const MORE = ['TypeScript', 'Next.js', 'NestJS'];
const TABS = ['General', 'Integrations', 'Absences', 'Comments', 'Statistics'] as const;
const MONTHLY = 160;

type Nav = 'work' | 'projects' | 'colleagues';
type Tab = (typeof TABS)[number];

const DAY = 86_400_000;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
// Month names spelled out, as enji.ai writes them: the locale would give "Sept".
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const short = (date: Date) => `${date.getDate()} ${MONTHS[date.getMonth()]}`;
const long = (date: Date) => `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

/** Hours logged on Ex Parte that day: none on weekends and in the future, four so far today. */
function hours(date: Date, today: Date) {
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  if (weekend || date > today) return null;
  return date.getTime() === today.getTime() ? 4 : 8;
}

const icon = (d: string, className = 'size-4') => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const NAV: { id: Nav | null; label: string; path: string }[] = [
  { id: null, label: 'Search', path: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM21 21l-5.2-5.2' },
  { id: 'work', label: 'My work', path: 'M3 6h6l2 2h10v11H3zM12 11v5M9.5 13.5h5' },
  { id: 'projects', label: 'Projects', path: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16' },
  { id: 'colleagues', label: 'Colleagues', path: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.8 3.1 2.6 3.5 5.2' },
  { id: null, label: 'Meetings', path: 'M3 7h12v10H3zM15 11l6-3v8l-6-3' },
];

function Card({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-4">
      <header className="mb-3 flex items-center gap-3">
        <h3 className="text-[0.95rem] font-semibold" style={{ color: INK }}>
          {title}
        </h3>
        <span className="ml-auto flex items-center gap-2">{aside}</span>
      </header>
      {children}
    </section>
  );
}

function ProjectName({ id, name }: { id: 'exparte' | 'bilebile' | 'teacherly'; name: string }) {
  return (
    <span className="flex items-center gap-2">
      <img src={brandIcon[id]} alt="" width="64" height="64" className="size-6 rounded-full" />
      {name}
    </span>
  );
}

export default function Enji() {
  const [nav, setNav] = useState<Nav>('work');
  const [tab, setTab] = useState<Tab>('General');
  const [week, setWeek] = useState(0);
  const [more, setMore] = useState(false);
  const [previous, setPrevious] = useState(false);
  const [standup, setStandup] = useState(false);
  const [how, setHow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  const today = startOfDay(new Date());
  const monday = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY + week * 7 * DAY);
  const days = Array.from({ length: 7 }, (_, index) => new Date(monday.getTime() + index * DAY));
  const logged = days.map((date) => hours(date, today));
  const total = logged.reduce<number>((sum, value) => sum + (value ?? 0), 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  let month = 0;
  for (let date = monthStart; date <= today; date = new Date(date.getTime() + DAY)) month += hours(date, today) ?? 0;

  function copy() {
    const text = `Ex Parte: ${logged.filter(Boolean).length} days, ${total}h this week`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const general = (
    <div className="flex flex-col gap-3">
      <Card
        title="Weekly worklogs report"
        aside={
          <span className="flex items-center gap-1 rounded-lg border border-[#dcdce2] px-2.5 py-1 text-[0.75rem]">
            <span style={{ color: MUTED }}>
              {short(days[0])} – {short(days[6])} {days[6].getFullYear()}
            </span>
            <button type="button" aria-label="Previous week" onClick={() => setWeek((value) => value - 1)} className="cursor-pointer px-1">
              {icon('M15 5l-7 7 7 7', 'size-3.5')}
            </button>
            <button type="button" aria-label="Next week" disabled={week >= 0} onClick={() => setWeek((value) => value + 1)} className="cursor-pointer px-1 disabled:cursor-default disabled:opacity-30">
              {icon('M9 5l7 7-7 7', 'size-3.5')}
            </button>
          </span>
        }
      >
        <table className="w-full text-left text-[0.75rem]">
          <thead>
            <tr className="border-b border-[#e4e4e9]" style={{ color: INK }}>
              <th className="py-2 font-semibold">Project / Date</th>
              {days.map((date) => (
                <th key={date.getTime()} className="py-2 text-center font-semibold whitespace-nowrap">
                  {short(date)}
                  {date.getTime() === today.getTime() && <span className="block text-[0.65rem] font-normal" style={{ color: BLUE }}>today</span>}
                </th>
              ))}
              <th className="py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ color: INK }}>
              <td className="py-2.5">
                <ProjectName id="exparte" name="Ex Parte" />
              </td>
              {logged.map((value, index) => (
                <td key={index} className="py-2.5 text-center tabular-nums" style={{ color: value ? INK : '#b4b4bd' }}>
                  {value === null ? '—' : `${value}h`}
                </td>
              ))}
              <td className="py-2.5 text-right font-semibold tabular-nums">{total}h</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Worklogs by SoW projects" aside={<span className="text-[0.7rem]" style={{ color: MUTED }}>{long(monthStart)} – {long(monthEnd)}</span>}>
          <div className="flex items-center gap-3 text-[0.8rem]" style={{ color: INK }}>
            <ProjectName id="exparte" name="Ex Parte" />
            <span className="ml-auto tabular-nums">{month}h</span>
            <span className="relative h-5 w-32 overflow-hidden rounded-md" style={{ background: CHIP }}>
              <span className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${Math.min(100, (month / MONTHLY) * 100)}%`, background: BLUE }} />
              <span className="absolute inset-y-0 right-1.5 flex items-center text-[0.7rem] font-semibold">{MONTHLY}h</span>
            </span>
          </div>
        </Card>

        <Card
          title="Standup"
          aside={
            <>
              <button type="button" aria-expanded={how} onClick={() => setHow((value) => !value)} className="cursor-pointer rounded-lg border border-[#dcdce2] px-2.5 py-1 text-[0.75rem]" style={{ color: INK }}>
                How it works?
              </button>
              <button type="button" onClick={copy} className="cursor-pointer rounded-lg border px-2.5 py-1 text-[0.75rem]" style={{ borderColor: BLUE, color: BLUE }}>
                {copied ? 'Copied' : 'Copy all worklogs'}
              </button>
            </>
          }
        >
          {how && <p className="mb-2 text-[0.75rem]" style={{ color: MUTED }}>Your worklogs of the day become your standup. Copy them into the project chat.</p>}
          <button type="button" aria-expanded={standup} onClick={() => setStandup((value) => !value)} className="flex w-full cursor-pointer items-center text-left text-[0.8rem]" style={{ color: INK }}>
            <ProjectName id="exparte" name="Ex Parte" />
            <span className={`ml-auto transition-transform ${standup ? 'rotate-90' : ''}`}>{icon('M9 5l7 7-7 7', 'size-3.5')}</span>
          </button>
          {standup && (
            <p className="mt-2 rounded-lg px-3 py-2 text-[0.75rem]" style={{ background: PAGE, color: INK }}>
              Yesterday: 8h on Ex Parte. Today: 4h so far, on Ex Parte.
            </p>
          )}
        </Card>
      </div>

      <Card
        title="Current projects"
        aside={
          <label className="flex cursor-pointer items-center gap-2 text-[0.75rem]" style={{ color: INK }}>
            Show previous projects
            <input type="checkbox" checked={previous} onChange={(event) => setPrevious(event.target.checked)} className="size-4" style={{ accentColor: BLUE }} />
          </label>
        }
      >
        <table className="w-full text-left text-[0.8rem]" style={{ color: INK }}>
          <thead>
            <tr className="border-b border-[#e4e4e9] text-[0.75rem]">
              <th className="py-2 font-semibold">Project</th>
              <th className="py-2 font-semibold">Monthly hours</th>
              <th className="py-2 font-semibold">Start date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">
                <ProjectName id="exparte" name="Ex Parte" />
              </td>
              <td className="py-2 tabular-nums">{MONTHLY}</td>
              <td className="py-2">05 Jan 2026</td>
            </tr>
            {previous &&
              (
                [
                  ['exparte', 'Ex Parte', 'May 2022 – Jan 2026'],
                  ['bilebile', 'Bile-Bile', 'Sep 2021 – May 2022'],
                  ['teacherly', 'Teacherly', 'Nov 2019 – Feb 2021'],
                ] as const
              ).map(([id, name, dates]) => (
                <tr key={dates} style={{ color: MUTED }}>
                  <td className="py-2">
                    <ProjectName id={id} name={name} />
                  </td>
                  <td className="py-2">—</td>
                  <td className="py-2">{dates}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const other: Record<Exclude<Tab, 'General'>, ReactNode> = {
    Integrations: (
      <Card title="Integrations">
        <ul className="flex flex-col text-[0.8rem]" style={{ color: INK }}>
          {['GitLab', 'GitHub', 'Slack', 'Google Calendar'].map((name) => (
            <li key={name} className="flex items-center justify-between border-b border-[#eeeef1] py-2 last:border-0">
              {name}
              <span className="rounded-full px-2 py-0.5 text-[0.7rem] font-medium" style={{ background: '#e7f6ec', color: '#1e7b3d' }}>
                Connected
              </span>
            </li>
          ))}
        </ul>
      </Card>
    ),
    Absences: (
      <Card title="Absences">
        <p className="text-[0.8rem]" style={{ color: MUTED }}>
          No absences planned for {today.toLocaleDateString('en-GB', { month: 'long' })}.
        </p>
      </Card>
    ),
    Comments: (
      <Card title="Comments">
        {comments.length === 0 && <p className="mb-3 text-[0.8rem]" style={{ color: MUTED }}>No comments yet.</p>}
        <ul className="mb-3 flex flex-col gap-2">
          {comments.map((comment, index) => (
            <li key={index} className="rounded-lg px-3 py-2 text-[0.8rem]" style={{ background: PAGE, color: INK }}>
              {comment}
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            setComments((all) => [...all, draft.trim()]);
            setDraft('');
          }}
        >
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Leave a comment" className="min-w-0 flex-1 rounded-lg border border-[#dcdce2] px-3 py-1.5 text-[0.8rem] outline-none" style={{ color: INK }} />
          <button type="submit" className="cursor-pointer rounded-lg px-3 text-[0.8rem] font-medium text-white" style={{ background: BLUE }}>
            Send
          </button>
        </form>
      </Card>
    ),
    Statistics: (
      <Card title="Hours by month">
        <div className="flex h-40 items-end gap-3">
          {Array.from({ length: today.getMonth() + 1 }, (_, index) => {
            const value = index === today.getMonth() ? month : MONTHLY;
            return (
              <div key={index} className="flex flex-1 flex-col items-center gap-1 text-[0.7rem]" style={{ color: MUTED }}>
                <span className="tabular-nums">{value}</span>
                <span className="w-full rounded-t-md" style={{ height: `${(value / MONTHLY) * 7}rem`, background: index === today.getMonth() ? BLUE : '#c7cbfa' }} />
                {MONTHS[index]}
              </div>
            );
          })}
        </div>
      </Card>
    ),
  };

  const team = Object.values(users).filter((user) => !user.bot);

  return (
    <div className="flex min-h-0 flex-1 font-inter text-[0.85rem]" style={{ background: PAGE, color: INK }}>
      <aside className="flex w-48 shrink-0 flex-col bg-white">
        <p className="flex items-center gap-2 px-4 pt-4 pb-6 text-[0.95rem] leading-none font-black tracking-tight">
          <img src="/icons/maddevs.svg" alt="" width="64" height="64" className="size-7 rounded" />
          MAD DEVS
        </p>
        <nav className="flex flex-col gap-0.5 px-2" aria-label="enji.ai">
          {NAV.map((item) =>
            item.id ? (
              <button
                key={item.label}
                type="button"
                aria-current={nav === item.id ? 'page' : undefined}
                onClick={() => setNav(item.id!)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#f5f5f6]"
                style={{ color: nav === item.id ? BLUE : INK }}
              >
                {icon(item.path)}
                {item.label}
              </button>
            ) : (
              <span key={item.label} className="flex items-center gap-3 px-3 py-2 opacity-45">
                {icon(item.path)}
                {item.label}
              </span>
            ),
          )}
        </nav>
        <p className="mx-4 mt-3 flex items-center justify-between border-t border-[#eeeef1] pt-3 text-[0.8rem]">
          HR <span style={{ color: MUTED }}>▾</span>
        </p>
        <p className="mt-auto flex items-center gap-2 border-t border-[#eeeef1] px-3 py-3 text-[0.8rem]">
          <img src="/avatar.jpg" alt="" width="330" height="330" className="size-8 rounded-full object-cover" />
          Roman Chasovitin
        </p>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4">
        {nav === 'work' && (
          <>
            <header className="flex items-center gap-3">
              <img src="/avatar.jpg" alt="" width="330" height="330" className="size-11 rounded-full object-cover" />
              <div>
                <p className="text-[1rem] font-semibold">Roman Chasovitin</p>
                <p className="text-[0.8rem]" style={{ color: MUTED }}>
                  Senior · Web developer · Kyrgyzstan
                </p>
              </div>
            </header>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.75rem]">
              {[...SKILLS, ...(more ? MORE : [])].map((skill) => (
                <span key={skill} className="rounded-md px-2 py-1" style={{ background: CHIP }}>
                  {skill}
                </span>
              ))}
              <button type="button" onClick={() => setMore((value) => !value)} className="cursor-pointer px-1 font-medium" style={{ color: BLUE }}>
                {more ? 'Less' : `+${MORE.length}`}
              </button>
            </div>
            <div className="mt-3 flex gap-5 border-b border-[#e4e4e9]" role="tablist">
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => setTab(item)}
                  className="-mb-px cursor-pointer border-b-2 pb-2 text-[0.8rem]"
                  style={{ borderColor: tab === item ? BLUE : 'transparent', color: tab === item ? BLUE : MUTED }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-3">{tab === 'General' ? general : other[tab]}</div>
          </>
        )}

        {nav === 'projects' && (
          <Card title="Projects">
            <p className="flex items-center justify-between text-[0.8rem]">
              <ProjectName id="exparte" name="Ex Parte" />
              <span style={{ color: MUTED }}>{MONTHLY} hours a month, since 05 Jan 2026</span>
            </p>
          </Card>
        )}

        {nav === 'colleagues' && (
          <Card title="Colleagues">
            <ul className="grid grid-cols-2 gap-2">
              {team.map((user) => (
                <li key={user.name} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5" style={{ background: PAGE }}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold text-white" style={{ background: user.color }}>
                    {user.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{user.name}</span>
                    <span className="block truncate text-[0.7rem]" style={{ color: MUTED }}>
                      {user.title}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
