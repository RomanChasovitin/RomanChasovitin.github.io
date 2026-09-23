import { useEffect, useRef, useState, type DragEvent, type PointerEvent, type ReactNode } from 'react';

// Teacherly, the product: build a lesson block by block, launch it, teach it on a video call.
// Student names are placeholders for the five front-end developers of the team.

type BlockId = 'title' | 'text' | 'video' | 'quiz';

const BLOCKS: { id: BlockId; label: string; color: string; icon: ReactNode }[] = [
  {
    id: 'title',
    label: 'Title',
    color: '#4e409b',
    icon: <path d="M5 6h14M12 6v13M9 19h6" />,
  },
  {
    id: 'text',
    label: 'Text',
    color: '#e6a2ba',
    icon: <path d="M5 7h14M5 11h14M5 15h9" />,
  },
  {
    id: 'video',
    label: 'Video',
    color: '#65b8be',
    icon: (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="m10.5 9.5 4 2.5-4 2.5z" />
      </>
    ),
  },
  {
    id: 'quiz',
    label: 'Quiz',
    color: '#f2c979',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M9.8 9.8a2.3 2.3 0 1 1 3 2.2c-.6.2-.8.6-.8 1.2M12 16h.01" />
      </>
    ),
  },
];

const STUDENTS = [
  { name: 'Asel', color: '#f7da49' },
  { name: 'Bekzat', color: '#65b8be' },
  { name: 'Nurlan', color: '#aad5ed' },
  { name: 'Aigerim', color: '#e6a2ba' },
  { name: 'Daniyar', color: '#f2c979' },
];

const PENS = ['#4e409b', '#65b8be', '#e6a2ba', '#f2c979'];

const QUIZ = ['The redesign', 'Video lessons', 'The lesson editor', 'All of the above'];

