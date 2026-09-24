import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import {
  conversations as initialConversations,
  radiatorReport,
  users,
  type Conversation,
  type Message,
  type Report,
  type UserId,
} from './chat';
import { brandIcon } from '../../content/icons';

// Classic Slack colors, taken from an archived maddevs.io screenshot where the hero had a Slack window.
//
// A narrow window works as Slack on a phone: the list of conversations is a screen of its own, a thread
// covers the chat, and a tap on a message shows its actions.
const RAIL = '#261c25';
const SIDEBAR = '#533f4c';
const ACTIVE = '#4e9689';
const MENTION = '#fef7d2';
const LINK = '#1264a3';
const MUTED = '#616061';
const PICKER = ['👍', '🎉', '🔥', '👀', '🙌', '🚀'];
const PROJECTS = [
  { id: 'exparte', name: 'Ex Parte', color: '#0061ff' },
  { id: 'bilebile', name: 'Bile-Bile', color: '#e63445' },
  { id: 'teacherly', name: 'Teacherly', color: '#4e409b' },
] as const;

type Reaction = { count: number; mine: boolean };
type Profile = { user: UserId; x: number; y: number };

const key = (conversation: string, message: string) => `${conversation}:${message}`;
const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
let nextId = 0;
const newId = () => `local-${nextId++}`;

function initialReactions() {
  const all: Record<string, Record<string, Reaction>> = {};
  for (const conversation of initialConversations) {
    for (const message of conversation.messages) {
      if (!message.reactions) continue;
      all[key(conversation.id, message.id)] = Object.fromEntries(
        Object.entries(message.reactions).map(([emoji, count]) => [emoji, { count, mine: false }]),
      );
    }
  }
  return all;
}

