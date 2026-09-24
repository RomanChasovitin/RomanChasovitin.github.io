// The record behind the Ex Parte screen: one patent case and the companies, lawyers, judges and experts
// around it, the three intelligence reports on its lead patent, and what the assistant says about it.
// Every name, number and date is made up, and the portal says so: real ones would point at real cases
// and real people.
//
// Text in documents and answers links with [[kind:id|Label]] and cites a context item with [n].
import { projects } from '../../content/projects';

export type Court = 'DCT' | 'PTAB' | 'CAFC' | 'ITC';
export type Kind = 'case' | 'patent' | 'party' | 'firm' | 'attorney' | 'judge' | 'expert' | 'engineer';
export type Ref = { kind: Kind; id: string };
export type Trend = 'up' | 'down' | 'flat';
export type Rating = { level: string; grade: string; trend: Trend };

export type Party = {
  name: string;
  type: 'Operating Company' | 'NPE';
  totalCases: number;
  activeCases: number;
  patents: number;
  courts: string[];
  ratings: [Court, Rating][];
  firms: { firm: string; cases: number; winRate: number }[];
};

export type Firm = {
  name: string;
  cases: number;
  winRate: number;
  courts: string[];
  clients: { party: string; cases: number }[];
  experts: { expert: string; cases: number }[];
};

export type Attorney = { name: string; firm: string; rating: Rating; cases: number; courts: string[] };

export type Judge = {
  name: string;
  role: string;
  court: string;
  cases: number;
  poWinRate: number;
  timeToTrial: string;
  markman: string;
  firms: { firm: string; cases: number; winRate: number }[];
};

export type Expert = {
  name: string;
  focus: string;
  cases: number;
  challenger: number;
  patentOwner: number;
  npe: number;
  survival: string;
  credentials: [label: string, type: string][];
  challenges: { challenged: number; excluded: number; survived: number };
  summary: string;
  tags: string[];
  onBehalf: { party: string; cases: number; exposure: number }[];
  against: { party: string; cases: number; exposure: number }[];
};

export type Patent = {
  number: string;
  title: string;
  assignee: string;
  artUnit: string;
  filed: string;
  issued: string;
  expires: string;
  examiner: string;
};

export type Side = { party: string; firm: string; attorneys: string[] };

export type Case = {
  court: Court;
  number: string;
  caption: string;
  jurisdiction: string;
  filed: string;
  status: 'Open' | 'Closed';
  keyEvent: string;
  eventDate: string;
  cause: string;
  sector: string;
  judge: string;
  magistrate?: string;
  plaintiff: Side;
  defendant: Side;
  patents: string[];
  experts: { expert: string; side: 'Plaintiff' | 'Defendant' }[];
};

const up: Trend = 'up';
const down: Trend = 'down';
const flat: Trend = 'flat';

export const parties: Record<string, Party> = {
  northwind: {
    name: 'Northwind Acoustics LLC',
    type: 'NPE',
    totalCases: 31,
    activeCases: 4,
    patents: 57,
    courts: ['E.D. Texas', 'W.D. Texas'],
    ratings: [
      ['DCT', { level: 'L3', grade: 'B', trend: up }],
      ['PTAB', { level: 'L2', grade: 'C', trend: flat }],
    ],
    firms: [
      { firm: 'halvorsen', cases: 22, winRate: 64 },
      { firm: 'marsh', cases: 6, winRate: 50 },
    ],
  },
  kestrel: {
    name: 'Kestrel Devices Inc.',
    type: 'Operating Company',
    totalCases: 418,
    activeCases: 37,
    patents: 6210,
    courts: ['E.D. Texas', 'N.D. California', 'D. Delaware'],
    ratings: [
      ['DCT', { level: 'L5', grade: 'A', trend: flat }],
      ['PTAB', { level: 'L5', grade: 'A', trend: up }],
      ['CAFC', { level: 'L4', grade: 'B', trend: flat }],
    ],
    firms: [
      { firm: 'crane', cases: 96, winRate: 71 },
      { firm: 'marsh', cases: 41, winRate: 58 },
      { firm: 'halvorsen', cases: 12, winRate: 50 },
    ],
  },
  orbis: {
    name: 'Orbis Mobile Corp.',
    type: 'Operating Company',
    totalCases: 263,
    activeCases: 19,
    patents: 3874,
    courts: ['E.D. Texas', 'D. Delaware'],
    ratings: [
      ['DCT', { level: 'L4', grade: 'A', trend: up }],
      ['PTAB', { level: 'L4', grade: 'B', trend: flat }],
    ],
    firms: [
      { firm: 'marsh', cases: 58, winRate: 62 },
      { firm: 'crane', cases: 17, winRate: 65 },
    ],
  },
  lumen: {
    name: 'Lumen Wireless Ltd',
    type: 'Operating Company',
    totalCases: 94,
    activeCases: 6,
    patents: 1422,
    courts: ['W.D. Texas', 'E.D. Texas'],
    ratings: [
      ['DCT', { level: 'L4', grade: 'B', trend: down }],
      ['PTAB', { level: 'L3', grade: 'B', trend: flat }],
    ],
    firms: [
      { firm: 'halvorsen', cases: 18, winRate: 56 },
      { firm: 'marsh', cases: 9, winRate: 44 },
    ],
  },
};

