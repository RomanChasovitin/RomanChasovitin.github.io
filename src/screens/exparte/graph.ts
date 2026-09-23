import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { findings, links, nodes, type GraphNode, type NodeKind } from './data';

// Brand tokens from styles/brands.css. A canvas cannot use CSS variables directly.
const COLOR = {
  rule: '#343640',
  blue: '#0061ff',
  cyan: '#06e8d8',
  mist: '#989daf',
  slate: '#727696',
  white: '#ffffff',
};
const RADIUS: Record<NodeKind, number> = { matter: 7, finding: 6, tech: 4.5, entity: 2.4 };
const LABEL_FONT = '11px "Geist Mono Variable", ui-monospace, monospace';
const ASSEMBLE_MS = 1800;
const HOP_MS = 420;
const ARRIVAL_MS = 700;
const PULSE_MS = 1800;
const HIT_RADIUS = 14;
/** Record entities stay a step behind the systems. */
const ENTITY_ALPHA = 0.7;
/** Soft edge of the open zone, px. */
const SOFT = 90;
/** Space kept for labels to the right of the rightmost core node, px. */
const LABEL_ROOM = 120;

// Pointer physics: nodes near the cursor are pushed away and spring back.
const PUSH_RADIUS = 130;
const PUSH_STRENGTH = 2.2;
const SPRING = 0.06;
const DAMPING = 0.86;
/** How far the whole graph leans away from the pointer, in px. */
const PARALLAX = 16;

type SimNode = GraphNode &
  SimulationNodeDatum & { depth: number; phase: number; ox: number; oy: number; vx2: number; vy2: number };
type SimLink = SimulationLinkDatum<SimNode> & { source: SimNode; target: SimNode };
type Drawn = { x: number; y: number; alpha: number };

type Options = {
  reducedMotion: boolean;
  /** The open part of the screen, between the text and the side nav, in canvas x. Only it is interactive. */
  zone(): { left: number; right: number };
  /** An agent was sent to a finding, by a click on the canvas or by `run()`. */
  onRun(findingId: string): void;
  /** The agent reached `path[reached]`. */
  onStep(path: string[], reached: number): void;
  onArrive(findingId: string): void;
};

export type Graph = ReturnType<typeof createGraph>;

