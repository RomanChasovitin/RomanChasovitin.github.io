export type IconName =
  | 'typescript'
  | 'react'
  | 'nextjs'
  | 'vue'
  | 'angular'
  | 'node'
  | 'python'
  | 'go'
  | 'exparte'
  | 'maddevs'
  | 'bilebile'
  | 'teacherly'
  | 'chocolife'
  | 'besmart'
  | 'github'
  | 'linkedin'
  | 'telegram'
  | 'email';

export type Mention = { label: string; href: string; icon: IconName };

const tech = {
  typescript: { label: 'TypeScript', href: 'https://www.typescriptlang.org', icon: 'typescript' },
  react: { label: 'React', href: 'https://react.dev', icon: 'react' },
  nextjs: { label: 'Next.js', href: 'https://nextjs.org', icon: 'nextjs' },
  vue: { label: 'Vue.js', href: 'https://vuejs.org', icon: 'vue' },
  angular: { label: 'Angular', href: 'https://angular.dev', icon: 'angular' },
  node: { label: 'Node.js', href: 'https://nodejs.org', icon: 'node' },
  python: { label: 'Python', href: 'https://www.python.org', icon: 'python' },
  go: { label: 'Go', href: 'https://go.dev', icon: 'go' },
} satisfies Record<string, Mention>;

// Closed products link to their own screen on this page.
const company = {
  exparte: { label: 'Ex Parte', href: 'https://exparte.com', icon: 'exparte' },
  maddevs: { label: 'Mad Devs', href: 'https://maddevs.io', icon: 'maddevs' },
  bilebile: { label: 'bile-bile.kz', href: '#bilebile', icon: 'bilebile' },
  teacherly: { label: 'Teacherly', href: '#teacherly', icon: 'teacherly' },
  chocolife: { label: 'Chocolife', href: 'https://chocolife.me', icon: 'chocolife' },
  besmart: { label: 'BeSmart', href: '#chocolife', icon: 'besmart' },
} satisfies Record<string, Mention>;

export const profile = {
  name: 'Roman Chas',
  headline: 'Full-stack TypeScript engineer',
  about: [
    'Full-stack ',
    tech.typescript,
    ' engineer at ',
    company.maddevs,
    '. Since 2018 I have built front ends and back ends with ',
    tech.react,
    ', ',
    tech.nextjs,
    ', ',
    tech.vue,
    ', ',
    tech.angular,
    ', ',
    tech.node,
    ', ',
    tech.python,
    ' and ',
    tech.go,
    ': legal tech at ',
    company.exparte,
    ', train travel at ',
    company.bilebile,
    ', online education at ',
    company.teacherly,
    ', coupon marketplaces at ',
    company.chocolife,
    ' and ',
    company.besmart,
    '.',
  ] as (string | Mention)[],
  now: company.exparte as Mention,
  // TODO: real links.
  contacts: [
    { label: 'GitHub', href: '#', icon: 'github' },
    { label: 'LinkedIn', href: '#', icon: 'linkedin' },
    { label: 'Telegram', href: '#', icon: 'telegram' },
    { label: 'Email', href: '#', icon: 'email' },
  ] as Mention[],
};
