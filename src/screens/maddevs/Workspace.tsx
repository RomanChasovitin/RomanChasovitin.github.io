import { useState } from 'react';
import Window from '../../components/Window';
import Enji from './Enji';
import Slack from './Slack';

// The Mad Devs window is a browser with two tabs: Slack, where the team works, and enji.ai, the employee
// page I helped build. Slack stays mounted in the background, so its chat survives a look at enji.ai.

type Tab = 'slack' | 'enji';

const TABS = [
  {
    id: 'slack',
    label: 'Mad Devs · Slack',
    // Four bars in the classic Slack colors; simple-icons no longer carries the Slack mark.
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9.5" y="2" width="3.5" height="9" rx="1.75" fill="#36c5f0" />
        <rect x="13" y="9.5" width="9" height="3.5" rx="1.75" fill="#2eb67d" />
        <rect x="11" y="13" width="3.5" height="9" rx="1.75" fill="#ecb22e" />
        <rect x="2" y="11" width="9" height="3.5" rx="1.75" fill="#e01e5a" />
      </svg>
    ),
  },
  {
    id: 'enji',
    label: 'enji.ai · My work',
    icon: <img src="/icons/maddevs.svg" alt="" width="64" height="64" className="rounded" />,
  },
];

const URLS: Record<Tab, string> = {
  slack: 'app.slack.com/client/maddevs/maddevs-io',
  enji: 'enji.ai/my-work',
};

export default function Workspace() {
  const [tab, setTab] = useState<Tab>('slack');
  return (
    <Window dark tabs={TABS} active={tab} onTab={(id) => setTab(id as Tab)} url={URLS[tab]}>
      <div className={tab === 'slack' ? 'flex min-h-0 flex-1' : 'hidden'}>
        <Slack />
      </div>
      {tab === 'enji' && <Enji />}
    </Window>
  );
}