export const firms: Record<string, Firm> = {
  halvorsen: {
    name: 'Halvorsen & Pike LLP',
    cases: 388,
    winRate: 61,
    courts: ['E.D. Texas', 'W.D. Texas', 'PTAB'],
    clients: [
      { party: 'northwind', cases: 22 },
      { party: 'lumen', cases: 18 },
      { party: 'kestrel', cases: 12 },
    ],
    experts: [
      { expert: 'varga', cases: 14 },
      { expert: 'reyes', cases: 9 },
    ],
  },
  crane: {
    name: 'Crane Whitfield LLP',
    cases: 702,
    winRate: 68,
    courts: ['E.D. Texas', 'N.D. California', 'PTAB', 'CAFC'],
    clients: [
      { party: 'kestrel', cases: 96 },
      { party: 'orbis', cases: 17 },
    ],
    experts: [
      { expert: 'hartmann', cases: 21 },
      { expert: 'nakamura', cases: 11 },
      { expert: 'reyes', cases: 4 },
    ],
  },
  marsh: {
    name: 'Marsh Lindqvist LLP',
    cases: 451,
    winRate: 57,
    courts: ['D. Delaware', 'E.D. Texas', 'PTAB'],
    clients: [
      { party: 'orbis', cases: 58 },
      { party: 'kestrel', cases: 41 },
      { party: 'lumen', cases: 9 },
    ],
    experts: [
      { expert: 'nakamura', cases: 7 },
      { expert: 'hartmann', cases: 5 },
    ],
  },
};

export const attorneys: Record<string, Attorney> = {
  morrow: { name: 'Daniel K. Morrow', firm: 'halvorsen', rating: { level: 'L5', grade: 'A', trend: up }, cases: 146, courts: ['E.D. Texas', 'W.D. Texas'] },
  ito: { name: 'Keiko Ito', firm: 'halvorsen', rating: { level: 'L4', grade: 'B', trend: up }, cases: 73, courts: ['E.D. Texas', 'PTAB'] },
  bellamy: { name: 'Sarah J. Bellamy', firm: 'crane', rating: { level: 'L5', grade: 'A', trend: flat }, cases: 211, courts: ['E.D. Texas', 'N.D. California', 'CAFC'] },
  okonkwo: { name: 'Chidi Okonkwo', firm: 'crane', rating: { level: 'L4', grade: 'A', trend: up }, cases: 88, courts: ['E.D. Texas', 'PTAB'] },
  fenwick: { name: 'Thomas Fenwick', firm: 'marsh', rating: { level: 'L4', grade: 'B', trend: down }, cases: 120, courts: ['D. Delaware', 'E.D. Texas'] },
};

export const judges: Record<string, Judge> = {
  thorne: {
    name: 'Margaret A. Thorne',
    role: 'District Judge',
    court: 'E.D. Texas',
    cases: 612,
    poWinRate: 58,
    timeToTrial: '24 months',
    markman: '14 months after the first conference',
    firms: [
      { firm: 'crane', cases: 48, winRate: 69 },
      { firm: 'halvorsen', cases: 41, winRate: 63 },
      { firm: 'marsh', cases: 22, winRate: 55 },
    ],
  },
  alvarez: {
    name: 'Ruben Alvarez',
    role: 'Magistrate Judge',
    court: 'E.D. Texas',
    cases: 289,
    poWinRate: 54,
    timeToTrial: 'n/a',
    markman: 'Handles discovery disputes',
    firms: [
      { firm: 'halvorsen', cases: 19, winRate: 58 },
      { firm: 'crane', cases: 17, winRate: 65 },
    ],
  },
  castillo: {
    name: 'Victor Castillo',
    role: 'District Judge',
    court: 'W.D. Texas',
    cases: 431,
    poWinRate: 61,
    timeToTrial: '22 months',
    markman: '9 months after the first conference',
    firms: [
      { firm: 'halvorsen', cases: 27, winRate: 59 },
      { firm: 'crane', cases: 25, winRate: 64 },
    ],
  },
  brennan: {
    name: 'Claire Brennan',
    role: 'District Judge',
    court: 'D. Delaware',
    cases: 358,
    poWinRate: 47,
    timeToTrial: '30 months',
    markman: '12 months after the scheduling order',
    firms: [
      { firm: 'marsh', cases: 31, winRate: 58 },
      { firm: 'crane', cases: 19, winRate: 63 },
    ],
  },
  hollis: {
    name: 'Linda Hollis',
    role: 'Administrative Patent Judge',
    court: 'PTAB',
    cases: 174,
    poWinRate: 41,
    timeToTrial: '18 months to a final decision',
    markman: 'Institutes 63% of petitions',
    firms: [
      { firm: 'crane', cases: 23, winRate: 70 },
      { firm: 'marsh', cases: 12, winRate: 58 },
    ],
  },
};