function Icon({ children, color }: { children: ReactNode; color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function LessonPage({ blocks, quizAnswer, onAnswer, playing, onPlay, small = false }: {
  blocks: BlockId[];
  quizAnswer: string | null;
  onAnswer?: (answer: string) => void;
  playing: boolean;
  onPlay?: () => void;
  small?: boolean;
}) {
  return (
    <div className={`flex flex-col ${small ? 'gap-3' : 'gap-5'}`}>
      {blocks.includes('title') && (
        <div className="lesson-block">
          <p className="text-xs font-bold text-tl-purple">Lesson 1</p>
          <h4 className={`${small ? 'text-xl' : 'text-3xl'} mt-1 font-bold`}>What I built at Teacherly</h4>
          <p className="mt-1 text-sm text-tl-ink/70">Front-End Maintainer, 2019–2021, through Mad Devs</p>
        </div>
      )}
      {blocks.includes('text') && (
        <p className={`lesson-block max-w-[36em] leading-relaxed ${small ? 'text-sm' : ''}`}>
          For a year and a half I maintained the app and redesigned all of it. I made creating and editing
          interactive lessons much better, and at the peak I led five front-end developers. All before AI tools.
        </p>
      )}
      {blocks.includes('video') && (
        <div className="lesson-block">
          <button
            type="button"
            onClick={onPlay}
            className="relative flex aspect-video w-full max-w-md cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-tl-purple to-[#6b5cc0] text-white"
            aria-label={playing ? 'Pause the video' : 'Play the video'}
          >
            <span className="absolute -top-8 -right-8 size-32 rounded-full bg-tl-yellow/80" />
            <span className="absolute -bottom-10 -left-6 size-28 rounded-full bg-tl-teal/80" />
            <span className="relative flex size-14 items-center justify-center rounded-full bg-white/90 text-tl-purple">
              {playing ? '❚❚' : '▶'}
            </span>
            {playing && <span className="video-progress absolute bottom-0 left-0 h-1 bg-tl-yellow" />}
          </button>
          <p className="mt-2 text-sm text-tl-ink/70">
            Video lessons: I added them at the 2020 peak, when every class went online.
          </p>
        </div>
      )}
      {blocks.includes('quiz') && (
        <div className="lesson-block">
          <p className="font-bold">Which of these did I build?</p>
          <div className="mt-2 grid max-w-md grid-cols-2 gap-2">
            {QUIZ.map((option) => {
              const picked = quizAnswer === option;
              const right = option === 'All of the above';
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onAnswer?.(option)}
                  className="cursor-pointer rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors"
                  style={{
                    borderColor: picked ? (right ? '#65b8be' : '#f2c979') : '#e5e2f0',
                    background: picked ? (right ? '#eaf6f7' : '#fdf6e6') : '#fff',
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {quizAnswer && (
            <p className="mt-2 text-sm">
              {quizAnswer === 'All of the above' ? 'Right: all three.' : 'Yes, and the other two as well.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Lesson() {
  const [blocks, setBlocks] = useState<BlockId[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [live, setLive] = useState(false);

  const nextBlock = BLOCKS[blocks.length]?.id ?? null;
  const step = Math.min(blocks.length + 1, BLOCKS.length + 1);

  function add(id: BlockId) {
    if (id === nextBlock) setBlocks((all) => [...all, id]);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    add(event.dataTransfer.getData('text/plain') as BlockId);
  }

  const instruction = nextBlock
    ? `Add the ${BLOCKS[blocks.length].label.toLowerCase()} block: click it or drag it onto the page.`
    : 'The lesson is ready. Launch it to teach it live.';

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#e5e2f0] bg-white font-helvetica text-tl-ink shadow-[0_30px_70px_-35px_rgb(78_64_155/0.45)]">
      <header className="flex items-center gap-4 border-b border-[#eeebf7] px-5 py-3">
        <span className="font-dancing text-2xl font-bold text-tl-purple">
          Teacher<span className="text-tl-teal">ly</span>
        </span>
        <span className="text-sm text-tl-ink/60">{live ? 'Live lesson' : 'Lesson builder'}</span>
        <span className="ml-auto text-sm text-tl-ink/60">
          {live ? <LiveClock /> : `Step ${step} of ${BLOCKS.length + 1}`}
        </span>
      </header>

      {!live ? (
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-44 shrink-0 flex-col gap-2 border-r border-[#eeebf7] bg-tl-mist p-3" aria-label="Blocks">
            {BLOCKS.map((block) => {
              const done = blocks.includes(block.id);
              const isNext = block.id === nextBlock;
              return (
                <button
                  key={block.id}
                  type="button"
                  draggable={isNext}
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', block.id)}
                  onClick={() => add(block.id)}
                  disabled={!isNext}
                  className={`flex items-center gap-2.5 rounded-lg border-2 bg-white px-3 py-2.5 text-left text-sm font-bold transition ${
                    isNext ? 'next-block cursor-grab border-tl-purple' : 'border-transparent'
                  } ${done ? 'opacity-45' : ''} ${!isNext && !done ? 'opacity-60' : ''}`}
                >
                  <Icon color={block.color}>{block.icon}</Icon>
                  {block.label}
                  {done && <span className="ml-auto text-tl-teal">✓</span>}
                </button>
              );
            })}
            <button
              type="button"
              disabled={nextBlock !== null}
              onClick={() => setLive(true)}
              className="mt-auto cursor-pointer rounded-full bg-tl-purple px-4 py-2.5 text-sm font-bold text-white disabled:cursor-default disabled:bg-[#c9c4e0]"
            >
              Launch lesson ›
            </button>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <p className="border-b border-[#eeebf7] px-6 py-2.5 text-sm" aria-live="polite">
              {instruction}
            </p>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`min-h-0 flex-1 overflow-y-auto p-6 transition-colors ${dragOver ? 'bg-tl-mist' : ''}`}
            >
              {blocks.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-[#d9d4ee] text-sm text-tl-ink/50">
                  An empty lesson. Start with the title block.
                </div>
              ) : (
                <LessonPage
                  blocks={blocks}
                  quizAnswer={quizAnswer}
                  onAnswer={setQuizAnswer}
                  playing={playing}
                  onPlay={() => setPlaying((value) => !value)}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <Call
          stage={<LessonPage blocks={blocks} quizAnswer={quizAnswer} onAnswer={setQuizAnswer} playing={playing} onPlay={() => setPlaying((value) => !value)} small />}
          onEnd={() => setLive(false)}
        />
      )}
    </div>
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

function Call({ stage, onEnd }: { stage: ReactNode; onEnd: () => void }) {
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const [pen, setPen] = useState<string | null>(null);
  const [hand, setHand] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [speaking, setSpeaking] = useState(0);
  const [chat, setChat] = useState([
    { from: 'Asel', text: 'Can we go back to the quiz after this?' },
    { from: 'Nurlan', text: 'The video block loads fast now 👍' },
  ]);
  const [draft, setDraft] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  // Someone is always talking in a class.
  useEffect(() => {
    const timer = setInterval(() => setSpeaking((value) => (value + 1 + Math.floor(Math.random() * 3)) % (STUDENTS.length + 1)), 2600);
    return () => clearInterval(timer);
  }, []);

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

  function point(event: PointerEvent) {
    const box = canvas.current!.getBoundingClientRect();
    return [event.clientX - box.left, event.clientY - box.top] as const;
  }

  function onPointerDown(event: PointerEvent) {
    if (!pen) return;
    drawing.current = true;
    canvas.current!.setPointerCapture(event.pointerId);
    const context = canvas.current!.getContext('2d')!;
    context.strokeStyle = pen;
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(...point(event));
  }

  function onPointerMove(event: PointerEvent) {
    if (!drawing.current) return;
    const context = canvas.current!.getContext('2d')!;
    context.lineTo(...point(event));
    context.stroke();
  }

  function clear() {
    const element = canvas.current!;
    element.getContext('2d')!.clearRect(0, 0, element.width, element.height);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#1f1b33] text-white">
      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-white p-5 text-tl-ink">
          <p className="absolute top-2 right-3 rounded-full bg-tl-mist px-2.5 py-0.5 text-xs text-tl-ink/70">
            Roman is sharing the lesson
          </p>
          <div className="h-full overflow-hidden">{stage}</div>
          <canvas
            ref={canvas}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drawing.current = false)}
            className={`absolute inset-0 size-full ${pen ? 'cursor-crosshair' : 'pointer-events-none'}`}
            aria-label="Annotation layer"
          />
        </div>

        <div className="grid w-60 shrink-0 auto-rows-fr grid-cols-2 gap-2">
          <Tile name="Roman (teacher)" color="#4e409b" speaking={speaking === 0 && mic} muted={!mic} camera={camera} hand={hand} wide />
          {STUDENTS.map((student, index) => (
            <Tile key={student.name} name={student.name} color={student.color} speaking={speaking === index + 1} muted={speaking !== index + 1} camera />
          ))}
        </div>

        {chatOpen && (
          <aside className="flex w-64 shrink-0 flex-col rounded-xl bg-white text-tl-ink" aria-label="Chat">
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
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Message the class"
                aria-label="Message the class"
                className="w-full rounded-lg bg-tl-mist px-3 py-2 outline-none"
              />
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
              <button
                key={color}
                type="button"
                onClick={() => setPen(color)}
                aria-label={`Pen color ${color}`}
                aria-pressed={pen === color}
                className="size-5 cursor-pointer rounded-full ring-white aria-pressed:ring-2"
                style={{ background: color }}
              />
            ))}
            <button type="button" onClick={clear} className="cursor-pointer px-2 text-xs text-white/70 hover:text-white">
              Clear
            </button>
          </span>
        )}
        <Control active={hand} onClick={() => setHand(!hand)} label={hand ? 'Lower hand' : 'Raise hand'} />
        <Control active={chatOpen} onClick={() => setChatOpen(!chatOpen)} label="Chat" />
        <button type="button" onClick={onEnd} className="ml-3 cursor-pointer rounded-full bg-[#e5484d] px-4 py-2 text-sm font-bold">
          End lesson
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
      style={{ background: camera ? `${color}33` : '#2b2645', boxShadow: speaking ? `inset 0 0 0 3px #65b8be` : undefined }}
    >
      <span
        className="flex size-11 items-center justify-center rounded-full text-sm font-bold text-tl-ink"
        style={{ background: color, color: color === '#4e409b' ? '#fff' : undefined }}
      >
        {name[0]}
      </span>
      {hand && <span className="absolute top-1.5 left-2 text-lg" aria-label="Hand raised">✋</span>}
      <span className="absolute bottom-1 left-2 text-xs">
        {name}
        {muted && <span className="ml-1 text-white/50">(muted)</span>}
      </span>
    </div>
  );
}