export default function Slack() {
  const [conversations, setConversations] = useState<Conversation[]>(() => structuredClone(initialConversations));
  const [activeId, setActiveId] = useState('maddevs-io');
  const [unread, setUnread] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialConversations.map((conversation) => [conversation.id, conversation.unread ?? 0])),
  );
  const [reactions, setReactions] = useState(initialReactions);
  const [thread, setThread] = useState<string | null>(null);
  const [picker, setPicker] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [threadDraft, setThreadDraft] = useState('');
  // Only a narrow window shows the list on its own.
  const [listed, setListed] = useState(false);
  const delivered = useRef(new Set<string>());
  const runs = useRef(0);
  const list = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((conversation) => conversation.id === activeId)!;
  const threadMessage = thread ? active.messages.find((message) => key(active.id, message.id) === thread) : null;
  const title = active.kind === 'channel' ? `#${active.name}` : users[active.name as UserId].name;

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [activeId, active.messages.length, typing]);

  function append(conversationId: string, message: Message) {
    setConversations((all) =>
      all.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, messages: [...conversation.messages, message] }
          : conversation,
      ),
    );
    if (conversationId !== activeId) setUnread((all) => ({ ...all, [conversationId]: (all[conversationId] ?? 0) + 1 }));
  }

  function open(id: string) {
    setActiveId(id);
    setListed(false);
    setThread(null);
    setPicker(null);
    setProfile(null);
    setUnread((all) => ({ ...all, [id]: 0 }));
    const conversation = conversations.find((item) => item.id === id)!;
    if (conversation.incoming && !delivered.current.has(id)) {
      delivered.current.add(id);
      const incoming = conversation.incoming;
      setTimeout(() => setTyping(id), 700);
      setTimeout(() => {
        setTyping(null);
        append(id, incoming);
      }, 2400);
    }
  }

  function note(text: string) {
    append(activeId, { id: newId(), user: 'radiator', time: now(), text: `Only visible to you. ${text}` });
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    if (text.startsWith('/')) {
      if (text === '/radiator run' || text === '/radiator') {
        if (activeId !== 'mad-radiator') return note('/radiator run posts to #mad-radiator. Open it and try again.');
        runs.current += 1;
        const report = radiatorReport(runs.current);
        setTimeout(
          () => append('mad-radiator', { id: newId(), user: 'radiator', time: now(), text: 'Fresh report, as asked.', report }),
          600,
        );
        return;
      }
      if (text === '/help') return note('Commands: /radiator run in #mad-radiator, /help.');
      return note(`${text.split(' ')[0]} is not a command here. Try /help.`);
    }
    append(activeId, { id: newId(), user: 'roman', time: now(), text });
  }

  function reply() {
    const text = threadDraft.trim();
    if (!text || !threadMessage) return;
    setThreadDraft('');
    setConversations((all) =>
      all.map((conversation) =>
        conversation.id === activeId
          ? {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === threadMessage.id
                  ? { ...message, replies: [...(message.replies ?? []), { user: 'roman', time: now(), text }] }
                  : message,
              ),
            }
          : conversation,
      ),
    );
  }

  function toggleReaction(messageKey: string, emoji: string) {
    setPicker(null);
    setReactions((all) => {
      const forMessage = { ...all[messageKey] };
      const current = forMessage[emoji] ?? { count: 0, mine: false };
      const next = { count: current.count + (current.mine ? -1 : 1), mine: !current.mine };
      if (next.count === 0) delete forMessage[emoji];
      else forMessage[emoji] = next;
      return { ...all, [messageKey]: forMessage };
    });
  }

  function showProfile(user: UserId, event: MouseEvent) {
    const box = windowRef.current!.getBoundingClientRect();
    setProfile({ user, x: event.clientX - box.left, y: event.clientY - box.top });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !(picker || profile || thread)) return;
    // Handled here, so the router does not take Escape as "back to intro".
    event.preventDefault();
    event.nativeEvent.preventDefault();
    if (picker) setPicker(null);
    else if (profile) setProfile(null);
    else setThread(null);
  }

  function renderText(text: string): ReactNode[] {
    return text.split(/(@\w+|#[a-z0-9-]+)/g).map((part, index) => {
      if (part === '@here') {
        return (
          <span key={index} className="rounded px-0.5 font-bold" style={{ background: MENTION }}>
            @here
          </span>
        );
      }
      if (part.startsWith('@') && part.slice(1) in users) {
        const user = part.slice(1) as UserId;
        return (
          <button
            key={index}
            type="button"
            data-profile-trigger
            onClick={(event) => showProfile(user, event)}
            className="cursor-pointer rounded px-0.5"
            style={user === 'roman' ? { background: MENTION } : { background: '#e8f5fa', color: LINK }}
          >
            @{users[user].name}
          </button>
        );
      }
      const channel = conversations.find((item) => item.kind === 'channel' && `#${item.name}` === part);
      if (channel) {
        return (
          <button key={index} type="button" onClick={() => open(channel.id)} className="cursor-pointer" style={{ color: LINK }}>
            {part}
          </button>
        );
      }
      return part;
    });
  }

  function avatar(user: UserId, size = 36) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-[4px] font-bold text-white"
        style={{ width: size, height: size, background: users[user].color, fontSize: size * 0.38 }}
        aria-hidden="true"
      >
        {initials(users[user].name)}
      </span>
    );
  }

  function reportBlock(report: Report) {
    return (
      <div className="mt-1.5 max-w-md border-l-4 pl-3" style={{ borderColor: ACTIVE }}>
        <p className="font-bold">Report for {report.site}</p>
        <dl className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[0.8rem]">
          {report.fields.map(([label, value]) => (
            <div key={label}>
              <dt className="font-bold">{label}</dt>
              <dd style={{ color: MUTED }}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  function messageRow(message: Message, compact = false) {
    const messageKey = key(active.id, message.id);
    const messageReactions = reactions[messageKey] ?? {};
    const user = users[message.user];
    return (
      <div key={message.id} tabIndex={-1} className="group relative flex gap-2.5 px-5 py-2 outline-none hover:bg-[#f8f8f8] focus-within:bg-[#f8f8f8] @max-lg/window:px-3">
        {avatar(message.user)}
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <button
              type="button"
              data-profile-trigger
              className="cursor-pointer font-black hover:underline"
              onClick={(event) => showProfile(message.user, event)}
            >
              {user.name}
            </button>
            {user.bot && <span className="rounded-sm bg-[#e8e8e8] px-1 text-[0.65rem] font-bold text-[#616061]">APP</span>}
            <span className="text-xs" style={{ color: MUTED }}>
              {message.time}
            </span>
          </p>
          <p className="leading-snug">{renderText(message.text)}</p>
          {message.report && reportBlock(message.report)}
          {!compact && (Object.keys(messageReactions).length > 0 || picker === messageKey) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {Object.entries(messageReactions).map(([emoji, reaction]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => toggleReaction(messageKey, emoji)}
                  aria-pressed={reaction.mine}
                  className="flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                  style={
                    reaction.mine
                      ? { borderColor: LINK, background: '#e8f5fa', color: LINK }
                      : { borderColor: '#dddddd', background: '#f8f8f8' }
                  }
                >
                  <span>{emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
              {picker === messageKey &&
                PICKER.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleReaction(messageKey, emoji)}
                    className="cursor-pointer rounded px-1 text-base hover:bg-[#e8e8e8]"
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
            </div>
          )}
          {!compact && message.replies && message.replies.length > 0 && (
            <button
              type="button"
              onClick={() => setThread(messageKey)}
              className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold"
              style={{ color: LINK }}
            >
              {message.replies.slice(-3).map((item, index) => (
                <span key={index}>{avatar(item.user, 18)}</span>
              ))}
              {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
        {!compact && (
          <div className="absolute -top-3 right-5 hidden gap-0.5 @max-lg/window:right-3 rounded-md border border-[#dddddd] bg-white p-0.5 shadow-sm group-hover:flex group-focus-within:flex">
            <button
              type="button"
              onClick={() => setPicker(picker === messageKey ? null : messageKey)}
              className="cursor-pointer rounded px-2 py-1 text-xs hover:bg-[#f0f0f0]"
            >
              Add reaction
            </button>
            <button
              type="button"
              onClick={() => setThread(messageKey)}
              className="cursor-pointer rounded px-2 py-1 text-xs hover:bg-[#f0f0f0]"
            >
              Reply in thread
            </button>
          </div>
        )}
      </div>
    );
  }

  const channels = conversations.filter((conversation) => conversation.kind === 'channel');
  const unreadTotal = Object.entries(unread).reduce((sum, [id, count]) => sum + (id === activeId ? 0 : count), 0);
  const dms = conversations.filter((conversation) => conversation.kind === 'dm');

  return (
    <div
      ref={windowRef}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (profile && !(event.target as Element).closest('[data-profile], [data-profile-trigger]')) setProfile(null);
      }}
      className="relative flex h-full w-full overflow-hidden bg-white font-lato text-[0.9rem] text-[#1d1c1d]"
    >
      <div className={`flex w-14 shrink-0 flex-col items-center gap-3 pt-3 ${listed ? '' : '@max-lg/window:hidden'}`} style={{ background: RAIL }}>
        <span className="flex size-9 items-center justify-center rounded-lg bg-[#ec1c24] text-sm font-black text-white ring-2 ring-white ring-offset-2 ring-offset-[#261c25]">
          MD
        </span>
        <span className="mt-2 text-[0.6rem] font-bold tracking-wide text-white/50">Projects</span>
        {/* Client work that came through Mad Devs; each opens its own screen. */}
        {PROJECTS.map((project) => (
          <a
            key={project.id}
            href={`#${project.id}`}
            title={`${project.name}: open its screen`}
            className="group relative block size-9 rounded-lg transition hover:scale-105"
            style={{ boxShadow: `0 0 0 2px ${project.color}` }}
          >
            <img src={brandIcon[project.id]} alt={project.name} width={64} height={64} className="size-9 rounded-lg" />
          </a>
        ))}
      </div>

      <nav className={`flex w-52 shrink-0 flex-col overflow-y-auto pb-4 text-[#ffffffb3] ${listed ? '@max-lg/window:w-auto @max-lg/window:flex-1' : '@max-lg/window:hidden'}`} style={{ background: SIDEBAR }} aria-label="Conversations">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="font-black text-white">Mad Devs</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs">
            <span className="size-2 rounded-full bg-[#2bac76]" /> Roman Chas
          </p>
        </div>
        <p className="mt-4 px-4 text-xs font-bold">Channels</p>
        <ul className="mt-1">
          {channels.map((conversation) => (
            <li key={conversation.id}>
              <SidebarItem
                label={`# ${conversation.name}`}
                active={conversation.id === activeId}
                unread={unread[conversation.id] ?? 0}
                onClick={() => open(conversation.id)}
              />
            </li>
          ))}
        </ul>
        <p className="mt-4 px-4 text-xs font-bold">Direct messages</p>
        <ul className="mt-1">
          {dms.map((conversation) => (
            <li key={conversation.id}>
              <SidebarItem
                label={users[conversation.name as UserId].name}
                dot
                active={conversation.id === activeId}
                unread={unread[conversation.id] ?? 0}
                badge
                onClick={() => open(conversation.id)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <section className={`flex min-w-0 flex-1 flex-col ${listed ? '@max-lg/window:hidden' : ''}`} aria-label={title}>
        <header className="flex items-center gap-3 border-b border-[#e8e8e8] px-5 py-2.5 @max-lg/window:gap-2 @max-lg/window:px-3">
          <button type="button" onClick={() => setListed(true)} aria-label="All conversations" className="-ml-1 hidden cursor-pointer items-center gap-1 rounded px-1 py-0.5 hover:bg-[#f0f0f0] @max-lg/window:flex">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            {unreadTotal > 0 && <span className="rounded-full bg-[#e01e5a] px-1.5 text-xs font-bold text-white">{unreadTotal}</span>}
          </button>
          <h3 className="shrink-0 font-black">{title}</h3>
          <p className="truncate text-xs" style={{ color: MUTED }}>
            {active.topic}
          </p>
        </header>
        <div ref={list} className="flex-1 overflow-y-auto py-2">
          {active.messages.map((message) => messageRow(message))}
        </div>
        <p className="h-5 px-5 text-xs @max-lg/window:px-3" style={{ color: MUTED }} aria-live="polite">
          {typing === activeId && `${users[active.name as UserId].name} is typing…`}
        </p>
        <form
          className="mx-5 mb-4 rounded-md border border-[#bbbbbb] focus-within:border-[#616061] @max-lg/window:mx-3 @max-lg/window:mb-3"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message ${title}`}
            aria-label={`Message ${title}`}
            className="w-full bg-transparent px-3 py-2.5 outline-none"
          />
        </form>
      </section>

      {threadMessage && (
        <aside className="flex w-72 shrink-0 flex-col border-l border-[#e8e8e8] bg-white @max-3xl/window:absolute @max-3xl/window:inset-y-0 @max-3xl/window:right-0 @max-3xl/window:z-[5] @max-3xl/window:shadow-xl @max-lg/window:left-0 @max-lg/window:w-auto @max-lg/window:border-l-0" aria-label="Thread">
          <header className="flex items-center justify-between border-b border-[#e8e8e8] px-4 py-2.5">
            <p>
              <span className="font-black">Thread</span>{' '}
              <span className="text-xs" style={{ color: MUTED }}>
                {title}
              </span>
            </p>
            <button type="button" onClick={() => setThread(null)} className="cursor-pointer px-1 text-lg" aria-label="Close thread">
              ×
            </button>
          </header>
          <div className="flex-1 overflow-y-auto py-2">
            {messageRow(threadMessage, true)}
            <p className="mx-5 my-2 border-b border-[#e8e8e8] pb-1 text-xs" style={{ color: MUTED }}>
              {threadMessage.replies?.length ?? 0} replies
            </p>
            {threadMessage.replies?.map((item, index) => messageRow({ id: `${threadMessage.id}-r${index}`, ...item }, true))}
          </div>
          <form
            className="mx-4 mb-4 rounded-md border border-[#bbbbbb]"
            onSubmit={(event) => {
              event.preventDefault();
              reply();
            }}
          >
            <input
              value={threadDraft}
              onChange={(event) => setThreadDraft(event.target.value)}
              placeholder="Reply…"
              aria-label="Reply in thread"
              className="w-full bg-transparent px-3 py-2.5 outline-none"
            />
          </form>
        </aside>
      )}

      {profile && (
        <div
          data-profile
          role="dialog"
          aria-label={users[profile.user].name}
          className="absolute z-10 w-64 overflow-hidden rounded-lg border border-[#dddddd] bg-white shadow-lg"
          style={{ left: Math.min(profile.x, (windowRef.current?.clientWidth ?? 0) - 272), top: Math.min(profile.y + 12, (windowRef.current?.clientHeight ?? 0) - 200) }}
        >
          <div className="flex h-24 items-end p-3" style={{ background: users[profile.user].color }}>
            {avatar(profile.user, 56)}
          </div>
          <div className="p-3">
            <p className="font-black">{users[profile.user].name}</p>
            <p className="text-xs" style={{ color: MUTED }}>
              {users[profile.user].title}
            </p>
            {conversations.some((item) => item.kind === 'dm' && item.name === profile.user) && (
              <button
                type="button"
                onClick={() => open(`dm-${profile.user}`)}
                className="mt-3 w-full cursor-pointer rounded border border-[#bbbbbb] py-1.5 text-xs font-bold hover:bg-[#f8f8f8]"
              >
                Message
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem(props: {
  label: string;
  active: boolean;
  unread: number;
  dot?: boolean;
  badge?: boolean;
  onClick: () => void;
}) {
  const { label, active, unread, dot, badge, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active || undefined}
      className="flex w-full cursor-pointer items-center gap-2 px-4 py-1 text-left hover:bg-black/15"
      style={active ? { background: ACTIVE, color: '#fff' } : unread ? { color: '#fff', fontWeight: 900 } : undefined}
    >
      {dot && <span className="size-2 shrink-0 rounded-full bg-[#2bac76]" aria-hidden="true" />}
      <span className="truncate">{label}</span>
      {badge && unread > 0 && !active && (
        <span className="ml-auto rounded-full bg-[#e01e5a] px-1.5 text-xs font-bold text-white">{unread}</span>
      )}
    </button>
  );
}