export const experts: Record<string, Expert> = {
  varga: {
    name: 'Dr. Elena Varga',
    focus: 'Audio signal processing',
    cases: 86,
    challenger: 38,
    patentOwner: 62,
    npe: 41,
    survival: '92% of challenges',
    credentials: [
      ['Ph.D.', 'University'],
      ['AES Fellow', 'Membership'],
    ],
    challenges: { challenged: 12, excluded: 1, survived: 11 },
    summary:
      'Designed adaptive filters for hearing aids and consumer earbuds for fifteen years before consulting. Testifies on acoustics, active noise cancellation and audio codecs.',
    tags: ['Audio DSP', 'Crosstalk cancellation', 'Active noise cancellation', 'Beamforming', 'MEMS microphones', 'Psychoacoustics', 'Bluetooth LE Audio', 'Hearing aids'],
    onBehalf: [
      { party: 'northwind', cases: 9, exposure: 10 },
      { party: 'lumen', cases: 6, exposure: 7 },
    ],
    against: [
      { party: 'kestrel', cases: 7, exposure: 8 },
      { party: 'orbis', cases: 5, exposure: 6 },
    ],
  },
  hartmann: {
    name: 'Dr. Paul Hartmann',
    focus: 'Wireless and Bluetooth',
    cases: 142,
    challenger: 71,
    patentOwner: 29,
    npe: 18,
    survival: 'Never excluded',
    credentials: [
      ['D.Sc.', 'University'],
      ['IEEE Senior Member', 'Membership'],
    ],
    challenges: { challenged: 5, excluded: 0, survived: 5 },
    summary:
      'Worked on Bluetooth radios and audio profiles for twenty years. Mostly retained by accused infringers on validity and non-infringement.',
    tags: ['Bluetooth', 'LE Audio', 'Wi-Fi', 'RF front ends', 'Audio codecs', 'Latency'],
    onBehalf: [
      { party: 'kestrel', cases: 14, exposure: 10 },
      { party: 'orbis', cases: 8, exposure: 6 },
    ],
    against: [
      { party: 'northwind', cases: 6, exposure: 19 },
      { party: 'lumen', cases: 4, exposure: 4 },
    ],
  },
  nakamura: {
    name: 'Dr. Aiko Nakamura',
    focus: 'Acoustics and transducers',
    cases: 47,
    challenger: 64,
    patentOwner: 36,
    npe: 22,
    survival: 'No merits ruling yet',
    credentials: [['Ph.D.', 'University']],
    challenges: { challenged: 3, excluded: 0, survived: 3 },
    summary: 'Professor of acoustics. Testifies on speaker and microphone design and on fit and seal of in-ear devices.',
    tags: ['Transducers', 'In-ear fit', 'Acoustic leakage', 'MEMS microphones'],
    onBehalf: [
      { party: 'kestrel', cases: 5, exposure: 4 },
      { party: 'orbis', cases: 4, exposure: 3 },
    ],
    against: [{ party: 'lumen', cases: 3, exposure: 3 }],
  },
  reyes: {
    name: 'Dr. Miguel Reyes',
    focus: 'Damages and royalties',
    cases: 118,
    challenger: 45,
    patentOwner: 55,
    npe: 37,
    survival: '81% of challenges',
    credentials: [
      ['Ph.D.', 'University'],
      ['CFA', 'Certification'],
    ],
    challenges: { challenged: 16, excluded: 3, survived: 13 },
    summary: 'Economist. Builds reasonable-royalty models for consumer electronics.',
    tags: ['Reasonable royalty', 'Apportionment', 'Lost profits', 'Consumer electronics'],
    onBehalf: [
      { party: 'northwind', cases: 5, exposure: 6 },
      { party: 'kestrel', cases: 4, exposure: 3 },
    ],
    against: [{ party: 'orbis', cases: 6, exposure: 5 }],
  },
};

export const patents: Record<string, Patent> = {
  crosstalk: {
    number: 'US 13,104,287 B2',
    title: 'Adaptive crosstalk cancellation for wireless earbuds',
    assignee: 'northwind',
    artUnit: '2654 Speech Signal Processing',
    filed: '03/03/21',
    issued: '10/22/24',
    expires: '03/03/41',
    examiner: 'Alan Whitcombe',
  },
  wear: {
    number: 'US 13,068,114 B2',
    title: 'Wear detection for in-ear audio devices',
    assignee: 'northwind',
    artUnit: '2651 Audio Devices',
    filed: '07/19/20',
    issued: '05/07/24',
    expires: '07/19/40',
    examiner: 'Priya Chandran',
  },
  sync: {
    number: 'US 13,021,776 B1',
    title: 'Low-latency audio sync over Bluetooth LE',
    assignee: 'northwind',
    artUnit: '2648 Wireless Communication',
    filed: '11/02/20',
    issued: '01/16/24',
    expires: '11/02/40',
    examiner: 'Marcus Vell',
  },
};

export const cases: Record<string, Case> = {
  kestrel: {
    court: 'DCT',
    number: '2:26-cv-04817',
    caption: 'Northwind Acoustics LLC v. Kestrel Devices Inc.',
    jurisdiction: 'E.D. Texas',
    filed: '06/02/26',
    status: 'Open',
    keyEvent: 'Stipulation to extend time',
    eventDate: '09/11/26',
    cause: 'Infringement',
    sector: 'Consumer Electronics',
    judge: 'thorne',
    magistrate: 'alvarez',
    plaintiff: { party: 'northwind', firm: 'halvorsen', attorneys: ['morrow', 'ito'] },
    defendant: { party: 'kestrel', firm: 'crane', attorneys: ['bellamy', 'okonkwo'] },
    patents: ['crosstalk', 'wear', 'sync'],
    experts: [],
  },
  orbis: {
    court: 'DCT',
    number: '2:26-cv-04818',
    caption: 'Northwind Acoustics LLC v. Orbis Mobile Corp.',
    jurisdiction: 'E.D. Texas',
    filed: '06/02/26',
    status: 'Open',
    keyEvent: 'Answer',
    eventDate: '08/28/26',
    cause: 'Infringement',
    sector: 'Consumer Electronics',
    judge: 'thorne',
    magistrate: 'alvarez',
    plaintiff: { party: 'northwind', firm: 'halvorsen', attorneys: ['morrow'] },
    defendant: { party: 'orbis', firm: 'marsh', attorneys: ['fenwick'] },
    patents: ['crosstalk', 'wear'],
    experts: [],
  },
  ipr: {
    court: 'PTAB',
    number: 'IPR2026-00731',
    caption: 'Kestrel Devices Inc. v. Northwind Acoustics LLC',
    jurisdiction: 'PTAB',
    filed: '08/14/26',
    status: 'Open',
    keyEvent: 'Petition filed',
    eventDate: '08/14/26',
    cause: 'Inter Partes Review',
    sector: 'Consumer Electronics',
    judge: 'hollis',
    plaintiff: { party: 'kestrel', firm: 'crane', attorneys: ['okonkwo'] },
    defendant: { party: 'northwind', firm: 'halvorsen', attorneys: ['ito'] },
    patents: ['crosstalk'],
    experts: [{ expert: 'hartmann', side: 'Plaintiff' }],
  },
  lumen: {
    court: 'DCT',
    number: '6:25-cv-00310',
    caption: 'Lumen Wireless Ltd v. Kestrel Devices Inc.',
    jurisdiction: 'W.D. Texas',
    filed: '04/09/25',
    status: 'Open',
    keyEvent: 'Markman order',
    eventDate: '07/30/26',
    cause: 'Infringement',
    sector: 'Consumer Electronics',
    judge: 'castillo',
    plaintiff: { party: 'lumen', firm: 'halvorsen', attorneys: ['morrow'] },
    defendant: { party: 'kestrel', firm: 'crane', attorneys: ['bellamy'] },
    patents: [],
    experts: [
      { expert: 'varga', side: 'Plaintiff' },
      { expert: 'nakamura', side: 'Defendant' },
      { expert: 'hartmann', side: 'Defendant' },
    ],
  },
  earlier: {
    court: 'DCT',
    number: '2:24-cv-01163',
    caption: 'Northwind Acoustics LLC v. Kestrel Devices Inc.',
    jurisdiction: 'E.D. Texas',
    filed: '02/12/24',
    status: 'Closed',
    keyEvent: 'Settled',
    eventDate: '11/05/25',
    cause: 'Infringement',
    sector: 'Consumer Electronics',
    judge: 'thorne',
    magistrate: 'alvarez',
    plaintiff: { party: 'northwind', firm: 'halvorsen', attorneys: ['morrow', 'ito'] },
    defendant: { party: 'kestrel', firm: 'crane', attorneys: ['bellamy'] },
    patents: ['wear'],
    experts: [
      { expert: 'varga', side: 'Plaintiff' },
      { expert: 'hartmann', side: 'Defendant' },
      { expert: 'reyes', side: 'Plaintiff' },
    ],
  },
  orbislumen: {
    court: 'DCT',
    number: '1:25-cv-00922',
    caption: 'Orbis Mobile Corp. v. Lumen Wireless Ltd',
    jurisdiction: 'D. Delaware',
    filed: '08/21/25',
    status: 'Open',
    keyEvent: 'Scheduling order',
    eventDate: '01/15/26',
    cause: 'Infringement',
    sector: 'Communications',
    judge: 'brennan',
    plaintiff: { party: 'orbis', firm: 'marsh', attorneys: ['fenwick'] },
    defendant: { party: 'lumen', firm: 'halvorsen', attorneys: ['ito'] },
    patents: [],
    experts: [
      { expert: 'nakamura', side: 'Plaintiff' },
      { expert: 'reyes', side: 'Defendant' },
    ],
  },
};

