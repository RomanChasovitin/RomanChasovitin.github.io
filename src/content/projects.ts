/** Month in `YYYY-MM` form. */
type Month = `${number}-${number}`;

export type Period = { start: Month; end: Month | null };

export type Role = { title: string; period: Period };

export type ProjectId = 'exparte' | 'maddevs' | 'bilebile' | 'teacherly' | 'chocolife';

export type Project = {
  id: ProjectId;
  name: string;
  company?: string;
  /** `null` when the product is closed. */
  url: string | null;
  /** Latest role first. */
  roles: Role[];
  /** Key technologies, most important first. The hero shows all of them, so keep it to about seven. */
  stack: string[];
  /** One sentence for the hero strip. */
  summary: string;
  highlights: string[];
};

/** Screen order of the site. */
export const projects: Project[] = [
  {
    id: 'exparte',
    name: 'Ex Parte',
    url: 'https://exparte.com',
    roles: [{ title: 'Lead Full-Stack Engineer', period: { start: '2022-05', end: null } }],
    stack: ['Next.js', 'TypeScript', 'Databricks', 'Azure', 'n8n', 'Python', 'Go'],
    summary:
      'Litigation intelligence for patent lawyers. I keep its B2B portal running and growing, from the interface down to the data.',
    highlights: [
      'Maintain and grow the B2B portal, front end and back end',
      'Back end on Databricks, Azure databases and auth, and n8n',
      'AI microservices in Python and TypeScript',
      'Classic microservices in Go, Python and TypeScript',
      'Work deep in the business side of patent litigation',
    ],
  },
  {
    id: 'maddevs',
    name: 'Mad Devs',
    url: 'https://maddevs.io',
    roles: [
      { title: 'Lead Front-End Developer', period: { start: '2021-04', end: null } },
      { title: 'Middle Front-End Developer', period: { start: '2019-11', end: '2021-04' } },
      { title: 'Front-End Developer, part-time', period: { start: '2018-09', end: '2019-06' } },
    ],
    stack: ['Vue.js', 'Node.js', 'Express', 'PostgreSQL', 'TypeScript', 'Python'],
    summary:
      'My home company since 2018. The maddevs.io site, mad-radiator, the first enji.ai interface, and a small team to lead.',
    highlights: [
      'maddevs.io: a year of polish and feature releases (Vue.js, Node.js with Express, PostgreSQL)',
      'mad-radiator: collects SEO and analytics data about a website and posts reports to Slack or Telegram (TypeScript)',
      'enji.ai: helped build the first version of the employee interface (Vue.js front end, Python back end)',
      'Elcart: landing page and front end for a mobile banking app',
      'Lead of the small ITC team',
      'Mentorship and internships',
    ],
  },
  {
    id: 'bilebile',
    name: 'bile-bile.kz',
    url: null,
    roles: [{ title: 'Main Front-End Developer', period: { start: '2021-09', end: '2022-05' } }],
    stack: ['React', 'Next.js', 'Python'],
    summary:
      'Private train travel across Kazakhstan. I built the front end from scratch, seat map and checkout included.',
    highlights: [
      'Built the front end from scratch',
      'Interactive seat selection in the train car, wired to the back end',
      'Complex checkout forms and billing integration',
      'Tests and fault tolerance for high traffic',
    ],
  },
  {
    id: 'teacherly',
    name: 'Teacherly',
    url: null,
    roles: [{ title: 'Front-End Maintainer', period: { start: '2019-11', end: '2021-02' } }],
    stack: ['React', 'Redux', 'RxJS', 'SCSS', 'Jest', 'GitLab CI', 'Docker Compose'],
    summary:
      'A British ed-tech startup. I maintained the app, redesigned it, added video lessons and led five front-end developers.',
    highlights: [
      'Redesigned the whole app',
      'Added video conferencing at the 2020 peak',
      'Improved creating and editing interactive lessons',
      'Led up to five front-end developers',
      'Unit tests with Jest and Enzyme; deployment with GitLab CI and Docker Compose',
    ],
  },
  {
    id: 'chocolife',
    name: 'Chocolife & BeSmart',
    company: 'Chocofamily Holding',
    url: 'https://chocolife.me',
    roles: [{ title: 'Front-End Developer', period: { start: '2018-06', end: '2019-11' } }],
    stack: ['Angular 2+', 'TypeScript', 'RxJS', 'React', 'MobX', 'GraphQL', 'Jest'],
    summary:
      'Coupon marketplaces in Kazakhstan and Kyrgyzstan. My first projects: legacy code, an Angular rewrite and a lot of tests.',
    highlights: [
      'BeSmart.kz and BeSmart.kg shared one code base; later everything moved to Chocolife',
      'Supported the legacy code base',
      'Rewrote the project from scratch on Angular 2+',
      'Wrote tests with Karma, Jasmine, Jest and Enzyme',
      'Built responsive pages and email templates from Figma and Zeplin designs',
      'Mocked the back end with json-server for local development',
      'Built an app with React, MobX and GraphQL (Apollo Client)',
    ],
  },
];

/** `2019–2021`, `2022–now`. */
export function formatYears({ start, end }: Period): string {
  const from = start.slice(0, 4);
  const to = end ? end.slice(0, 4) : 'now';
  return from === to ? from : `${from}–${to}`;
}
