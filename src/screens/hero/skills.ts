// The skills of the agent in the hero. Each one turns the site's own data into an agent-style run: a short
// think, a few tool calls with their results, then the answer line by line. No network, no model.
import { profile } from '../../content/profile';
import { formatYears, projects, type Project, type ProjectId } from '../../content/projects';

/** `href` makes the segment a link; `#id` links open a screen through the router. */
export type Segment = { text: string; color?: string; bold?: boolean; dim?: boolean; href?: string };
export type Line = Segment[];
export type Step =
  | { kind: 'think'; label: string; ms: number }
  | { kind: 'tool'; call: string; result: string }
  | { kind: 'out'; lines: Line[] }
  /** Fires an event on document: `screen:open` opens a project screen, `scheme:set` switches the hero theme. */
  | { kind: 'dispatch'; event: 'screen:open' | 'scheme:set'; detail: Record<string, string> };

// Colors come from the hero, which sets them per theme: the brand colors are too dark on a dark background.
export const BRAND: Record<ProjectId, string> = {
  exparte: 'var(--brand-exparte)',
  maddevs: 'var(--brand-maddevs)',
  bilebile: 'var(--brand-bilebile)',
  teacherly: 'var(--brand-teacherly)',
  chocolife: 'var(--brand-chocolife)',
};
const OK = 'var(--ok)';
const WARN = 'var(--warn)';
const BAD = 'var(--bad)';

export const skills = [
  { name: 'projects', usage: '/projects', summary: 'The products I have worked on' },
  { name: 'open', usage: '/open <project>', summary: 'Open the screen of one of them' },
  { name: 'about', usage: '/about', summary: 'Who I am and what I do now' },
  { name: 'timeline', usage: '/timeline', summary: 'My career as a git history' },
  { name: 'stack', usage: '/stack', summary: 'Every technology: where, and for how long' },
  { name: 'match', usage: '/match <job description>', summary: 'How well I fit a job you paste' },
  { name: 'review', usage: '/review [code]', summary: 'A code review, the way I do them' },
] as const;

const text = (value: string, style: Omit<Segment, 'text'> = {}): Segment => ({ text: value, ...style });
const plain = (value: string): Line => [text(value)];
const blank: Line = [text('')];
const project = (id: ProjectId) => projects.find((item) => item.id === id)!;
const name = (id: ProjectId) => text(project(id).name, { color: BRAND[id], bold: true });
const span = (item: Project) => formatYears({ start: item.roles.at(-1)!.period.start, end: item.roles[0].period.end });

const toMonths = (month: string) => {
  const [year, value] = month.split('-').map(Number);
  return year * 12 + value - 1;
};
const nowMonths = () => {
  const today = new Date();
  return today.getFullYear() * 12 + today.getMonth();
};

function about(): Step[] {
  const years = Math.floor((nowMonths() - toMonths('2018-06')) / 12);
  return [
    { kind: 'think', label: 'Reading the profile', ms: 700 },
    { kind: 'tool', call: 'Read content/profile.ts', result: `${profile.name}, ${profile.contacts.length} contacts` },
    { kind: 'tool', call: 'Read content/projects.ts', result: `${projects.length} projects since June 2018` },
    {
      kind: 'out',
      lines: [
        [text(profile.name, { bold: true }), text(`, ${profile.headline}.`)],
        [text('Lead at '), name('maddevs'), text(' since 2021, working on '), name('exparte'), text(' since May 2022.')],
        plain(`${years} years, ${projects.length} products: legal tech, rail travel, online education, coupon marketplaces.`),
        plain('Front end first, back end when the product needs it, and deep in the business side of each one.'),
        blank,
        [text('Contacts: ', { dim: true }), text(profile.contacts.map((contact) => contact.label).join(', ')), text(' (links are coming)', { dim: true })],
      ],
    },
  ];
}

function projectLines(): Line[] {
  const width = Math.max(...projects.map((item) => item.name.length)) + 3;
  return projects.flatMap((item, index): Line[] => [
    ...(index ? [blank] : []),
    [
      text(item.name, { color: BRAND[item.id], bold: true, href: `#${item.id}` }),
      text(' '.repeat(width - item.name.length)),
      text(span(item).padEnd(11), { dim: true }),
      text(item.roles[0].title),
    ],
    [text(item.summary, { dim: true })],
  ]);
}