/** Deterministic random source, so the layout is the same on every load. */
function lcg(seed: number) {
  let state = seed;
  return () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function createGraph(canvas: HTMLCanvasElement, options: Options) {
  const context = canvas.getContext('2d')!;
  const byId = new Map<string, SimNode>();
  const simNodes: SimNode[] = nodes.map((node, index) => {
    const simNode: SimNode = { ...node, depth: 0, phase: index * 2.399, ox: 0, oy: 0, vx2: 0, vy2: 0 };
    byId.set(node.id, simNode);
    return simNode;
  });

  const neighbors = new Map<string, Set<string>>(nodes.map((node) => [node.id, new Set<string>()]));
  const edges = new Set<string>();
  for (const [a, b] of links) {
    neighbors.get(a)!.add(b);
    neighbors.get(b)!.add(a);
    edges.add(edgeKey(a, b));
  }
  for (const finding of findings) {
    finding.path.slice(1).forEach((id, index) => {
      if (!edges.has(edgeKey(finding.path[index], id))) {
        throw new Error(`Finding "${finding.id}": no link ${finding.path[index]} → ${id}`);
      }
    });
  }

  const isEntity = (node: SimNode) => node.kind === 'entity';
  const simLinks = links.map(([source, target]) => ({ source, target })) as unknown as SimLink[];
  forceSimulation(simNodes)
    .randomSource(lcg(7))
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((node) => node.id)
        .distance((link) => (isEntity(link.source) && isEntity(link.target) ? 30 : 40))
        .strength(0.5),
    )
    .force(
      'charge',
      forceManyBody<SimNode>().strength((node) => (isEntity(node) ? -70 : -150)),
    )
    .force(
      'collide',
      forceCollide<SimNode>((node) => RADIUS[node.kind] + 7),
    )
    // A compact core of systems; the record spreads around it.
    .force(
      'x',
      forceX<SimNode>(0).strength((node) => (isEntity(node) ? 0.02 : 0.15)),
    )
    .force('y', forceY(0).strength(0.05))
    .stop()
    .tick(500);

  // Ring number from the matter drives the assembly: the graph grows out of the matter.
  const queue = ['matter'];
  const seen = new Set(queue);
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of neighbors.get(id)!) {
      if (seen.has(next)) continue;
      seen.add(next);
      byId.get(next)!.depth = byId.get(id)!.depth + 1;
      queue.push(next);
    }
  }
  const maxDepth = Math.max(...simNodes.map((node) => node.depth));

  const core = simNodes.filter((node) => !isEntity(node));
  const coreMinX = Math.min(...core.map((node) => node.x!));
  const coreMaxX = Math.max(...core.map((node) => node.x!));
  const coreMinY = Math.min(...core.map((node) => node.y!));
  const coreMaxY = Math.max(...core.map((node) => node.y!));
  const minX = Math.min(...simNodes.map((node) => node.x!));
  const maxX = Math.max(...simNodes.map((node) => node.x!));
  const minY = Math.min(...simNodes.map((node) => node.y!));
  const maxY = Math.max(...simNodes.map((node) => node.y!));

  let width = 0;
  let height = 0;
  let wide = true;
  let zone = { left: 0, right: 0 };
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function fit() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    wide = width >= 900;
    zone = wide ? options.zone() : { left: 0, right: width };
    // Wide screens fill the whole screen, dim under the text and the nav; narrow ones put it below the text.
    const region = wide
      ? { x: width * 0.02, y: height * 0.04, w: width * 0.96, h: height * 0.92 }
      : { x: width * 0.04, y: height * 0.46, w: width * 0.92, h: height * 0.5 };
    scale = Math.min(region.w / (maxX - minX), region.h / (maxY - minY));
    offsetX = region.x + (region.w - (maxX - minX) * scale) / 2 - minX * scale;
    offsetY = region.y + (region.h - (maxY - minY) * scale) / 2 - minY * scale;
    if (!wide) return;
    // The core, labels included, has to fit the open zone; it is centered there and the record follows.
    const room = zone.right - zone.left - 2 * SOFT - LABEL_ROOM;
    scale = Math.min(scale, room / (coreMaxX - coreMinX));
    offsetX = (zone.left + zone.right - LABEL_ROOM) / 2 - ((coreMinX + coreMaxX) / 2) * scale;
    offsetY = height / 2 - ((coreMinY + coreMaxY) / 2) * scale;
  }

  const DIM = 0.22;
  /** Full inside the open zone, dim under the text and the nav, a little darker at the top and bottom. */
  const fade = (x: number, y: number) => {
    if (!wide) return 1;
    const inside = smoothstep(zone.left - SOFT, zone.left + SOFT, x) * smoothstep(zone.right + SOFT, zone.right - SOFT, x);
    const vertical = 0.6 + 0.4 * smoothstep(0, height * 0.12, y) * smoothstep(height, height * 0.88, y);
    return (DIM + (1 - DIM) * inside) * vertical;
  };
  const interactive = (point: Drawn) => !wide || (point.x > zone.left && point.x < zone.right);

  let running = false;
  let frame = 0;
  let lastTime = 0;
  let assembleStart: number | null = null;
  let assembled = options.reducedMotion;
  let resolveAssembled = () => {};
  const whenAssembled = new Promise<void>((resolve) => {
    resolveAssembled = resolve;
    if (assembled) resolve();
  });

  let pointer: { x: number; y: number } | null = null;
  let lean = { x: 0, y: 0 };
  let hovered: SimNode | null = null;
  let agent: { id: string; path: string[]; startedAt: number; reached: number } | null = null;
  let litPath: string[] = [];
  let arrival: { id: string; at: number } | null = null;
  const visited = new Set<string>();
  const drawn = new Map<string, Drawn>();

  /** Where a node rests this frame: layout position, the whole graph floating, its own drift, the lean. */
  function rest(node: SimNode, time: number) {
    const still = options.reducedMotion;
    const floatX = still ? 0 : Math.sin(time * 0.00023) * 6;
    const floatY = still ? 0 : Math.sin(time * 0.00031 + 1) * 9;
    const drift = still ? 0 : 2.4;
    // Systems sit "closer" than the record, so they lean further.
    const depth = isEntity(node) ? 0.5 : 1;
    return {
      x: offsetX + node.x! * scale + floatX + Math.sin(time * 0.00042 + node.phase) * drift + lean.x * depth,
      y: offsetY + node.y! * scale + floatY + Math.cos(time * 0.00036 + node.phase * 1.3) * drift + lean.y * depth,
    };
  }

  function step(time: number) {
    const dt = clamp((time - (lastTime || time)) / 16.7, 0, 3);
    lastTime = time;

    const target = pointer && !options.reducedMotion
      ? { x: -((pointer.x / width) * 2 - 1) * PARALLAX, y: -((pointer.y / height) * 2 - 1) * PARALLAX * 0.6 }
      : { x: 0, y: 0 };
    lean = { x: lean.x + (target.x - lean.x) * 0.05 * dt, y: lean.y + (target.y - lean.y) * 0.05 * dt };

    for (const node of simNodes) {
      if (!options.reducedMotion && pointer) {
        const home = rest(node, time);
        const dx = home.x + node.ox - pointer.x;
        const dy = home.y + node.oy - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < PUSH_RADIUS) {
          const force = (1 - distance / PUSH_RADIUS) ** 2 * PUSH_STRENGTH * dt;
          node.vx2 += (dx / distance) * force;
          node.vy2 += (dy / distance) * force;
        }
      }
      node.vx2 = (node.vx2 - node.ox * SPRING * dt) * DAMPING ** dt;
      node.vy2 = (node.vy2 - node.oy * SPRING * dt) * DAMPING ** dt;
      node.ox += node.vx2 * dt;
      node.oy += node.vy2 * dt;
    }
  }

  function place(node: SimNode, time: number, assembly: number): Drawn {
    const home = rest(node, time);
    const x = home.x + node.ox;
    const y = home.y + node.oy;
    const alpha = fade(x, y) * (isEntity(node) ? ENTITY_ALPHA : 1);
    if (assembly >= 1) return { x, y, alpha };
    const matter = byId.get('matter')!;
    const originX = offsetX + matter.x! * scale;
    const originY = offsetY + matter.y! * scale;
    const t = easeOutCubic(clamp((assembly * (maxDepth + 2) - node.depth) / 2, 0, 1));
    return { x: originX + (x - originX) * t, y: originY + (y - originY) * t, alpha: alpha * t };
  }

  function line(a: Drawn, b: Drawn) {
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  }

  function circle(point: Drawn, radius: number) {
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  }

  function draw(time: number) {
    let assembly = 1;
    if (!assembled) {
      assembly = clamp((time - (assembleStart ?? time)) / ASSEMBLE_MS, 0, 1);
      if (assembly >= 1) {
        assembled = true;
        resolveAssembled();
      }
    }

    step(time);
    for (const node of simNodes) drawn.set(node.id, place(node, time, assembly));

    // Agent progress.
    let dot: Drawn | null = null;
    if (agent) {
      const hops = agent.path.length - 1;
      const progress = Math.min((time - agent.startedAt) / HOP_MS, hops);
      const reached = Math.floor(progress);
      if (reached > agent.reached) {
        agent.reached = reached;
        options.onStep(agent.path, reached);
      }
      if (progress >= hops) {
        visited.add(agent.id);
        arrival = { id: agent.id, at: time };
        options.onArrive(agent.id);
        agent = null;
      } else {
        const from = drawn.get(agent.path[reached])!;
        const to = drawn.get(agent.path[reached + 1])!;
        const t = progress - reached;
        dot = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, alpha: 1 };
      }
    }

    const focus = hovered ? new Set([hovered.id, ...neighbors.get(hovered.id)!]) : null;
    const litCount = agent ? agent.reached + 1 : litPath.length;
    const lit = new Set(litPath.slice(0, litCount));

    context.clearRect(0, 0, width, height);

    // Edges.
    context.lineWidth = 1;
    context.strokeStyle = COLOR.rule;
    for (const link of simLinks) {
      const a = drawn.get(link.source.id)!;
      const b = drawn.get(link.target.id)!;
      const inFocus = focus?.has(link.source.id) && focus.has(link.target.id);
      context.globalAlpha = Math.min(a.alpha, b.alpha) * (focus ? (inFocus ? 1 : 0.25) : 0.75);
      if (inFocus) context.strokeStyle = COLOR.slate;
      line(a, b);
      if (inFocus) context.strokeStyle = COLOR.rule;
    }

    // The agent's route so far.
    context.globalAlpha = 1;
    context.strokeStyle = COLOR.cyan;
    context.lineWidth = 1.5;
    context.shadowColor = COLOR.cyan;
    context.shadowBlur = 8;
    for (let i = 1; i < litCount; i++) line(drawn.get(litPath[i - 1])!, drawn.get(litPath[i])!);
    if (agent && dot) line(drawn.get(agent.path[agent.reached])!, dot);
    context.shadowBlur = 0;

    // Nodes.
    for (const node of simNodes) {
      const point = drawn.get(node.id)!;
      const dim = focus && !focus.has(node.id);
      context.globalAlpha = point.alpha * (dim ? 0.35 : 1);
      const radius = RADIUS[node.kind];
      if (node.kind === 'entity') context.fillStyle = lit.has(node.id) ? COLOR.cyan : COLOR.slate;
      else if (node.kind === 'tech') context.fillStyle = COLOR.blue;
      else if (node.kind === 'finding') context.fillStyle = COLOR.cyan;
      else context.fillStyle = COLOR.white;
      circle(point, node === hovered ? radius + 1.5 : radius);
      context.fill();

      // Unvisited findings pulse until the agent has been there.
      if (node.kind === 'finding' && !visited.has(node.id) && assembled) {
        const wave = options.reducedMotion ? 0.4 : (((time / PULSE_MS + node.phase) % 1) + 1) % 1;
        context.globalAlpha = point.alpha * (1 - wave) * 0.6 * (dim ? 0.35 : 1);
        context.strokeStyle = COLOR.cyan;
        context.lineWidth = 1;
        circle(point, radius + 3 + wave * 10);
        context.stroke();
      }
    }

    if (arrival) {
      const point = drawn.get(arrival.id)!;
      const age = (time - arrival.at) / ARRIVAL_MS;
      if (age < 1 && !options.reducedMotion) {
        context.globalAlpha = 1 - age;
        context.strokeStyle = COLOR.cyan;
        context.lineWidth = 2;
        circle(point, RADIUS.finding + 4 + easeOutCubic(age) * 26);
        context.stroke();
      }
      // The finding the list shows keeps a steady ring.
      context.globalAlpha = 1;
      context.strokeStyle = COLOR.cyan;
      context.lineWidth = 1.5;
      circle(point, RADIUS.finding + 4);
      context.stroke();
    }

    if (dot) {
      context.globalAlpha = 1;
      context.fillStyle = COLOR.cyan;
      context.shadowColor = COLOR.cyan;
      context.shadowBlur = 14;
      circle(dot, 3.5);
      context.fill();
      context.shadowBlur = 0;
    }

    // Labels: systems always, record entities only when they are in focus or on the route.
    context.font = LABEL_FONT;
    context.textBaseline = 'middle';
    for (const node of simNodes) {
      const point = drawn.get(node.id)!;
      if (point.alpha < (isEntity(node) ? 0.5 : 0.7)) continue;
      const inFocus = focus?.has(node.id) ?? false;
      if (isEntity(node) && !inFocus && !lit.has(node.id)) continue;
      context.globalAlpha = point.alpha * (focus && !inFocus ? 0.35 : 1);
      context.fillStyle = node.kind === 'tech' || isEntity(node) ? COLOR.mist : COLOR.white;
      context.fillText(node.label, point.x + RADIUS[node.kind] + 6, point.y);
    }
    context.globalAlpha = 1;
  }

  function loop(time: number) {
    draw(time);
    frame = requestAnimationFrame(loop);
  }

  function nodeAt(x: number, y: number) {
    let best: SimNode | null = null;
    let bestDistance = HIT_RADIUS;
    for (const node of simNodes) {
      const point = drawn.get(node.id);
      if (!point || !interactive(point)) continue;
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < bestDistance) {
        best = node;
        bestDistance = distance;
      }
    }
    return best;
  }

  function run(id: string) {
    const finding = findings.find((item) => item.id === id);
    if (!finding) return;
    options.onRun(id);
    litPath = finding.path;
    if (options.reducedMotion || !running) {
      agent = null;
      visited.add(id);
      arrival = { id, at: -Infinity };
      options.onStep(finding.path, finding.path.length - 1);
      options.onArrive(id);
      return;
    }
    agent = { id, path: finding.path, startedAt: performance.now(), reached: 0 };
    options.onStep(finding.path, 0);
  }

  const local = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  // The whole screen moves the graph; only the open part of the canvas can pick nodes.
  const area = canvas.parentElement!;
  area.addEventListener('pointermove', (event) => {
    pointer = local(event);
  });
  area.addEventListener('pointerleave', () => {
    pointer = null;
    hovered = null;
  });
  canvas.addEventListener('pointermove', (event) => {
    const { x, y } = local(event);
    hovered = nodeAt(x, y);
    canvas.style.cursor = hovered?.kind === 'finding' ? 'pointer' : '';
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = null;
  });
  canvas.addEventListener('click', () => {
    if (hovered?.kind === 'finding') run(hovered.id);
  });

  new ResizeObserver(fit).observe(canvas);
  fit();

  return {
    /** Resolves when the opening assembly has finished. */
    whenAssembled,
    run,
    start() {
      if (running) return;
      running = true;
      lastTime = 0;
      if (!assembled && assembleStart === null) assembleStart = performance.now();
      frame = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    },
  };
}
