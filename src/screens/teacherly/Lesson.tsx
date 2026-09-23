import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

// Teacherly, the product, end to end: create a lesson on a free canvas, split it into screens, put it in the
// timetable for a class, teach it on a call, then grade the class. Student names are placeholders for the
// five front-end developers of the team.

type Kind = 'text' | 'image' | 'video' | 'shape';
type Shape = 'circle' | 'star' | 'arrow';
type Item = { id: number; kind: Kind; x: number; y: number; w: number; h: number; text?: string; shape?: Shape; color?: string };
type Screen = { id: number; elements: Item[] };
type Stage = 'create' | 'schedule' | 'teach' | 'grade';

const PURPLE = '#4e409b';
const COLORS = ['#f7da49', '#65b8be', '#e6a2ba', '#aad5ed', '#f2c979'];
const SHAPES: Shape[] = ['circle', 'star', 'arrow'];
const STAGES: { id: Stage; label: string }[] = [
  { id: 'create', label: 'Create' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'teach', label: 'Teach' },
  { id: 'grade', label: 'Grade' },
];
const STUDENTS = [
  { name: 'Asel', color: '#f7da49' },
  { name: 'Bekzat', color: '#65b8be' },
  { name: 'Nurlan', color: '#aad5ed' },
  { name: 'Aigerim', color: '#e6a2ba' },
  { name: 'Daniyar', color: '#f2c979' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const PERIODS = ['09:00', '10:00', '11:15', '12:15', '14:00'];
/** Lessons already in the timetable, keyed by "day-period". */
const BUSY: Record<string, string> = {
  '0-0': 'Maths 9B',
  '0-3': 'History 8A',
  '1-1': 'Science 9B',
  '2-0': 'Maths 9B',
  '2-2': 'Art 7C',
  '3-4': 'Science 9B',
  '4-1': 'Drama 8A',
  '4-3': 'Maths 9B',
};
const GRADES = ['A*', 'A', 'B', 'C', 'D', 'E'];

let nextId = 100;

const SEED: Screen[] = [
  {
    id: 1,
    elements: [
      { id: 1, kind: 'shape', shape: 'circle', color: '#f7da49', x: 70, y: -12, w: 38, h: 60 },
      { id: 2, kind: 'text', text: 'What I built at Teacherly', x: 6, y: 12, w: 62, h: 18 },
      { id: 3, kind: 'text', text: 'Maintainer for a year and a half. I redesigned the whole app and made creating lessons much better.', x: 6, y: 38, w: 50, h: 26 },
      { id: 4, kind: 'image', x: 60, y: 44, w: 32, h: 44 },
    ],
  },
  {
    id: 2,
    elements: [
      { id: 5, kind: 'video', text: 'Video lessons, added at the 2020 peak', x: 6, y: 12, w: 50, h: 62 },
      { id: 6, kind: 'text', text: 'At the peak I led five front-end developers. All before AI tools.', x: 60, y: 22, w: 34, h: 30 },
      { id: 7, kind: 'shape', shape: 'star', color: '#65b8be', x: 70, y: 62, w: 16, h: 26 },
    ],
  },
];

function ShapeArt({ shape, color }: { shape: Shape; color: string }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full" aria-hidden="true">
      {shape === 'circle' && <circle cx="50" cy="50" r="50" fill={color} />}
      {shape === 'star' && <path d="m50 2 13 33 35 2-27 22 9 35-30-19-30 19 9-35L2 37l35-2z" fill={color} />}
      {shape === 'arrow' && <path d="M4 42h62V18l30 32-30 32V58H4z" fill={color} />}
    </svg>
  );
}

function ItemArt({ element }: { element: Item }) {
  if (element.kind === 'shape') return <ShapeArt shape={element.shape!} color={element.color!} />;
  if (element.kind === 'image') {
    // A picture placeholder drawn in the brand colors.
    return (
      <svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid slice" className="size-full rounded-[0.8cqw]" aria-hidden="true">
        <rect width="160" height="110" fill="#aad5ed" />
        <circle cx="122" cy="30" r="14" fill="#f7da49" />
        <path d="M0 110 50 52l30 32 22-20 58 46z" fill="#4e409b" />
        <path d="M60 110 102 64l58 46z" fill="#65b8be" />
      </svg>
    );
  }
  if (element.kind === 'video') {
    return (
      <div className="relative flex size-full items-center justify-center overflow-hidden rounded-[0.8cqw] bg-gradient-to-br from-[#4e409b] to-[#6b5cc0]">
        <span className="absolute -top-[20%] -right-[10%] aspect-square w-[45%] rounded-full bg-[#f7da49]/80" />
        <span className="relative flex aspect-square w-[14%] items-center justify-center rounded-full bg-white/90 text-[2.2cqw] text-[#4e409b]">▶</span>
        <span className="absolute bottom-[6%] left-[5%] text-[1.5cqw] font-bold text-white">{element.text}</span>
      </div>
    );
  }
  return null;
}

/** One screen of the lesson, drawn in container units so it scales from a thumbnail to the full stage. */
function Board({
  screen,
  editable = false,
  selected,
  onSelect,
  onChange,
}: {
  screen: Screen;
  editable?: boolean;
  selected?: number | null;
  onSelect?: (id: number | null) => void;
  onChange?: (element: Item) => void;
}) {
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; mode: 'move' | 'size'; x: number; y: number; start: Item } | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  function begin(event: PointerEvent, element: Item, mode: 'move' | 'size') {
    if (!editable || editing === element.id) return;
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { id: element.id, mode, x: event.clientX, y: event.clientY, start: element };
    onSelect?.(element.id);
  }

  function move(event: PointerEvent) {
    const current = drag.current;
    if (!current) return;
    const box = board.current!.getBoundingClientRect();
    const dx = ((event.clientX - current.x) / box.width) * 100;
    const dy = ((event.clientY - current.y) / box.height) * 100;
    const start = current.start;
    onChange?.(
      current.mode === 'move'
        ? { ...start, x: start.x + dx, y: start.y + dy }
        : { ...start, w: Math.max(6, start.w + dx), h: Math.max(6, start.h + dy) },
    );
  }

  return (
    <div
      ref={board}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerDown={() => editable && onSelect?.(null)}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-white [container-type:inline-size]"
      style={editable ? { backgroundImage: 'radial-gradient(#e5e2f0 1px, transparent 1px)', backgroundSize: '2.5cqw 2.5cqw' } : undefined}
    >
      {screen.elements.map((element) => {
        const isSelected = editable && selected === element.id;
        return (
          <div
            key={element.id}
            onPointerDown={(event) => begin(event, element, 'move')}
            onDoubleClick={() => editable && element.kind === 'text' && setEditing(element.id)}
            className={`absolute ${editable ? 'cursor-move' : ''} ${isSelected ? 'outline-2 outline-offset-2 outline-[#4e409b]' : ''}`}
            style={{ left: `${element.x}%`, top: `${element.y}%`, width: `${element.w}%`, height: `${element.h}%` }}
          >
            {element.kind === 'text' ? (
              <p
                contentEditable={editing === element.id}
                suppressContentEditableWarning
                onBlur={(event) => {
                  setEditing(null);
                  onChange?.({ ...element, text: event.currentTarget.textContent ?? '' });
                }}
                className={`size-full leading-snug text-[#322d4d] outline-none ${element.id === screen.elements.find((item) => item.kind === 'text')?.id ? 'text-[4cqw] font-bold' : 'text-[2.2cqw]'} ${editing === element.id ? 'cursor-text rounded bg-[#f9f7ff]' : ''}`}
              >
                {element.text}
              </p>
            ) : (
              <ItemArt element={element} />
            )}
            {isSelected && (
              <span
                onPointerDown={(event) => begin(event, element, 'size')}
                className="absolute -right-1.5 -bottom-1.5 size-3 cursor-nwse-resize rounded-sm bg-[#4e409b]"
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Lesson() {
  const [stage, setStage] = useState<Stage>('create');
  const [reached, setReached] = useState(0);
  const [title, setTitle] = useState('What I built at Teacherly');
  const [screens, setScreens] = useState<Screen[]>(SEED);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [shapeTurn, setShapeTurn] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<string[]>(STUDENTS.map((student) => student.name));
  const [scheduled, setScheduled] = useState(false);
  const [grades, setGrades] = useState<Record<string, { grade: string; comment: string; present: boolean }>>(() =>
    Object.fromEntries(STUDENTS.map((student) => [student.name, { grade: 'A', comment: '', present: true }])),
  );
  const [published, setPublished] = useState(false);

  const screen = screens[current];

  function go(next: Stage) {
    const index = STAGES.findIndex((item) => item.id === next);
    setReached((value) => Math.max(value, index));
    setStage(next);
    setSelected(null);
  }

  function update(element: Item) {
    setScreens((all) =>
      all.map((item, index) =>
        index === current ? { ...item, elements: item.elements.map((old) => (old.id === element.id ? element : old)) } : item,
      ),
    );
  }

  function add(kind: Kind) {
    const offset = (screen.elements.length % 4) * 4;
    const element: Item = {
      id: nextId++,
      kind,
      x: 30 + offset,
      y: 26 + offset,
      w: kind === 'text' ? 36 : kind === 'shape' ? 14 : 34,
      h: kind === 'text' ? 16 : kind === 'shape' ? 24 : 44,
      text: kind === 'text' ? 'Double-click to edit' : kind === 'video' ? 'A new video' : undefined,
      shape: kind === 'shape' ? SHAPES[shapeTurn % SHAPES.length] : undefined,
      color: kind === 'shape' ? COLORS[shapeTurn % COLORS.length] : undefined,
    };
    if (kind === 'shape') setShapeTurn((value) => value + 1);
    setScreens((all) => all.map((item, index) => (index === current ? { ...item, elements: [...item.elements, element] } : item)));
    setSelected(element.id);
  }

  function remove() {
    if (selected === null) return;
    setScreens((all) =>
      all.map((item, index) => (index === current ? { ...item, elements: item.elements.filter((element) => element.id !== selected) } : item)),
    );
    setSelected(null);
  }

  function onKeyDown(event: KeyboardEvent) {
    const typing = (event.target as HTMLElement).isContentEditable || (event.target as HTMLElement).tagName === 'INPUT';
    if (typing || selected === null) return;
    if (event.key === 'Delete' || event.key === 'Backspace') remove();
    if (event.key === 'Escape') {
      // Keep Escape for the selection, not for "back to intro".
      event.preventDefault();
      setSelected(null);
    }
  }

  const slotLabel = slot ? `${DAYS[Number(slot.split('-')[0])]}, ${PERIODS[Number(slot.split('-')[1])]}` : null;

  return (
    <div
      onKeyDown={onKeyDown}
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#e5e2f0] bg-white font-helvetica text-tl-ink shadow-[0_30px_70px_-35px_rgb(78_64_155/0.45)]"
    >
      <header className="flex items-center gap-5 border-b border-[#eeebf7] px-5 py-3">
        <span className="font-dancing text-2xl font-bold text-tl-purple">
          Teacher<span className="text-tl-teal">ly</span>
        </span>
        <ol className="flex items-center gap-1 text-sm">
          {STAGES.map((item, index) => (
            <li key={item.id} className="flex items-center gap-1">
              {index > 0 && <span className="text-tl-ink/30">›</span>}
              <button
                type="button"
                disabled={index > reached}
                onClick={() => go(item.id)}
                aria-current={stage === item.id ? 'step' : undefined}
                className="cursor-pointer rounded-full px-3 py-1 disabled:cursor-default disabled:text-tl-ink/35 aria-[current=step]:bg-tl-purple aria-[current=step]:text-white"
              >
                {index + 1}. {item.label}
              </button>
            </li>
          ))}
        </ol>
        {stage === 'teach' && (
          <span className="ml-auto text-sm text-tl-ink/60">
            <LiveClock />
          </span>
        )}
      </header>

      {stage === 'create' && (
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-40 shrink-0 flex-col gap-2 overflow-y-auto border-r border-[#eeebf7] bg-tl-mist p-3" aria-label="Screens">
            {screens.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCurrent(index);
                  setSelected(null);
                }}
                aria-current={index === current || undefined}
                className="cursor-pointer rounded-lg border-2 border-transparent p-1 text-left text-xs aria-[current=true]:border-tl-purple"
              >
                <div className="pointer-events-none">
                  <Board screen={item} />
                </div>
                <span className="mt-1 block">Screen {index + 1}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setScreens((all) => [...all, { id: nextId++, elements: [] }]);
                setCurrent(screens.length);
              }}
              className="cursor-pointer rounded-lg border-2 border-dashed border-[#d9d4ee] py-3 text-xs font-bold text-tl-purple"
            >
              + Add screen
            </button>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-[#eeebf7] px-5 py-2.5">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-label="Lesson title"
                className="mr-auto min-w-0 flex-1 rounded-md px-2 py-1 font-bold outline-none focus:bg-tl-mist"
              />
              {(['text', 'image', 'video', 'shape'] as Kind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => add(kind)}
                  className="cursor-pointer rounded-full border border-[#d9d4ee] px-3 py-1 text-sm capitalize hover:border-tl-purple hover:text-tl-purple"
                >
                  + {kind === 'shape' ? 'Shape' : kind}
                </button>
              ))}
              <button
                type="button"
                onClick={remove}
                disabled={selected === null}
                className="cursor-pointer rounded-full px-3 py-1 text-sm text-[#c2410c] disabled:cursor-default disabled:text-tl-ink/30"
              >
                Delete
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-tl-mist p-5">
              <div className="w-full max-w-[min(100%,calc((82svh-9rem)*16/9))]">
                <Board screen={screen} editable selected={selected} onSelect={setSelected} onChange={update} />
              </div>
            </div>
            <div className="flex items-center justify-end border-t border-[#eeebf7] px-5 py-3 text-sm">
              <PrimaryButton onClick={() => go('schedule')}>Next: schedule it</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {stage === 'schedule' && (
        <div className="flex min-h-0 flex-1 gap-5 p-5">
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-sm">
              Pick a free period for <span className="font-bold">{title}</span> ({screens.length} screens).
            </p>
            <div className="grid grid-cols-[4rem_repeat(5,minmax(0,1fr))] gap-1.5 text-sm">
              <span />
              {DAYS.map((day) => (
                <span key={day} className="text-center font-bold">
                  {day}
                </span>
              ))}
              {PERIODS.map((time, period) => (
                <PeriodRow key={time} time={time} period={period} slot={slot} onPick={setSlot} title={title} />
              ))}
            </div>
          </div>
          <aside className="flex w-64 shrink-0 flex-col rounded-xl bg-tl-mist p-4" aria-label="Class">
            <p className="font-bold">Front-end team</p>
            <p className="text-xs text-tl-ink/60">{assigned.length} of {STUDENTS.length} students</p>
            <ul className="mt-3 space-y-2">
              {STUDENTS.map((student) => (
                <li key={student.name}>
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={assigned.includes(student.name)}
                      onChange={(event) =>
                        setAssigned((all) => (event.target.checked ? [...all, student.name] : all.filter((name) => name !== student.name)))
                      }
                      className="accent-[#4e409b]"
                    />
                    <Avatar name={student.name} color={student.color} />
                    {student.name}
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              {scheduled && slotLabel && (
                <p className="mb-3 text-sm text-[#2e7d6f]">
                  Assigned to {assigned.length} students for {slotLabel}.
                </p>
              )}
              <PrimaryButton
                disabled={!slot || assigned.length === 0}
                onClick={() => (scheduled ? go('teach') : setScheduled(true))}
              >
                {scheduled ? 'Start the lesson' : 'Assign lesson'}
              </PrimaryButton>
            </div>
          </aside>
        </div>
      )}

      {stage === 'teach' && (
        <Call screens={screens} students={STUDENTS.filter((student) => assigned.includes(student.name))} onEnd={() => go('grade')} />
      )}

      {stage === 'grade' && (
        <div className="flex min-h-0 flex-1 flex-col p-5">
          <p className="text-sm">
            <span className="font-bold">{title}</span>
            {slotLabel && `, ${slotLabel}`}. Grade the class.
          </p>
          <table className="mt-4 w-full border-separate border-spacing-y-1.5 text-sm">
            <thead className="text-left text-tl-ink/60">
              <tr>
                <th className="px-3 font-normal">Student</th>
                <th className="px-3 font-normal">Present</th>
                <th className="px-3 font-normal">Grade</th>
                <th className="px-3 font-normal">Comment</th>
                <th className="px-3" />
              </tr>
            </thead>
            <tbody>
              {STUDENTS.filter((student) => assigned.includes(student.name)).map((student) => {
                const row = grades[student.name];
                const set = (patch: Partial<typeof row>) => setGrades((all) => ({ ...all, [student.name]: { ...all[student.name], ...patch } }));
                return (
                  <tr key={student.name} className="bg-tl-mist">
                    <td className="rounded-l-lg px-3 py-2">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={student.name} color={student.color} />
                        {student.name}
                      </span>
                    </td>
                    <td className="px-3">
                      <input type="checkbox" checked={row.present} onChange={(event) => set({ present: event.target.checked })} className="accent-[#4e409b]" aria-label={`${student.name} was present`} />
                    </td>
                    <td className="px-3">
                      <select value={row.grade} onChange={(event) => set({ grade: event.target.value })} disabled={published} className="rounded-md border border-[#d9d4ee] bg-white px-2 py-1" aria-label={`Grade for ${student.name}`}>
                        {GRADES.map((grade) => (
                          <option key={grade}>{grade}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3">
                      <input value={row.comment} onChange={(event) => set({ comment: event.target.value })} disabled={published} placeholder="A short note for the student" className="w-full rounded-md border border-[#d9d4ee] bg-white px-2 py-1" aria-label={`Comment for ${student.name}`} />
                    </td>
                    <td className="rounded-r-lg px-3 text-xs text-[#2e7d6f]">{published ? 'Sent' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-auto flex items-center justify-between pt-4 text-sm">
            <span className="text-tl-ink/60">
              {published ? 'Grades are in the students’ reports.' : 'Grades go to each student’s report when you publish them.'}
            </span>
            {published ? (
              <PrimaryButton onClick={() => go('create')}>Plan the next lesson</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => setPublished(true)}>Publish grades</PrimaryButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PeriodRow({ time, period, slot, onPick, title }: { time: string; period: number; slot: string | null; onPick: (slot: string) => void; title: string }) {
  return (
    <>
      <span className="self-center text-xs text-tl-ink/60 tabular-nums">{time}</span>
      {DAYS.map((_, day) => {
        const key = `${day}-${period}`;
        const busy = BUSY[key];
        const picked = slot === key;
        return (
          <button
            key={key}
            type="button"
            disabled={Boolean(busy)}
            onClick={() => onPick(key)}
            className="h-12 cursor-pointer truncate rounded-lg border-2 px-2 text-left text-xs disabled:cursor-default"
            style={
              busy
                ? { borderColor: 'transparent', background: '#f1eff8', color: '#322d4d99' }
                : picked
                  ? { borderColor: PURPLE, background: PURPLE, color: '#fff', fontWeight: 700 }
                  : { borderColor: '#e5e2f0', background: '#fff' }
            }
          >
            {busy ?? (picked ? title : '')}
          </button>
        );
      })}
    </>
  );
}

function PrimaryButton({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-full bg-tl-purple px-5 py-2.5 text-sm font-bold text-white disabled:cursor-default disabled:bg-[#c9c4e0]"
    >
      {children} ›
    </button>
  );
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: color }}>
      {name[0]}
    </span>
  );
}

function LiveClock() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const text = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <span className="flex items-center gap-2">
      <span className="size-2 rounded-full bg-[#e5484d]" aria-hidden="true" /> Live {text}
    </span>
  );
}

const PENS = ['#4e409b', '#65b8be', '#e6a2ba', '#f2c979'];

function Call({ screens, students, onEnd }: { screens: Screen[]; students: typeof STUDENTS; onEnd: () => void }) {
  const [slide, setSlide] = useState(0);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const [pen, setPen] = useState<string | null>(null);
  const [hand, setHand] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [speaking, setSpeaking] = useState(0);
  const [chat, setChat] = useState([
    { from: 'Asel', text: 'Can we see the redesign screen again at the end?' },
    { from: 'Nurlan', text: 'The video starts fast now 👍' },
  ]);
  const [draft, setDraft] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  // Someone is always talking in a class.
  useEffect(() => {
    const timer = setInterval(() => setSpeaking((value) => (value + 1 + Math.floor(Math.random() * 3)) % (students.length + 1)), 2600);
    return () => clearInterval(timer);
  }, [students.length]);

  useEffect(() => {
    const element = canvas.current!;
    const resize = () => {
      const ratio = Math.min(devicePixelRatio, 2);
      element.width = element.clientWidth * ratio;
      element.height = element.clientHeight * ratio;
      element.getContext('2d')!.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const clear = () => {
    const element = canvas.current!;
    element.getContext('2d')!.clearRect(0, 0, element.width, element.height);
  };

  const point = (event: PointerEvent) => {
    const box = canvas.current!.getBoundingClientRect();
    return [event.clientX - box.left, event.clientY - box.top] as const;
  };

  function turn(to: number) {
    setSlide(Math.max(0, Math.min(screens.length - 1, to)));
    clear();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#1f1b33] text-white">
      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-xl bg-[#2b2645] p-3">
            <div className="relative w-full max-w-[min(100%,calc((82svh-12rem)*16/9))]">
              <Board screen={screens[slide]} />
              <canvas
                ref={canvas}
                onPointerDown={(event) => {
                  if (!pen) return;
                  drawing.current = true;
                  canvas.current!.setPointerCapture(event.pointerId);
                  const context = canvas.current!.getContext('2d')!;
                  Object.assign(context, { strokeStyle: pen, lineWidth: 4, lineCap: 'round', lineJoin: 'round' });
                  context.beginPath();
                  context.moveTo(...point(event));
                }}
                onPointerMove={(event) => {
                  if (!drawing.current) return;
                  const context = canvas.current!.getContext('2d')!;
                  context.lineTo(...point(event));
                  context.stroke();
                }}
                onPointerUp={() => (drawing.current = false)}
                className={`absolute inset-0 size-full ${pen ? 'cursor-crosshair' : 'pointer-events-none'}`}
                aria-label="Annotation layer"
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm">
            <button type="button" onClick={() => turn(slide - 1)} disabled={slide === 0} className="cursor-pointer rounded-full bg-white/10 px-3 py-1 disabled:opacity-30">
              ‹ Previous
            </button>
            <span className="tabular-nums text-white/70">
              Screen {slide + 1} of {screens.length}
            </span>
            <button type="button" onClick={() => turn(slide + 1)} disabled={slide === screens.length - 1} className="cursor-pointer rounded-full bg-white/10 px-3 py-1 disabled:opacity-30">
              Next ›
            </button>
          </div>
        </div>

        <div className="grid w-56 shrink-0 auto-rows-fr grid-cols-2 gap-2">
          <Tile name="Roman (teacher)" color={PURPLE} speaking={speaking === 0 && mic} muted={!mic} camera={camera} hand={hand} wide />
          {students.map((student, index) => (
            <Tile key={student.name} name={student.name} color={student.color} speaking={speaking === index + 1} muted={speaking !== index + 1} camera />
          ))}
        </div>

        {chatOpen && (
          <aside className="flex w-60 shrink-0 flex-col rounded-xl bg-white text-tl-ink" aria-label="Chat">
            <p className="border-b border-[#eeebf7] px-3 py-2 text-sm font-bold">Class chat</p>
            <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
              {chat.map((message, index) => (
                <p key={index}>
                  <span className="font-bold">{message.from}</span> {message.text}
                </p>
              ))}
            </div>
            <form
              className="border-t border-[#eeebf7] p-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.trim()) return;
                setChat((all) => [...all, { from: 'Roman', text: draft.trim() }]);
                setDraft('');
              }}
            >
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Message the class" aria-label="Message the class" className="w-full rounded-lg bg-tl-mist px-3 py-2 outline-none" />
            </form>
          </aside>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-white/10 px-4 py-3">
        <Control active={mic} onClick={() => setMic(!mic)} label={mic ? 'Mute' : 'Unmute'} />
        <Control active={camera} onClick={() => setCamera(!camera)} label={camera ? 'Stop video' : 'Start video'} />
        <Control active={pen !== null} onClick={() => setPen(pen ? null : PENS[0])} label="Annotate" />
        {pen && (
          <span className="flex items-center gap-1.5 px-1">
            {PENS.map((color) => (
              <button key={color} type="button" onClick={() => setPen(color)} aria-label={`Pen color ${color}`} aria-pressed={pen === color} className="size-5 cursor-pointer rounded-full ring-white aria-pressed:ring-2" style={{ background: color }} />
            ))}
            <button type="button" onClick={clear} className="cursor-pointer px-2 text-xs text-white/70 hover:text-white">
              Clear
            </button>
          </span>
        )}
        <Control active={hand} onClick={() => setHand(!hand)} label={hand ? 'Lower hand' : 'Raise hand'} />
        <Control active={chatOpen} onClick={() => setChatOpen(!chatOpen)} label="Chat" />
        <button type="button" onClick={onEnd} className="ml-3 cursor-pointer rounded-full bg-[#e5484d] px-4 py-2 text-sm font-bold">
          End lesson and grade
        </button>
      </div>
    </div>
  );
}

function Control({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-full px-3.5 py-2 text-sm transition-colors ${active ? 'bg-white/15' : 'bg-white/5 text-white/60'} hover:bg-white/25`}
    >
      {label}
    </button>
  );
}

function Tile({ name, color, speaking, muted, camera, hand = false, wide = false }: {
  name: string;
  color: string;
  speaking: boolean;
  muted: boolean;
  camera: boolean;
  hand?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-lg transition-shadow ${wide ? 'col-span-2' : ''}`}
      style={{ background: camera ? `${color}33` : '#2b2645', boxShadow: speaking ? 'inset 0 0 0 3px #65b8be' : undefined }}
    >
      <span className="flex size-11 items-center justify-center rounded-full text-sm font-bold" style={{ background: color, color: color === PURPLE ? '#fff' : '#322d4d' }}>
        {name[0]}
      </span>
      {hand && (
        <span className="absolute top-1.5 left-2 text-lg" aria-label="Hand raised">
          ✋
        </span>
      )}
      <span className="absolute bottom-1 left-2 text-xs">
        {name}
        {muted && <span className="ml-1 text-white/50">(muted)</span>}
      </span>
    </div>
  );
}