/** The case of the assistant and the patent of the intelligence reports. */
export const MAIN_CASE = 'kestrel';
export const MAIN_PATENT = 'crosstalk';

export const name = (ref: Ref): string => {
  switch (ref.kind) {
    case 'case':
      return cases[ref.id].caption;
    case 'patent':
      return patents[ref.id].number;
    case 'party':
      return parties[ref.id].name;
    case 'firm':
      return firms[ref.id].name;
    case 'attorney':
      return attorneys[ref.id].name;
    case 'judge':
      return judges[ref.id].name;
    case 'expert':
      return experts[ref.id].name;
    case 'engineer':
      return engineer.name;
  }
};

/** Cases an entity takes part in, newest first. */
export function casesOf(ref: Ref): string[] {
  const ids = Object.keys(cases).filter((id) => {
    const item = cases[id];
    const sides = [item.plaintiff, item.defendant];
    switch (ref.kind) {
      case 'party':
        return sides.some((side) => side.party === ref.id);
      case 'firm':
        return sides.some((side) => side.firm === ref.id);
      case 'attorney':
        return sides.some((side) => side.attorneys.includes(ref.id));
      case 'judge':
        return item.judge === ref.id || item.magistrate === ref.id;
      case 'expert':
        return item.experts.some((entry) => entry.expert === ref.id);
      case 'patent':
        return item.patents.includes(ref.id);
      default:
        return false;
    }
  });
  const date = (value: string) => value.slice(6) + value.slice(0, 5);
  return ids.sort((a, b) => date(cases[b].filed).localeCompare(date(cases[a].filed)));
}

// The engineer behind the portal is in the record like everyone else: a row of the expert search, a page
// with a report, and an answer of the assistant. Only facts go here: the role, the dates, what I build.

const project = projects.find((item) => item.id === 'exparte')!;
const role = project.roles[0];

export const engineer = {
  name: 'Roman Chasovitin',
  role: role.title,
  since: new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(`${role.period.start}-01T00:00:00Z`)),
  through: 'Mad Devs',
  scope: 'The whole front end and the BFF',
  stack: project.stack,
};

/** What I build in the portal, and the tab where each piece is on this screen. */
export const built: { title: string; body: string; workflow?: 'intelligence' | 'search' | 'assistant' }[] = [
  { title: 'Patent intelligence', body: 'The report screen: three reports written at once, their triage and reviewer stages, Report and Critique™.', workflow: 'intelligence' },
  { title: 'Search and entity pages', body: 'Advanced search, and a page for every case, patent, party, firm, attorney, judge and expert.', workflow: 'search' },
  { title: 'Assistant', body: 'The chat on a case, uploads of your own documents, and the context it shows for every answer.', workflow: 'assistant' },
  { title: 'The BFF', body: 'The back end behind these screens: a BFF on NestJS, with Databricks, Azure databases and sign-in, and n8n.' },
];

// Documents: the intelligence reports and the complaint.

export type Block =
  | { kind: 'fields'; label: string; rows: [string, string][] }
  | { kind: 'text'; label?: string; text: string }
  | { kind: 'table'; title: string; head: string[]; rows: string[][] };

export type Section = { id: string; heading: string; blocks: Block[] };

export type Review = {
  reviewer: string;
  focus: string;
  verdict: 'approve' | 'changes';
  section?: string;
  comment: string;
  /** For a change request: what the revision did. */
  resolution?: string;
};

export type Report = {
  id: string;
  tab: string;
  title: string;
  /** Items of the context tree, each opening a section. */
  items: [label: string, section: string][];
  sections: Section[];
  /** What triage said about each section; `review` sends it to the reviewers. */
  triage: { section: string; verdict: 'pass' | 'review'; note: string }[];
  reviews: Review[];
  /** How long each stage takes, so the three reports finish at different times. */
  timing: { draft: number; triage: number; review: number; revise: number };
};