function list(): Step[] {
  return [
    { kind: 'think', label: 'Listing the projects', ms: 600 },
    { kind: 'tool', call: 'Read content/projects.ts', result: `${projects.length} projects since June 2018` },
    { kind: 'out', lines: projectLines() },
  ];
}

// Spaces, dots and case do not matter: "Ex Parte", "Bile-Bile", "bile-bile.kz" and "teach" all find their project.
function find(input: string): ProjectId | undefined {
  const key = input.toLowerCase().replace(/[^a-z]/g, '');
  if (key.includes('besmart')) return 'chocolife';
  return projects.find((item) => key.includes(item.id) || (key.length >= 3 && item.id.startsWith(key)))?.id;
}

function open(input: string): Step[] {
  const id = find(input);
  if (!id) {
    const asked = input.trim();
    return [{ kind: 'out', lines: [plain(asked ? `I have no project called ${asked}. These are the ones I have:` : 'Which one? These are the ones I have:'), blank, ...projectLines()] }];
  }
  return [
    { kind: 'think', label: `Opening ${project(id).name}`, ms: 500 },
    { kind: 'tool', call: `Open #${id}`, result: `${project(id).name}, ${span(project(id))}` },
    { kind: 'dispatch', event: 'screen:open', detail: { id } },
  ];
}

function timeline(): Step[] {
  const role = (id: ProjectId, index = 0) => project(id).roles[index];
  const branch = (label: string, id: ProjectId) => text(`(${label})`, { color: BRAND[id], bold: true });
  const graph = (value: string) => text(value, { dim: true });
  return [
    { kind: 'think', label: 'Walking the history', ms: 800 },
    { kind: 'tool', call: 'git log --graph --all --date=short', result: '2 repositories, 6 branches, 1 merge' },
    {
      kind: 'out',
      lines: [
        [graph('*   '), text('now      '), text('(HEAD -> main) ', { bold: true }), text(`${role('maddevs').title} at Mad Devs`)],
        [graph('| * '), text('2022-05  '), branch('exparte', 'exparte'), text(` ${role('exparte').title}: the B2B portal, front to back`)],
        [graph('|/  ')],
        [graph('| * '), text('2022-05  '), branch('bile-bile', 'bilebile'), text(' seat map, checkout, billing, load tests')],
        [graph('| * '), text('2021-09  '), branch('bile-bile', 'bilebile'), text(' front end from scratch')],
        [graph('|/  ')],
        [graph('*   '), text('2021-04  '), text('main', { bold: true }), text(`: ${role('maddevs').title}, the ITC team, interns`)],
        [graph('| * '), text('2021-02  '), branch('teacherly', 'teacherly'), text(' redesign, video lessons, a team of five')],
        [graph('| * '), text('2019-11  '), branch('teacherly', 'teacherly'), text(' first commit as maintainer')],
        [graph('|/  ')],
        [graph('*   '), text('2019-11  '), text('main', { bold: true }), text(`: ${role('maddevs', 1).title}`)],
        [graph('*   '), text('2018-09  '), text('main', { bold: true }), text(': part-time, the Elcart mobile banking front end')],
        blank,
        [graph('*   '), text('2019-11  '), branch('chocolife', 'chocolife'), text(" Merge branch 'besmart': one platform")],
        [graph('|\\  ')],
        [graph('| * '), text('2018-06  '), branch('besmart', 'chocolife'), text(' BeSmart.kz and BeSmart.kg, one code base')],
        [graph('* | '), text('2018-06  '), branch('chocolife', 'chocolife'), text(' rewrite on Angular 2+, tests, first job')],
      ],
    },
  ];
}

// Measured in projects, not years: the data has no period per technology, and a project span
// (Mad Devs runs from 2018 to now) would overstate every tool used there.
function stack(): Step[] {
  const uses = new Map<string, ProjectId[]>();
  for (const item of projects) for (const tech of item.stack) uses.set(tech, [...(uses.get(tech) ?? []), item.id]);
  const first = (ids: ProjectId[]) => Math.min(...ids.map((id) => Math.min(...project(id).roles.map((role) => toMonths(role.period.start)))));
  const rows = [...uses.entries()]
    .map(([tech, ids]) => ({ tech, ids }))
    .sort((a, b) => b.ids.length - a.ids.length || first(a.ids) - first(b.ids));
  const width = Math.max(...rows.map((row) => row.tech.length));
  return [
    { kind: 'think', label: 'Counting technologies', ms: 900 },
    { kind: 'tool', call: 'Read content/projects.ts', result: `${projects.reduce((sum, item) => sum + item.stack.length, 0)} stack entries` },
    { kind: 'tool', call: 'Group by technology', result: `${rows.length} technologies across ${projects.length} projects` },
    {
      kind: 'out',
      lines: [
        ...rows.map((row): Line => [
          text(row.tech.padEnd(width + 2)),
          ...row.ids.map((id) => text('███', { color: BRAND[id] })),
          text(' '.repeat((3 - row.ids.length) * 3 + 2)),
          ...row.ids.flatMap((id, index) => [...(index ? [text(', ', { dim: true })] : []), text(project(id).name, { color: BRAND[id] })]),
        ]),
        blank,
        [text('One block per project. TypeScript and React ran through most of them.', { dim: true })],
      ],
    },
  ];
}

