// Screens sit on top of each other in one fixed viewport; the page never scrolls.
// The URL hash names the open screen, so links (`#exparte`, `#intro`), the browser's back button and shared
// URLs all work. Below 1024px a screen scrolls inside itself, and a project always opens at its top.
//
// Every move between two screens is the same: the left side of the old screen flies out over the left edge
// and its right side over the right edge, then the sides of the new screen fly in from there. The background
// changes from one color to the other the whole time.
//
// Sets `data-active-screen` and `data-theme` on <html> and fires `screen:change` on document. A
// `screen:open` event on document opens a screen, for the agent in the hero.

const LEAVE_MS = 420;
const ARRIVE_MS = 560;
const ARRIVE_DELAY = 340;
const TOTAL_MS = ARRIVE_DELAY + ARRIVE_MS;
const LEAVE_EASE = 'cubic-bezier(0.6, 0, 0.9, 0.4)';
const ARRIVE_EASE = 'cubic-bezier(0.1, 0.7, 0.2, 1)';
// Past the edge far enough that the shadow of a window goes too.
const CLEAR_PX = 100;

const screens = Array.from(document.querySelectorAll<HTMLElement>('[data-screen]'));
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let current: HTMLElement | null = null;
let finish: (() => void) | null = null;

const byId = (id: string) => screens.find((screen) => screen.id === id);
const fromHash = () => byId(decodeURIComponent(location.hash.slice(1))) ?? screens[0];

/** The sides of a screen, which fly, and the rest of it (a glow, blobs, the theme button), which fades. */
function parts(screen: HTMLElement) {
  const split = screen.querySelector<HTMLElement>(':scope > .split');
  const sides = split ? Array.from(split.children as HTMLCollectionOf<HTMLElement>) : [];
  const rest = Array.from(screen.children as HTMLCollectionOf<HTMLElement>).filter(
    (child) => child !== split && !(child instanceof HTMLScriptElement) && !(child instanceof HTMLStyleElement),
  );
  return { sides, rest };
}

/** How far a side moves to be off the screen: the first one over the left edge, the others over the right. */
function away(side: HTMLElement, index: number) {
  const rect = side.getBoundingClientRect();
  return `translateX(${index === 0 ? -(rect.right + CLEAR_PX) : innerWidth - rect.left + CLEAR_PX}px)`;
}

function settle(visible: HTMLElement) {
  for (const screen of screens) {
    const shown = screen === visible;
    screen.toggleAttribute('data-shown', shown);
    screen.toggleAttribute('data-front', false);
    screen.inert = !shown;
  }
}

function show(next: HTMLElement, animate: boolean) {
  if (next === current) return;
  finish?.();
  const previous = current;
  current = next;

  // The hero keeps its place, so the way back lands where the visitor left it.
  if (next !== screens[0]) next.scrollTop = 0;
  root.dataset.activeScreen = next.id;
  root.dataset.theme = next.id;
  document.dispatchEvent(new CustomEvent('screen:change', { detail: { id: next.id } }));

  if (!previous || !animate || reducedMotion.matches) {
    settle(next);
    next.focus({ preventScroll: true });
    return;
  }

  // The new screen is in front, and its background comes in over the old one.
  next.toggleAttribute('data-shown', true);
  next.toggleAttribute('data-front', true);
  next.inert = false;
  const old = parts(previous);
  const fresh = parts(next);
  const leave = { duration: LEAVE_MS, easing: LEAVE_EASE, fill: 'forwards' } as const;
  const arrive = { duration: ARRIVE_MS, delay: ARRIVE_DELAY, easing: ARRIVE_EASE, fill: 'backwards' } as const;
  const animations = [
    next.animate([{ backgroundColor: 'transparent' }, { backgroundColor: getComputedStyle(next).backgroundColor }], {
      duration: TOTAL_MS,
      easing: 'ease-in-out',
    }),
    ...old.sides.map((side, index) => side.animate([{ transform: 'none' }, { transform: away(side, index) }], leave)),
    ...old.rest.map((part) => part.animate([{ opacity: 1 }, { opacity: 0 }], leave)),
    ...fresh.sides.map((side, index) => side.animate([{ transform: away(side, index) }, { transform: 'none' }], arrive)),
    ...fresh.rest.map((part) => part.animate([{ opacity: 0 }, { opacity: 1 }], arrive)),
  ];

  // Once the new screen is in place, the old one hides and its sides come back home behind the scenes.
  const done = () => {
    if (finish !== done) return;
    finish = null;
    settle(next);
    for (const animation of animations) animation.cancel();
  };
  finish = done;
  Promise.all(animations.map((animation) => animation.finished)).then(done, () => {});
  // A background tab renders no frames and so finishes no animation; the timer still settles the screens.
  setTimeout(done, TOTAL_MS + 100);
  next.focus({ preventScroll: true });
}

function go(id: string) {
  const next = byId(id);
  if (!next || next === current) return;
  history.pushState(null, '', `#${id}`);
  show(next, true);
}

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
  if (!link || !byId(link.hash.slice(1))) return;
  event.preventDefault();
  go(link.hash.slice(1));
});

addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || event.defaultPrevented || current === screens[0]) return;
  go(screens[0].id);
});

document.addEventListener('screen:open', (event) => go((event as CustomEvent<{ id: string }>).detail.id));

addEventListener('popstate', () => show(fromHash(), true));

for (const screen of screens) screen.tabIndex = -1;
show(fromHash(), false);
