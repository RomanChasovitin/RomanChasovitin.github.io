// The entity graph of the Ex Parte screen: the litigation record around a matter, plus the systems
// I work on. Five nodes carry findings; the agent reaches each one along a fixed path from the matter.

export type NodeKind = 'matter' | 'finding' | 'tech' | 'entity';

export type GraphNode = { id: string; label: string; kind: NodeKind };

export type Finding = {
  /** Id of the node the finding sits on. */
  id: string;
  title: string;
  body: string;
  stack: string[];
  /** The agent's route from the matter, node by node. Consecutive ids must be linked. */
  path: string[];
};

export const findings: Finding[] = [
  {
    id: 'portal',
    title: 'The Front Door',
    body: 'Lawyers reach Ex Parte through its B2B portal. I maintain and improve it every day, on the front end and the back end.',
    stack: ['Next.js', 'TypeScript'],
    path: ['matter', 'firm-1', 'portal'],
  },
  {
    id: 'databricks',
    title: 'The Deep Record',
    body: 'The back end reads from Databricks. Working on the portal means knowing the data model as well as the screens.',
    stack: ['Databricks'],
    path: ['matter', 'filing-1', 'patent-1', 'examiner-1', 'databricks'],
  },
  {
    id: 'ai',
    title: 'The Agents',
    body: 'Part of the back end is a set of AI microservices in Python and TypeScript, next to the classic services.',
    stack: ['Python', 'TypeScript'],
    path: ['matter', 'portal', 'ai'],
  },
  {
    id: 'services',
    title: 'The Plumbing',
    body: 'Classic microservices in Go, Python and TypeScript, n8n workflows, and Azure for databases and sign-in. Full stack here means all of it.',
    stack: ['Go', 'Python', 'TypeScript', 'n8n', 'Azure'],
    path: ['matter', 'portal', 'azure-auth', 'azure', 'services'],
  },
  {
    id: 'business',
    title: 'The Business Side',
    body: 'I work deep in the business side of patent litigation: how examiners, judges, patents and filings shape the result of a case.',
    stack: [],
    path: ['matter', 'filing-2', 'judge-2', 'business'],
  },
];

const core: GraphNode[] = [
  { id: 'matter', label: 'Matter: Roman Chas', kind: 'matter' },
  { id: 'portal', label: 'B2B portal', kind: 'finding' },
  { id: 'databricks', label: 'Databricks', kind: 'finding' },
  { id: 'ai', label: 'AI microservices', kind: 'finding' },
  { id: 'services', label: 'Microservices', kind: 'finding' },
  { id: 'business', label: 'Patent litigation', kind: 'finding' },
  { id: 'nextjs', label: 'Next.js', kind: 'tech' },
  { id: 'typescript', label: 'TypeScript', kind: 'tech' },
  { id: 'python', label: 'Python', kind: 'tech' },
  { id: 'go', label: 'Go', kind: 'tech' },
  { id: 'n8n', label: 'n8n', kind: 'tech' },
  { id: 'azure', label: 'Azure', kind: 'tech' },
  { id: 'azure-db', label: 'Azure database', kind: 'tech' },
  { id: 'azure-auth', label: 'Azure auth', kind: 'tech' },
];

// Generic record entities. No real patent numbers or names: those would point at real cases.
const ENTITY_COUNTS = [
  ['patent', 'Patent', 11],
  ['examiner', 'Examiner', 5],
  ['judge', 'Judge', 4],
  ['filing', 'Filing', 10],
  ['ptab', 'PTAB proceeding', 3],
  ['firm', 'Law firm', 4],
  ['party', 'Party', 6],
  ['action', 'Office action', 8],
  ['art', 'Prior art', 8],
  ['claim', 'Claim', 6],
  ['court', 'Court', 2],
  ['expert', 'Expert', 2],
] as const;

const entities: GraphNode[] = ENTITY_COUNTS.flatMap(([prefix, label, count]) =>
  Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index + 1}`, label, kind: 'entity' as const })),
);

export const nodes: GraphNode[] = [...core, ...entities];

const cycle = (prefix: string, index: number, size: number) => `${prefix}-${(index % size) + 1}`;

// Deterministic, so the graph is the same on every load.
let seed = 3;
const random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = (prefix: string, size: number) => `${prefix}-${Math.floor(random() * size) + 1}`;

const recordLinks: [string, string][] = [];
for (let i = 0; i < 11; i++) {
  const patent = `patent-${i + 1}`;
  recordLinks.push([patent, cycle('examiner', i, 5)], [patent, cycle('action', i, 8)], [patent, pick('art', 8)]);
  if (i < 6) recordLinks.push([patent, `claim-${i + 1}`]);
}
for (let i = 0; i < 8; i++) recordLinks.push([`action-${i + 1}`, cycle('art', i, 8)]);
for (let i = 0; i < 6; i++) recordLinks.push([`claim-${i + 1}`, cycle('art', i * 2 + 1, 8)]);
for (let i = 0; i < 10; i++) {
  const filing = `filing-${i + 1}`;
  recordLinks.push([filing, cycle('patent', i, 11)], [filing, cycle('judge', i, 4)], [filing, cycle('party', i, 6)]);
  recordLinks.push([filing, cycle('court', i, 2)]);
  if (i % 3 === 0) recordLinks.push([filing, cycle('patent', i * 7 + 3, 11)]);
}
for (let i = 0; i < 6; i++) recordLinks.push([`party-${i + 1}`, cycle('firm', i, 4)]);
for (let i = 0; i < 3; i++) {
  const ptab = `ptab-${i + 1}`;
  recordLinks.push([ptab, cycle('patent', i * 4 + 1, 11)], [ptab, cycle('judge', i + 2, 4)], [ptab, cycle('party', i, 6)]);
}
for (let i = 0; i < 2; i++) recordLinks.push([`expert-${i + 1}`, cycle('filing', i * 4, 10)], [`expert-${i + 1}`, cycle('art', i * 3, 8)]);
// Patents cite each other.
for (let i = 0; i < 8; i++) recordLinks.push([pick('patent', 11), pick('patent', 11)]);

export const links: [string, string][] = [
  ['matter', 'firm-1'],
  ['matter', 'filing-1'],
  ['matter', 'filing-2'],
  ['matter', 'portal'],
  ['firm-1', 'portal'],
  ['portal', 'nextjs'],
  ['portal', 'typescript'],
  ['portal', 'databricks'],
  ['portal', 'ai'],
  ['portal', 'azure-auth'],
  ['nextjs', 'typescript'],
  ['ai', 'python'],
  ['ai', 'typescript'],
  ['ai', 'databricks'],
  ['services', 'go'],
  ['services', 'python'],
  ['services', 'typescript'],
  ['services', 'n8n'],
  ['services', 'azure'],
  ['services', 'databricks'],
  ['azure', 'azure-db'],
  ['azure', 'azure-auth'],
  ...['examiner-1', 'patent-4', 'filing-5', 'ptab-2', 'action-3', 'claim-6'].map(
    (id) => ['databricks', id] as [string, string],
  ),
  ...['judge-2', 'examiner-2', 'patent-3', 'ptab-1', 'court-2', 'firm-3'].map(
    (id) => ['business', id] as [string, string],
  ),
  // Self-links and duplicates from the random picks are dropped.
  ...recordLinks.filter(([a, b], index) => a !== b && recordLinks.findIndex(([c, d]) => (c === a && d === b) || (c === b && d === a)) === index),
];