// Technologies a job post may ask for. Anything matched here and absent from my stacks is reported as a gap.
const KNOWN: [label: string, pattern: RegExp][] = [
  ['TypeScript', /\btypescript\b|\bts\b/i],
  ['JavaScript', /\bjavascript\b|(?<![.\w])js\b/i],
  ['React', /\breact(\.js)?\b/i],
  ['Next.js', /\bnext\.?js\b/i],
  ['Vue.js', /\bvue(\.js)?\b/i],
  ['Angular 2+', /\bangular\b/i],
  ['Node.js', /\bnode(\.js)?\b/i],
  ['Express', /\bExpress(\.js)?\b/],
  ['NestJS', /\bnest\.?js\b/i],
  ['Python', /\bpython\b/i],
  ['Go', /\bgolang\b|\bGo\b/],
  ['PostgreSQL', /\bpostgres(ql)?\b/i],
  ['GraphQL', /\bgraphql\b/i],
  ['Redux', /\bredux\b/i],
  ['RxJS', /\brxjs\b/i],
  ['MobX', /\bmobx\b/i],
  ['Databricks', /\bdatabricks\b/i],
  ['Azure', /\bazure\b/i],
  ['n8n', /\bn8n\b/i],
  ['Jest', /\bjest\b/i],
  ['GitLab CI', /\bgitlab\b|\bci\/cd\b/i],
  ['Docker Compose', /\bdocker\b/i],
  ['SCSS', /\bscss\b|\bsass\b/i],
  ['Kubernetes', /\bkubernetes\b|\bk8s\b/i],
  ['AWS', /\baws\b/i],
  ['Java', /\bjava\b/i],
  ['PHP', /\bphp\b/i],
  ['Svelte', /\bsvelte\b/i],
  ['Terraform', /\bterraform\b/i],
];
// Plain JavaScript is part of every TypeScript project.
const MINE = new Set([...projects.flatMap((item) => item.stack), 'JavaScript']);

function match(input: string): Step[] {
  if (!input.trim()) {
    return [{ kind: 'out', lines: [plain('Paste a job description after /match, for example:'), [text('/match Senior front-end engineer, React, TypeScript, Next.js, some Go', { dim: true })]] }];
  }
  const asked = KNOWN.filter(([, pattern]) => pattern.test(input)).map(([label]) => label);
  const matched = asked.filter((label) => MINE.has(label));
  const gaps = asked.filter((label) => !MINE.has(label));
  const score = asked.length ? Math.round((matched.length / asked.length) * 100) : 0;
  const signals = [
    [/\blead\b|\bleading\b/i, 'Asks for a lead: I lead at Mad Devs and on Ex Parte.'],
    [/\bmentor/i, 'Mentoring: I run internships at Mad Devs.'],
    [/full[- ]?stack/i, 'Full stack: yes, on Ex Parte from the portal down to the data.'],
    [/\bremote\b/i, 'Remote: every project here was remote or distributed.'],
  ] as const;
  const notes = signals.filter(([pattern]) => pattern.test(input)).map(([, note]) => note);
  const where = (label: string) =>
    projects
      .filter((item) => item.stack.includes(label))
      .map((item) => item.name)
      .join(', ') || 'every TypeScript project';
  const verdict = !asked.length
    ? 'No technologies named, so no score. Worth a talk if the role is product work on the web.'
    : score >= 70
      ? 'Strong fit.'
      : score >= 40
        ? 'Good fit: the gaps are learnable, the core is there.'
        : 'Partial fit. Still worth a call if the product is interesting.';
  return [
    { kind: 'think', label: 'Reading the job description', ms: 900 },
    { kind: 'tool', call: `Extract technologies (${input.length} characters)`, result: `${asked.length} found` },
    { kind: 'tool', call: 'Compare with content/projects.ts', result: `${matched.length} matched, ${gaps.length} missing` },
    {
      kind: 'out',
      lines: [
        [text('Match ', { bold: true }), text(asked.length ? `${score}%` : 'n/a', { bold: true, color: score >= 70 ? OK : score >= 40 ? WARN : BAD })],
        blank,
        ...matched.map((label): Line => [text('  ✓ ', { color: OK }), text(label.padEnd(16)), text(where(label), { dim: true })]),
        ...gaps.map((label): Line => [text('  ✗ ', { color: BAD }), text(label.padEnd(16)), text('not in my record yet', { dim: true })]),
        ...(notes.length ? [blank, ...notes.map((note) => plain(note))] : []),
        blank,
        plain(verdict),
      ],
    },
  ];
}