export const reports: Report[] = [
  {
    id: 'prosecution',
    tab: 'Prosecution History',
    title: 'Prosecution History Intelligence',
    items: [
      ['Full prosecution history', 'summary'],
      ['Prosecution & estoppel', 'estoppel'],
      ['Deep analysis', 'deep'],
    ],
    sections: [
      {
        id: 'summary',
        heading: 'I. Executive Summary',
        blocks: [
          {
            kind: 'fields',
            label: 'Application Details',
            rows: [
              ['Application Number', '17/904,512'],
              ['Filing Date', 'March 3, 2021'],
              ['Notice of Allowance', 'August 19, 2024'],
            ],
          },
          {
            kind: 'fields',
            label: 'Prosecution Timeline',
            rows: [
              ['Total Prosecution Duration', '~3 years, 5 months'],
              ['Office Action Cycles', '3 (2 Non-Final, 1 Final)'],
              ['RCEs', '1'],
              ['Appeals or PTAB Proceedings', 'None during prosecution'],
            ],
          },
          { kind: 'text', label: 'Examiners', text: 'Rita Osei (initial), Alan Whitcombe (primary)' },
          { kind: 'text', label: 'Art Unit', text: '2654' },
          {
            kind: 'text',
            label: 'Key Success Factor',
            text: 'Allowance came after the applicant tied the cancellation filter to a fit estimate measured in each earbud. That amendment, with the argument that Lindqvist and Brandt adapt only to the audio signal, overcame the final §103 rejection.',
          },
        ],
      },
      {
        id: 'estoppel',
        heading: 'II. Prosecution & Estoppel',
        blocks: [
          {
            kind: 'text',
            label: 'Overall Scope Impact',
            text: 'Significantly narrowed. Independent claims 1, 11 and 19 now require a fit estimate from an inward-facing microphone and a filter updated for each earbud.',
          },
          {
            kind: 'fields',
            label: 'Top Estoppel Risk Areas',
            rows: [
              ['Fit estimate', 'The applicant argued that playback level alone is not a fit estimate. Equivalents arguments for level-based designs are weak.'],
              ['Per-earbud filters', 'Added to get around Brandt, which shares one filter. Designs with a shared filter are likely outside the claims.'],
              ['Update rate', 'The applicant defined "in real time" as at least every 10 ms (response of 04/17/23, page 9). Slower designs may avoid literal infringement.'],
            ],
          },
        ],
      },
      {
        id: 'deep',
        heading: 'III. Deep Analysis',
        blocks: [
          {
            kind: 'text',
            text: 'Claim 11 lost the "wireless" limitation during the RCE. It is broader than claims 1 and 19 in one respect: it reads on wired earbuds with the same fit estimate.',
          },
          {
            kind: 'table',
            title: 'Office actions',
            head: ['Date', 'Action', 'Grounds', 'Response'],
            rows: [
              ['09/14/21', 'Non-Final', '§103 Lindqvist + Okafor', 'Amended claims 1 and 11'],
              ['04/02/22', 'Final', '§103 Lindqvist + Brandt', 'RCE, added the fit estimate'],
              ['01/18/23', 'Non-Final', '§112(b) "in real time"', 'Defined as every 10 ms or faster'],
              ['08/19/24', 'Allowance', '', ''],
            ],
          },
        ],
      },
    ],
    triage: [
      { section: 'summary', verdict: 'pass', note: 'All dates match the file wrapper.' },
      { section: 'estoppel', verdict: 'review', note: 'An estoppel risk is stated without the office action response it comes from.' },
      { section: 'deep', verdict: 'pass', note: 'The table matches four events in the file wrapper.' },
    ],
    reviews: [
      {
        reviewer: 'Prosecution reviewer',
        focus: 'File wrapper and amendments',
        verdict: 'changes',
        section: 'estoppel',
        comment: 'The update-rate risk needs the page of the applicant remarks where "in real time" is defined.',
        resolution: 'Revised: cites the response of 04/17/23, page 9.',
      },
      {
        reviewer: 'Claims reviewer',
        focus: 'Claim scope',
        verdict: 'approve',
        comment: 'The reading of claims 1, 11 and 19 follows the amendments.',
      },
      {
        reviewer: 'Litigation reviewer',
        focus: 'Use in the case',
        verdict: 'approve',
        comment: 'The risk areas map to features of the accused Pulse Buds.',
      },
    ],
    timing: { draft: 5200, triage: 1600, review: 2800, revise: 1500 },
  },
  {
    id: 'examiner',
    tab: 'Examiner Search',
    title: 'Examiner Search Intelligence',
    items: [
      ['Examiner search', 'profile'],
      ['Deep analysis', 'search'],
    ],
    sections: [
      {
        id: 'profile',
        heading: 'I. Examiner Profile',
        blocks: [
          {
            kind: 'fields',
            label: 'Alan Whitcombe, Primary Examiner',
            rows: [
              ['Art Unit', '2654'],
              ['Allowance Rate (5 years)', '61%'],
              ['Office Actions to Allowance', '2.8 on average'],
              ['After an Interview', 'Allowed within one action in 44% of cases'],
            ],
          },
          {
            kind: 'text',
            label: 'Pattern',
            text: 'Whitcombe rejects under §103 with two references in most cases and rarely uses §101. He tends to accept amendments that add a measured input, which is what happened here.',
          },
        ],
      },
      {
        id: 'search',
        heading: 'II. Search Quality',
        blocks: [
          {
            kind: 'text',
            label: 'Search Notes',
            text: 'The examiner searched CPC H04R 1/10 and H04R 3/02 and two text strings. He did not search H04R 25 (hearing aids), where fit-adaptive filters were common before 2021.',
          },
          {
            kind: 'table',
            title: 'References of record',
            head: ['Reference', 'Year', 'Used for'],
            rows: [
              ['Lindqvist', '2017', '§103, primary'],
              ['Okafor', '2019', '§103, secondary'],
              ['Brandt', '2018', '§103, secondary'],
            ],
          },
          {
            kind: 'text',
            label: 'Gap',
            text: 'Hearing-aid art on fit-adaptive feedback cancellation is the most promising field for invalidity. None of it is of record.',
          },
        ],
      },
    ],
    triage: [
      { section: 'profile', verdict: 'pass', note: 'Rates computed from 1,284 applications in art unit 2654.' },
      { section: 'search', verdict: 'pass', note: 'CPC classes match the search notes in the file wrapper.' },
    ],
    reviews: [
      { reviewer: 'Examiner reviewer', focus: 'Statistics', verdict: 'approve', comment: 'The rates use the right five-year window.' },
      { reviewer: 'Prior-art reviewer', focus: 'Search gaps', verdict: 'approve', comment: 'The H04R 25 gap is real and worth a targeted search.' },
      { reviewer: 'Litigation reviewer', focus: 'Use in the case', verdict: 'approve', comment: 'Ready to hand to the invalidity team.' },
    ],
    timing: { draft: 3400, triage: 1200, review: 2200, revise: 0 },
  },
  {
    id: 'invalidity',
    tab: 'Invalidity Framework',
    title: 'Invalidity Framework',
    items: [
      ['Invalidity framework', 'claims'],
      ['Deep analysis', 'grounds'],
    ],
    sections: [
      {
        id: 'claims',
        heading: 'I. Independent Claims',
        blocks: [
          {
            kind: 'table',
            title: 'Claims and their weakest points',
            head: ['Claim', 'Key limitations', 'Weakest point'],
            rows: [
              ['1', 'Fit estimate from an inward mic; filter per earbud; update every 10 ms', 'Fit estimation is known from hearing aids'],
              ['11', 'Same as claim 1, without "wireless"', 'Broadest claim, most exposed to prior art'],
              ['19', 'Method; adds a calibration tone at insertion', 'The tone adds little over Okafor'],
            ],
          },
        ],
      },
      {
        id: 'grounds',
        heading: 'II. Strongest Grounds',
        blocks: [
          {
            kind: 'fields',
            label: 'Grounds',
            rows: [
              ['§103, claims 1 and 11', 'Hearing-aid feedback cancellation with fit estimation, not of record, combined with Brandt for per-earbud filters. The hearing-aid art itself says leakage changes with fit, which gives the motivation to combine.'],
              ['§112(b), claim 19', '"Substantially inaudible calibration tone" has no objective boundary in the specification.'],
              ['§101', 'Weak. The claims recite a concrete audio device and a filter update.'],
            ],
          },
        ],
      },
      {
        id: 'outlook',
        heading: 'III. PTAB Outlook',
        blocks: [
          {
            kind: 'text',
            label: 'Institution',
            text: 'Good odds for claims 1 and 11: the best art is not of record, and the Board instituted 67% of petitions in art unit 2654 over the last three years. Kestrel filed [[case:ipr|IPR2026-00731]] within the one-year window.',
          },
          {
            kind: 'text',
            label: 'Discretionary Denial',
            text: 'Moderate risk. [[judge:thorne|Judge Thorne]] takes about 24 months to trial, which is after a final written decision would issue.',
          },
        ],
      },
    ],
    triage: [
      { section: 'claims', verdict: 'pass', note: 'Every limitation maps to claim text.' },
      { section: 'grounds', verdict: 'review', note: 'The combination has no source for the motivation to combine.' },
      { section: 'outlook', verdict: 'review', note: 'Institution odds are stated without Board statistics.' },
    ],
    reviews: [
      {
        reviewer: 'Prior-art reviewer',
        focus: 'Grounds',
        verdict: 'changes',
        section: 'grounds',
        comment: 'Give a source for the motivation to combine.',
        resolution: 'Revised: the hearing-aid art itself ties leakage to fit.',
      },
      {
        reviewer: 'PTAB reviewer',
        focus: 'Board practice',
        verdict: 'changes',
        section: 'outlook',
        comment: 'Add the institution rate for this art unit.',
        resolution: 'Revised: 67% instituted in art unit 2654 over three years.',
      },
      { reviewer: 'Claims reviewer', focus: 'Claim scope', verdict: 'approve', comment: 'The weakest points match the claim text.' },
    ],
    timing: { draft: 6400, triage: 1800, review: 3400, revise: 2000 },
  },
];

