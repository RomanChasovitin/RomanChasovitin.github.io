// Screens sit on top of each other in one fixed viewport; the page never scrolls.
// The URL hash names the open screen, so links (`#exparte`, `#intro`), the browser's back button and shared
// URLs all work. Opening a project grows its screen out of its button in the hero; Intro in the row of
// projects folds it back into that button. Below 1024px a screen scrolls inside itself, and a project always
// opens at its top.
//
// Sets `data-active-screen` and `data-theme` on <html> and fires `screen:change` on document. A
// `screen:open` event on document opens a screen, for the agent in the hero.

const OPEN_MS = 850;
const EASE = 'cubic-bezier(0.7, 0, 0.2, 1)';

const screens = Array.from(document.querySelectorAll<HTMLElement>('[data-screen]'));
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let current: HTMLElement | null = null;
let running: Animation | null = null;

const byId = (id: string) => screens.find((screen) => screen.id === id);
const fromHash = () => byId(decodeURIComponent(location.hash.slice(1))) ?? screens[0];

/** The hero button a screen opens from, as a clip-path inset of the viewport; none when it is out of view. */
function buttonInset(id: string) {
  const button = document.querySelector(`#intro [data-opens="${id}"]`);
  if (!button) return null;
  const rect = button.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) return null;
  return `inset(${rect.top}px ${innerWidth - rect.right}px ${innerHeight - rect.bottom}px ${rect.left}px)`;
}

function settle(visible: HTMLElement) {
  for (const screen of screens) {
    const shown = screen === visible;
    screen.toggleAttribute('data-shown', shown);
    screen.toggleAttribute('data-front', false);
    screen.inert = !shown;
  }
  running = null;
}

function show(next: HTMLElement, animate: boolean) {
  if (next === current) return;
  const previous = current;
  current = next;
  running?.finish();

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

  // Both screens are visible during the move; the one that changes shape is in front.
  next.toggleAttribute('data-shown', true);
  next.inert = false;
  const intro = screens[0];
  let moving: HTMLElement;
  let keyframes: Keyframe[];
  if (previous === intro && buttonInset(next.id)) {
    moving = next;
    keyframes = [{ clipPath: buttonInset(next.id)! }, { clipPath: 'inset(0px 0px 0px 0px)' }];
  } else if (next === intro && buttonInset(previous.id)) {
    moving = previous;
    keyframes = [{ clipPath: 'inset(0px 0px 0px 0px)' }, { clipPath: buttonInset(previous.id)! }];
  } else {
    moving = next;
    keyframes = [{ opacity: 0 }, { opacity: 1 }];
  }
  moving.toggleAttribute('data-front', true);
  const animation = moving.animate(keyframes, { duration: OPEN_MS, easing: EASE });
  running = animation;
  const done = () => running === animation && settle(next);
  animation.onfinish = done;
  // A background tab renders no frames and so fires no finish event; the timer still settles the screens.
  setTimeout(done, OPEN_MS + 100);
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