const SAMPLE = `var items = data.filter((x) => x.active == true);
console.log(items);
function total(list: any) {
  let sum = 0;
  for (var i = 0; i < list.length; i++) sum += list[i].price;
  return sum;
}`;

const RULES: [RegExp, string][] = [
  [/\bvar\s/, '`var` leaks out of blocks. Use `const`, or `let` if it really changes.'],
  [/[^=!]==\s*true\b/, 'Comparing with `true` adds nothing: `x.active` is enough.'],
  [/[^=!<>]==[^=]/, '`==` converts types first. Use `===`.'],
  [/console\.log\(/, 'A `console.log` left in. Remove it before merge.'],
  [/:\s*any\b/, '`any` turns the type checker off here. Describe the shape instead.'],
  [/for\s*\(.*;.*\.length;.*\)/, 'An index loop to add things up. `reduce` says what it does.'],
];

function review(input: string): Step[] {
  const code = input.trim() || SAMPLE;
  const lines = code.split('\n');
  const comments: Line[] = [];
  lines.forEach((line, index) => {
    const found = RULES.filter(([pattern]) => pattern.test(line)).map(([, comment]) => comment);
    if (line.length > 100) found.push('A long line. Split it so the diff stays readable.');
    if (!found.length) return;
    comments.push([text(`line ${index + 1}  `, { dim: true }), text(line.trim().slice(0, 64), { bold: true })]);
    for (const comment of found) comments.push([text('  ↳ ', { color: BRAND.maddevs }), text(comment)]);
  });
  const count = comments.filter((line) => line[0].text.startsWith('  ↳')).length;
  return [
    { kind: 'think', label: 'Reading the diff', ms: 800 },
    { kind: 'tool', call: `Read snippet${input.trim() ? '' : ' (a sample, none was pasted)'}`, result: `${lines.length} lines` },
    { kind: 'tool', call: 'Apply the rules I use in reviews', result: `${RULES.length + 1} rules, ${count} hits` },
    {
      kind: 'out',
      lines: count
        ? [
            ...comments,
            blank,
            plain(`${count} comments, no blockers. The logic is fine; this is about reading it in six months.`),
            plain('Approve after the fixes. Ping me if any of it is unclear.'),
          ]
        : [plain('Nothing to flag. Clear names, strict types, no leftovers. Approved.')],
    },
  ];
}

// Not in the list of skills: the button in the corner does the same. /help shows it.
function theme(input: string): Step[] {
  const current = document.getElementById('intro')?.dataset.scheme;
  const asked = input.trim().toLowerCase();
  const scheme = asked === 'light' || asked === 'dark' ? asked : current === 'dark' ? 'light' : 'dark';
  return [
    { kind: 'tool', call: `Switch the hero to the ${scheme} theme`, result: 'Saved for the next visit' },
    { kind: 'dispatch', event: 'scheme:set', detail: { scheme } },
  ];
}

export function run(command: string): Step[] | null {
  const [head] = command.trim().split(/\s+/);
  const argument = command.trim().slice(head.length).trim();
  switch (head) {
    case '/projects':
      return list();
    case '/open':
      return open(argument);
    case '/about':
      return about();
    case '/timeline':
      return timeline();
    case '/stack':
      return stack();
    case '/match':
      return match(argument);
    case '/review':
      return review(argument);
    case '/theme':
      return theme(argument);
    default:
      // Naming a project without a skill opens it too.
      return !head.startsWith('/') && find(command) ? open(command) : null;
  }
}