/** The complaint intelligence of the main case, the document next to the assistant. */
export const complaintReport: Report = {
  id: 'complaint',
  tab: 'Complaint Intelligence',
  title: 'Complaint Intelligence',
  items: [],
  sections: [
    {
      id: 'summary',
      heading: 'I. Executive Summary and Procedural Information',
      blocks: [
        {
          kind: 'fields',
          label: 'Parties & Counsel',
          rows: [
            ['Plaintiff', '[[party:northwind|Northwind Acoustics LLC]] (Texas)'],
            ['Defendant', '[[party:kestrel|Kestrel Devices Inc.]] (Delaware)'],
            ["Plaintiff's Counsel", '[[firm:halvorsen|Halvorsen & Pike LLP]]'],
            ["Defendant's Counsel", '[[firm:crane|Crane Whitfield LLP]]'],
          ],
        },
        { kind: 'text', label: 'Case Identification', text: '[[case:kestrel|2:26-cv-04817]], E.D. Tex., 06/02/2026, [[judge:thorne|Judge Thorne]]' },
        {
          kind: 'text',
          label: 'Core Dispute',
          text: 'Northwind alleges that the Kestrel Pulse Buds 2 and Pulse Buds Pro infringe three patents on crosstalk cancellation, wear detection and audio sync.',
        },
        {
          kind: 'text',
          label: 'Technical Context',
          text: 'Earbuds leak sound between the speaker and the outer microphone, and the leak changes with fit. The lead patent adapts the cancellation filter to a fit estimate in each earbud.',
        },
        {
          kind: 'text',
          label: 'Key Procedural History',
          text: 'The parties settled an earlier case over the wear-detection patent in 2025 ([[case:earlier|2:24-cv-01163]]). Northwind sued Orbis the same day on the same patents ([[case:orbis|2:26-cv-04818]]).',
        },
      ],
    },
    {
      id: 'timeline',
      heading: 'II. Case Timeline',
      blocks: [
        {
          kind: 'table',
          title: 'Timeline',
          head: ['Date', 'Event'],
          rows: [
            ['06/02/26', 'Complaint filed'],
            ['06/09/26', 'Summons issued to Kestrel Devices Inc.'],
            ['08/14/26', 'Kestrel files IPR2026-00731 on the lead patent'],
            ['09/11/26', 'Stipulation extends the answer deadline to 10/13/26'],
            ['01/06/27', 'Initial case management conference'],
          ],
        },
      ],
    },
    {
      id: 'patents',
      heading: 'III. Asserted Patents',
      blocks: [
        {
          kind: 'table',
          title: 'Patents',
          head: ['Patent', 'Title', 'Claims asserted'],
          rows: [
            ['[[patent:crosstalk|US 13,104,287 B2]]', 'Adaptive crosstalk cancellation for wireless earbuds', '1, 11, 19'],
            ['[[patent:wear|US 13,068,114 B2]]', 'Wear detection for in-ear audio devices', '1, 8'],
            ['[[patent:sync|US 13,021,776 B1]]', 'Low-latency audio sync over Bluetooth LE', '4'],
          ],
        },
      ],
    },
  ],
  triage: [],
  reviews: [
    { reviewer: 'Pleadings reviewer', focus: 'Complaint', verdict: 'approve', comment: 'Parties, counsel and asserted claims match the complaint.' },
    {
      reviewer: 'Procedure reviewer',
      focus: 'Docket',
      verdict: 'changes',
      section: 'timeline',
      comment: 'The timeline missed the IPR filed on 08/14/26.',
      resolution: 'Revised: the IPR is in the timeline.',
    },
    { reviewer: 'Litigation reviewer', focus: 'Use in the case', verdict: 'approve', comment: 'Ready for the case team.' },
  ],
  timing: { draft: 0, triage: 0, review: 0, revise: 0 },
};

