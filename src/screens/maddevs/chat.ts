// Content of the Slack window on the Mad Devs screen. The people and project facts come from Roman; the exact
// wording of the messages is a placeholder until real ones replace it.

export type UserId = 'roman' | 'alice' | 'dmitry' | 'oleg' | 'emir' | 'denis' | 'alla' | 'radiator' | 'deploy';

export type User = { name: string; title: string; color: string; bot?: boolean };

export const users: Record<UserId, User> = {
  roman: { name: 'Roman Chas', title: 'Lead Front-End Developer', color: '#ec1c24' },
  alla: { name: 'Alla', title: 'CTO', color: '#1d1c1d' },
  alice: { name: 'Alice', title: 'Delivery manager', color: '#e8912d' },
  dmitry: { name: 'Dmitry K.', title: 'Project manager', color: '#2eb67d' },
  oleg: { name: 'Oleg', title: 'Back-end developer', color: '#1264a3' },
  emir: { name: 'Emir', title: 'Front-end and back-end developer', color: '#4e9689' },
  denis: { name: 'Denis', title: 'Front-end and back-end developer', color: '#9a4bff' },
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
    id: 'general',
    kind: 'channel',
    name: 'general',
    topic: 'Company-wide news',
    messages: [
      { id: 'g1', user: 'alla', time: 'Mon 09:05', text: '@here Quarter review is on Thursday. Each team gets ten minutes: what shipped, what broke, what we learned.', reactions: { '👍': 24, '📅': 6 } },
      { id: 'g2', user: 'alice', time: 'Mon 09:20', text: 'Reminder: update your availability for the holidays in the planner by Friday.' },
      { id: 'g3', user: 'alla', time: 'Tue 11:02', text: 'Welcome to the three new interns in #internship. @roman is mentoring the front-end track this time.', reactions: { '🎉': 31, '👋': 12 } },
      { id: 'g4', user: 'roman', time: 'Tue 11:10', text: 'Happy to. First task for all three is the same: ship one small fix to maddevs.io in week one.', reactions: { '🔥': 9 } },
      { id: 'g5', user: 'denis', time: 'Wed 16:40', text: 'Tech talk on Friday: how we test forms end to end. Snacks included.', reactions: { '🍕': 15 } },
    ],
  },
  {
    id: 'maddevs-io',
    kind: 'channel',
    name: 'maddevs-io',
    topic: 'The company website: Vue.js on the front, Node.js with Express and PostgreSQL behind it',
    messages: [
      { id: 'm1', user: 'deploy', time: '10:02', text: 'Production deploy finished: maddevs.io, 14 changes.', reactions: { '🚀': 5 } },
      {
        id: 'm2',
        user: 'dmitry',
        time: '10:05',
        text: 'The case study pages look much cleaner now. Thanks @roman!',
        reactions: { '🙌': 3 },
        replies: [
          { user: 'emir', time: '10:09', text: 'Spacing finally matches the design file.' },
          { user: 'roman', time: '10:12', text: 'Next up: the blog cards.' },
        ],
      },
      { id: 'm3', user: 'oleg', time: '10:31', text: 'The contact form endpoint now retries on timeouts. @roman the front end can drop its own retry.' },
      { id: 'm4', user: 'roman', time: '10:44', text: 'Dropped it. One less place to break.', reactions: { '👌': 2 } },
      {
        id: 'm5',
        user: 'roman',
        time: '11:40',
        text: 'Polish week summary: spacing on case studies, lighter images on the blog, and the contact form now survives slow networks.',
        reactions: { '👏': 4, '🔥': 2 },
      },
      { id: 'm6', user: 'alice', time: '12:15', text: 'Marketing asks for the careers page before the hiring campaign. Can we fit it this sprint?' },
      { id: 'm7', user: 'denis', time: '12:22', text: 'I can take the API for vacancies, @roman takes the page?', reactions: { '✅': 2 } },
    ],
  },
  {
    id: 'mad-radiator',
    kind: 'channel',
    name: 'mad-radiator',
    topic: 'A TypeScript app that collects SEO and analytics data about a website and posts it here and to Telegram',
    unread: 1,
    messages: [
      { id: 'r0', user: 'emir', time: 'Fri 17:30', text: 'Telegram delivery works again, the bot token had expired.' },
      { id: 'r1', user: 'radiator', time: 'Mon 09:00', text: 'Weekly report is ready.', report: radiatorReport() },
      { id: 'r2', user: 'dmitry', time: 'Mon 09:08', text: 'Sessions up again, nice. Can it also flag pages that got slower week over week?' },
      {
        id: 'r3',
        user: 'roman',
        time: 'Mon 09:14',
        text: 'On it. Meanwhile anyone can ask for a fresh report: type /radiator run below.',
        reactions: { '👀': 2 },
        replies: [{ user: 'oleg', time: '09:20', text: 'I will add the previous week to the payload, so the diff is cheap.' }],
      },
    ],
  },
  {
    id: 'enji-ai',
    kind: 'channel',
    name: 'enji-ai',
    topic: 'Engineering analytics. I helped build the first version of the employee interface: Vue.js on the front, Python behind it',
    messages: [
      { id: 'e1', user: 'oleg', time: '14:20', text: 'The API for the employee dashboard is on staging.' },
      { id: 'e2', user: 'denis', time: '14:35', text: 'Auth works end to end, tokens refresh without a reload.' },
      {
        id: 'e3',
        user: 'roman',
        time: '16:55',
        text: 'First version of the employee view is up: profile, activity and standups.',
        reactions: { '🎉': 6 },
        replies: [
          { user: 'emir', time: '17:01', text: 'The empty states look right, nice.' },
          { user: 'oleg', time: '17:03', text: 'Standups endpoint is paginated now, so it should stay fast.' },
          { user: 'roman', time: '17:10', text: 'Switched to it, thanks.' },
        ],
      },
      { id: 'e4', user: 'alla', time: '18:02', text: 'Showed it to the first team today. They want a weekly summary per person next.', reactions: { '💪': 4 } },
    ],
  },
  {
    id: 'elcart',
    kind: 'channel',
    name: 'elcart',
    topic: '2018–2019: the landing page and the front end for Elcart mobile banking',
    messages: [
      { id: 'c1', user: 'alice', time: '2018', text: 'Kickoff notes are in the drive. Landing page first, then the app.' },
      { id: 'c2', user: 'roman', time: '2019', text: 'The landing page is live. Next: the front end of the app itself.', reactions: { '🎉': 5 } },
      { id: 'c3', user: 'oleg', time: '2019', text: 'Card limits API is ready for you, docs in the repo.' },
      { id: 'c4', user: 'roman', time: '2019', text: 'Limits screen is done, with a clear error for every rule the bank has.' },
    ],
  },
  {
    id: 'itc-team',
    kind: 'channel',
    name: 'itc-team',
    topic: 'The small team I lead',
    messages: [
      { id: 't1', user: 'emir', time: '09:31', text: 'Yesterday: finished the form validation. Today: tests for it.' },
      { id: 't2', user: 'denis', time: '09:33', text: 'Yesterday: the vacancies API. Today: pagination and filters.' },
      { id: 't3', user: 'roman', time: '09:40', text: '@emir nice. Ping me when the PR is ready. @denis let us agree on the filter names before you write them.', reactions: { '👍': 2 } },
      { id: 't4', user: 'oleg', time: '09:52', text: 'Heads-up: staging database restarts at 13:00, five minutes.' },
      { id: 't5', user: 'roman', time: '15:10', text: 'Retro on Friday. Bring one thing to keep and one thing to stop.' },
    ],
  },
  {
    id: 'internship',
    kind: 'channel',
    name: 'internship',
    topic: 'Mentorship and internships',
    messages: [
      { id: 'i1', user: 'roman', time: 'Tue 11:20', text: 'Week one plan: set up the project, read the code review guide, ship one small fix.' },
      { id: 'i2', user: 'roman', time: 'Tue 11:22', text: 'Ask early. A question after ten minutes of being stuck is better than a day of guessing.', reactions: { '🙏': 3, '💯': 2 } },
      { id: 'i3', user: 'emir', time: 'Wed 10:05', text: 'I pair with the interns on Wednesdays, bring your branches.' },
      { id: 'i4', user: 'roman', time: 'Fri 17:00', text: 'All three fixes are in production. Good first week.', reactions: { '🎉': 8 } },
    ],
  },
  {
    id: 'dm-alla',
    kind: 'dm',
    name: 'alla',
    topic: 'CTO',
    messages: [
      { id: 'l1', user: 'alla', time: 'Mon 18:10', text: 'Can you prepare the front-end part of the quarter review? Ten minutes, the numbers and one story.' },
      { id: 'l2', user: 'roman', time: 'Mon 18:25', text: 'Yes. The story will be the contact form: fewer lost leads after the fix.' },
    ],
    incoming: { id: 'l3', user: 'alla', time: 'Mon 18:26', text: 'Perfect, that is the one people remember.' },
  },
  {
    id: 'dm-alice',
    kind: 'dm',
    name: 'alice',
    topic: 'Delivery manager',
    unread: 1,
    messages: [
      { id: 'a1', user: 'alice', time: '12:40', text: 'The client moved the demo to Wednesday. Is the new dashboard safe to show?' },
      { id: 'a2', user: 'roman', time: '12:52', text: 'Yes, behind a flag. I will turn it on for the demo account only.' },
    ],
    incoming: { id: 'a3', user: 'alice', time: '12:53', text: 'Great, I will tell them it is a preview.' },
  },
  {
    id: 'dm-dmitry',
    kind: 'dm',
    name: 'dmitry',
    topic: 'Project manager',
    messages: [
      { id: 'd1', user: 'dmitry', time: '12:10', text: 'Can we ship the careers page this week?' },
      { id: 'd2', user: 'roman', time: '12:14', text: 'Yes, Thursday. Denis has the API ready on Wednesday.' },
    ],
    incoming: { id: 'd3', user: 'dmitry', time: '12:15', text: 'Perfect, I will tell the team.' },
  },
  {
    id: 'dm-oleg',
    kind: 'dm',
    name: 'oleg',
    topic: 'Back-end developer',
    messages: [
      { id: 'o1', user: 'oleg', time: '16:02', text: 'Do you need the case studies sorted by date or by weight?' },
      { id: 'o2', user: 'roman', time: '16:05', text: 'By weight, with date as the tie-breaker. Marketing picks the weight.' },
      { id: 'o3', user: 'oleg', time: '16:30', text: 'Done, it is on staging.', reactions: { '🙏': 1 } },
    ],
  },
  {
    id: 'dm-emir',
    kind: 'dm',
    name: 'emir',
    topic: 'Front-end and back-end developer',
    messages: [
      { id: 'x1', user: 'emir', time: '15:02', text: 'Could you look at my PR when you have a minute?' },
      { id: 'x2', user: 'roman', time: '15:30', text: 'Left a few comments. Mostly naming, the logic is good.' },
    ],
    incoming: { id: 'x3', user: 'emir', time: '15:48', text: 'Fixed them all. Merging after the pipeline is green.' },
  },
  {
    id: 'dm-denis',
    kind: 'dm',
    name: 'denis',
    topic: 'Front-end and back-end developer',
    messages: [
      { id: 'n1', user: 'denis', time: '11:12', text: 'For vacancies: filters as query params or a POST body?' },
      { id: 'n2', user: 'roman', time: '11:15', text: 'Query params, so a filtered list has a link people can share.' },
      { id: 'n3', user: 'denis', time: '11:16', text: 'Makes sense 👍' },
    ],
  },
];
