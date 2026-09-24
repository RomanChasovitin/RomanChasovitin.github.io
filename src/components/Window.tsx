import type { ReactNode } from 'react';

// A macOS window around a working piece of a screen, from styles/window.css. With `tabs` it is a browser:
// the tabs sit in the bar and `url` shows under them; without, the bar carries `title`. `dark` is the frame
// for the dark screens. The page under the bar keeps a desktop width and scrolls sideways in a narrow window.

export type WindowTab = { id: string; label: string; icon: ReactNode; disabled?: boolean; badge?: ReactNode };

type Props = {
  title?: string;
  dark?: boolean;
  tabs?: WindowTab[];
  active?: string;
  onTab?: (id: string) => void;
  url?: string;
  /** Controls at the end of the address bar. */
  tools?: ReactNode;
  children: ReactNode;
};

export function Lights() {
  return (
    <span className="mac-lights" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export default function Window({ title, dark = false, tabs, active, onTab, url, tools, children }: Props) {
  return (
    <div className={`mac h-full ${dark ? 'dark' : ''}`}>
      {tabs ? (
        <div className="mac-bar tabs" role="tablist">
          <Lights />
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={tab.id === active} disabled={tab.disabled} onClick={() => onTab?.(tab.id)} className="mac-tab">
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge}
            </button>
          ))}
        </div>
      ) : (
        <div className="mac-bar">
          <Lights />
          <span className="mac-title">{title}</span>
        </div>
      )}
      {url !== undefined && (
        <div className="mac-address">
          <span className="mac-url">{url}</span>
          {tools}
        </div>
      )}
      <div className="mac-scroll">
        <div className="mac-page">{children}</div>
      </div>
    </div>
  );
}