/** My curriculum vitae, printed the way the portal prints a report. */
export const cv: Report = {
  id: 'cv',
  tab: 'Curriculum Vitae',
  title: 'Engineer Profile',
  items: [],
  sections: [
    {
      id: 'summary',
      heading: 'I. Summary',
      blocks: [
        {
          kind: 'fields',
          label: engineer.name,
          rows: [
            ['Position', engineer.role],
            ['Since', engineer.since],
            ['Through', engineer.through],
            ['Scope', 'The whole front end of the portal, and the BFF on NestJS behind it'],
          ],
        },
      ],
    },
    {
      id: 'work',
      heading: 'II. What I Build',
      blocks: [
        ...built.map((item): Block => ({ kind: 'text', label: item.title, text: item.body })),
        { kind: 'text', label: 'The business side', text: 'I work deep in the business side of patent litigation: how judges, firms, experts and patents shape the result of a case.' },
      ],
    },
    {
      id: 'stack',
      heading: 'III. Stack',
      blocks: [
        {
          kind: 'table',
          title: 'Stack',
          head: ['Area', 'Technologies'],
          rows: [
            ['Front end', 'Next.js, TypeScript'],
            ['BFF', 'NestJS, TypeScript'],
            ['Data and cloud', 'Databricks, Azure'],
            ['Workflows', 'n8n'],
            ['Also', 'Python, Go'],
          ],
        },
      ],
    },
  ],
  triage: [],
  reviews: [],
  timing: { draft: 0, triage: 0, review: 0, revise: 0 },
};

/** The complaint itself, a few paragraphs of it. */
export const complaint: [number, string][] = [
  [1, 'Plaintiff Northwind Acoustics LLC brings this action for patent infringement against Defendant Kestrel Devices Inc.'],
  [12, 'Venue is proper in this District because Kestrel maintains a regular and established place of business in Plano, Texas.'],
  [24, 'Kestrel makes and sells the Pulse Buds 2 and Pulse Buds Pro (the "Accused Products").'],
  [31, 'Each Accused Product estimates the fit of each earbud from its inward-facing microphone and adapts a separate cancellation filter for each earbud.'],
  [47, 'Kestrel has known of the \'287 patent since at least March 2025, when Northwind sent a notice letter.'],
  [61, 'Kestrel\'s infringement has been and continues to be willful.'],
];

// The assistant.

export type ContextItem = { label: string; tokens: number; kept: boolean; why: string };

export type Answer = {
  question: string;
  context: ContextItem[];
  /** With [n] citing the kept context items in order. */
  text: string;
};

export const upload = {
  file: 'Kestrel_Answer_and_Counterclaims.pdf',
  pages: 38,
  found: ['Denies infringement of every asserted claim', 'Counterclaims: invalidity under §§ 102 and 103', '3 patents, 21 claims, 2 counterclaims'],
  linked: [
    '[[party:kestrel|Kestrel Devices Inc.]]',
    '[[firm:crane|Crane Whitfield LLP]]',
    '[[patent:crosstalk|US 13,104,287 B2]]',
    '[[case:ipr|IPR2026-00731]]',
  ],
  tokens: 11300,
};

export const BUDGET = 32000;

const docket = (kept: boolean, why: string): ContextItem => ({ label: 'Docket, 14 entries', tokens: 2100, kept, why });
const uploaded = (why: string): ContextItem => ({ label: `Your upload: ${upload.file}`, tokens: upload.tokens, kept: true, why });

