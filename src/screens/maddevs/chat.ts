// Content of the Slack window on the Mad Devs screen. The project facts come from Roman; the colleagues and
// the exact wording of their messages are placeholders until real ones replace them.

export type UserId = 'roman' | 'aliya' | 'dana' | 'aibek' | 'timur' | 'radiator' | 'deploy';

export type User = { name: string; title: string; color: string; bot?: boolean };

export const users: Record<UserId, User> = {
  roman: { name: 'Roman Chas', title: 'Lead Front-End Developer', color: '#ec1c24' },
  aliya: { name: 'Aliya', title: 'Front-end intern', color: '#4e9689' },
  dana: { name: 'Dana', title: 'Project manager', color: '#e8912d' },
  aibek: { name: 'Aibek', title: 'Product designer', color: '#2eb67d' },
  timur: { name: 'Timur', title: 'Back-end developer', color: '#1264a3' },
  radiator: { name: 'Mad Radiator', title: 'Bot: SEO and analytics reports', color: '#533f4c', bot: true },
  deploy: { name: 'Deploy Bot', title: 'Bot: GitLab CI', color: '#261c25', bot: true },
};

export type Report = { site: string; fields: [label: string, value: string][] };

export type Message = {
  id: string;
  user: UserId;
  time: string;
  /** `@name` mentions a user, `#channel` links a channel. */
  text: string;
  report?: Report;
  reactions?: Record<string, number>;
  replies?: { user: UserId; time: string; text: string }[];
};

export type Conversation = {
  id: string;
  kind: 'channel' | 'dm';
  /** Channel name, or the other person in a DM. */
  name: string;
  topic: string;
  messages: Message[];
  unread?: number;
  /** Arrives, after a typing indicator, the first time the conversation is opened. */
  incoming?: Message;
};

export function radiatorReport(run = 0): Report {
  // Small, repeatable changes between runs.
  const wobble = (base: number, spread: number) => base + ((run * 7 + spread) % (spread * 2 + 1)) - spread;
  const sessions = 12408 + run * 311;
  return {
    site: 'maddevs.io',
    fields: [
      ['Performance', String(Math.min(100, wobble(96, 2)))],
      ['Accessibility', '100'],
      ['SEO', '100'],
      ['Sessions, 7 days', `${sessions.toLocaleString('en-US')} (+${wobble(6, 3)}%)`],
      ['Broken links', run % 3 === 2 ? '1' : '0'],
      ['Pages in sitemap', String(214 + run)],
    ],
  };
}

export const conversations: Conversation[] = [
  {
    id: 'maddevs-io',
    kind: 'channel',
    name: 'maddevs-io',
    topic: 'The company website: Vue.js on the front, Node.js with Express and PostgreSQL behind it',
    messages: [
      {
        id: 'm1',
        user: 'deploy',
        time: '10:02',
        text: 'Production deploy finished: maddevs.io, 14 changes.',
        reactions: { '🚀': 5 },
      },
      {
        id: 'm2',
        user: 'dana',
        time: '10:05',
        text: 'The case study pages look much cleaner now. Thanks @roman!',
        reactions: { '🙌': 3 },
        replies: [
          { user: 'aibek', time: '10:09', text: 'Spacing finally matches the design file.' },
          { user: 'roman', time: '10:12', text: 'Next up: the blog cards.' },
        ],
      },
      {
        id: 'm3',
        user: 'roman',
        time: '11:40',
        text: 'Polish week summary: spacing on case studies, lighter images on the blog, and the contact form now survives slow networks.',
        reactions: { '👏': 4, '🔥': 2 },
      },
    ],
  },
  {
    id: 'mad-radiator',
    kind: 'channel',
    name: 'mad-radiator',
    topic: 'A TypeScript app that collects SEO and analytics data about a website and posts it here and to Telegram',
    unread: 1,
    messages: [
      { id: 'r1', user: 'radiator', time: 'Mon 09:00', text: 'Weekly report is ready.', report: radiatorReport() },
      {
        id: 'r2',
        user: 'roman',
        time: 'Mon 09:14',
        text: 'Anyone can ask for a fresh one: type /radiator run below.',
        reactions: { '👀': 2 },
      },
    ],
  },
  {
    id: 'enji-ai',
    kind: 'channel',
    name: 'enji-ai',
    topic: 'Engineering analytics. I helped build the first version of the employee interface: Vue.js on the front, Python behind it',
    messages: [
      { id: 'e1', user: 'timur', time: '14:20', text: 'The API for the employee dashboard is on staging.' },
      {
        id: 'e2',
        user: 'roman',
        time: '16:55',
        text: 'First version of the employee view is up: profile, activity and standups.',
        reactions: { '🎉': 6 },
        replies: [
          { user: 'aibek', time: '17:01', text: 'The empty states look right, nice.' },
          { user: 'timur', time: '17:03', text: 'Standups endpoint is paginated now, so it should stay fast.' },
          { user: 'roman', time: '17:10', text: 'Switched to it, thanks.' },
        ],
      },
    ],
  },
  {
    id: 'elcart',
    kind: 'channel',
    name: 'elcart',
    topic: '2018–2019: the landing page and the front end for Elcart mobile banking',
    messages: [
      { id: 'c1', user: 'roman', time: '2019', text: 'The landing page is live. Next: the front end of the app itself.' },
    ],
  },
  {
    id: 'itc-team',
    kind: 'channel',
    name: 'itc-team',
    topic: 'The small team I lead',
    messages: [
      {
        id: 't1',
        user: 'aliya',
        time: '09:31',
        text: 'Yesterday: finished the form validation. Today: tests for it.',
      },
      { id: 't2', user: 'roman', time: '09:40', text: '@aliya nice. Ping me when the PR is ready.', reactions: { '👍': 1 } },
    ],
  },
  {
    id: 'dm-aliya',
    kind: 'dm',
    name: 'aliya',
    topic: 'Mentorship and internships',
    unread: 1,
    messages: [
      { id: 'a1', user: 'aliya', time: '15:02', text: 'Could you look at my PR when you have a minute?' },
      { id: 'a2', user: 'roman', time: '15:30', text: 'Left a few comments. Mostly naming, the logic is good.' },
    ],
    incoming: { id: 'a3', user: 'aliya', time: '15:48', text: 'Thanks! Fixed them all. Can I take the next task?' },
  },
  {
    id: 'dm-dana',
    kind: 'dm',
    name: 'dana',
    topic: 'Project manager',
    messages: [
      { id: 'd1', user: 'dana', time: '12:10', text: 'Can we ship the careers page this week?' },
      { id: 'd2', user: 'roman', time: '12:14', text: 'Yes, Thursday.' },
    ],
    incoming: { id: 'd3', user: 'dana', time: '12:15', text: 'Perfect, I will tell the team.' },
  },
  {
    id: 'dm-aibek',
    kind: 'dm',
    name: 'aibek',
    topic: 'Product designer',
    messages: [{ id: 'b1', user: 'aibek', time: 'Tue', text: 'New icons are in Figma.', reactions: { '🙏': 1 } }],
  },
];