/** Answers without and with the visitor's upload in the context. */
export const answers: Record<string, { before: Answer; after?: Answer }> = {
  answered: {
    before: {
      question: 'Has the defendant answered the complaint?',
      context: [
        docket(true, 'A procedural question: the docket decides it'),
        { label: 'Complaint Intelligence, timeline', tokens: 600, kept: true, why: 'Dates of every filing so far' },
        { label: 'Complaint, ¶¶ 1–88', tokens: 9800, kept: false, why: 'Not needed to answer a procedural question' },
        { label: 'Docket of 2:26-cv-04818', tokens: 1900, kept: false, why: 'A different defendant' },
      ],
      text: 'Not yet. [[party:kestrel|Kestrel Devices]] filed an unopposed stipulation on 09/11/26 that extends its time to answer to 10/13/26 [1]. There is no answer or motion to dismiss on the docket [1]. The initial case management conference is set for 01/06/27 before [[judge:thorne|Judge Thorne]] [2].',
    },
    after: {
      question: 'Has the defendant answered the complaint?',
      context: [
        uploaded('Your document answers this directly'),
        docket(true, 'Whether the answer is filed yet'),
        { label: 'Complaint, ¶¶ 1–88', tokens: 9800, kept: false, why: 'Your upload responds to it paragraph by paragraph' },
      ],
      text: 'Not on the docket yet, but the answer you uploaded is ready to file [1]. Kestrel denies infringement of every asserted claim and counterclaims for invalidity under §§ 102 and 103 [1]. The deadline under the stipulation is 10/13/26 [2].',
    },
  },
  claims: {
    before: {
      question: 'Summarize the infringement claims',
      context: [
        { label: 'Complaint, ¶¶ 24–61', tokens: 6800, kept: true, why: 'The infringement counts' },
        { label: 'US 13,104,287 B2, claims 1, 11, 19', tokens: 2400, kept: true, why: 'The lead patent, asserted directly' },
        { label: 'Complaint Intelligence, asserted patents', tokens: 1200, kept: true, why: 'All three patents in one place' },
        docket(false, 'No rulings on the merits yet'),
        { label: 'Prosecution history of the lead patent', tokens: 14200, kept: false, why: 'Too large for this question; the reports cover it' },
      ],
      text: '[[party:northwind|Northwind]] asserts three patents against the Pulse Buds 2 and Pulse Buds Pro [1]. The lead patent, [[patent:crosstalk|US 13,104,287]], covers crosstalk cancellation that adapts to the fit of each earbud; claims 1, 11 and 19 are asserted [2]. The other two cover wear detection and low-latency sync over Bluetooth LE [3]. Northwind alleges willful infringement from a notice letter sent in March 2025 [1].',
    },
  },
  deadlines: {
    before: {
      question: 'What are the upcoming deadlines?',
      context: [
        docket(true, 'Scheduled dates'),
        { label: "Judge Thorne's standing order on patent cases", tokens: 1400, kept: true, why: 'How this judge schedules claim construction' },
        { label: 'E.D. Tex. local patent rules', tokens: 900, kept: true, why: 'Default disclosure deadlines' },
        { label: 'Complaint, ¶¶ 1–88', tokens: 9800, kept: false, why: 'No dates beyond the filing' },
      ],
      text: '10/13/26: Kestrel must answer under the stipulation [1]. 12/23/26: joint case management statement [1]. 01/06/27: initial case management conference [1]. Infringement contentions are due shortly before that conference under the local patent rules [3], and [[judge:thorne|Judge Thorne]] usually holds the Markman hearing about 14 months after it [2].',
    },
  },
  builder: {
    before: {
      question: 'Who built this portal?',
      context: [
        { label: `Engineer profile: ${engineer.name}`, tokens: 900, kept: true, why: 'The person behind the portal' },
        { label: 'Portal release notes', tokens: 3100, kept: true, why: 'What each screen does' },
        { label: 'Complaint, ¶¶ 1–88', tokens: 9800, kept: false, why: 'About the case, not the portal' },
      ],
      text: `[[engineer:roman|${engineer.name}]] builds the whole front end of this portal, every screen in this window, and the BFF on NestJS behind it [1]. That covers the three reports with their triage and reviewers, search with every entity page, and this chat with the context you see above [2]. He has been the ${engineer.role.toLowerCase()} on Ex Parte since ${engineer.since}, through ${engineer.through} [1].`,
    },
  },
  experts: {
    before: {
      question: 'Which experts could we face?',
      context: [
        { label: 'Experts retained by Kestrel Devices, 4 cases', tokens: 1600, kept: true, why: 'Who Kestrel used before' },
        { label: 'Experts retained by Crane Whitfield LLP', tokens: 1100, kept: true, why: 'Counsel often brings the same experts' },
        { label: 'IPR2026-00731 petition', tokens: 5200, kept: true, why: 'Names the declarant already' },
        { label: 'Complaint, ¶¶ 1–88', tokens: 9800, kept: false, why: 'Says nothing about experts' },
      ],
      text: '[[expert:hartmann|Dr. Paul Hartmann]] is the likely technical expert: Crane Whitfield retained him for Kestrel in 3 of its last 4 patent cases [1][2], and he already signed the declaration for the IPR [3]. His testimony was challenged 5 times and never excluded. For acoustics, Kestrel used [[expert:nakamura|Dr. Aiko Nakamura]] in the Lumen case [1].',
    },
  },
};

export const suggestions = {
  before: ['answered', 'claims', 'deadlines', 'builder'],
  after: ['answered', 'experts', 'claims', 'builder'],
};

/** Free text finds the closest answer by its words. */
export function route(question: string): string {
  if (/\bbuil|who made|develop|engineer|roman/i.test(question)) return 'builder';
  if (/answer|respond|reply|filed/i.test(question)) return 'answered';
  if (/deadline|date|when|schedul|markman/i.test(question)) return 'deadlines';
  if (/expert|witness|declar/i.test(question)) return 'experts';
  return 'claims';
}
