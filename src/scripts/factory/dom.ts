export const $ = <T extends Element = HTMLElement>(q: string, el: ParentNode = document) => el.querySelector<T>(q)!;
export const $$ = <T extends Element = HTMLElement>(q: string, el: ParentNode = document) => [...el.querySelectorAll<T>(q)];

export type Cond = Record<string, boolean>;

// One switch for every looping animation (WCAG 2.2.2 Pause, Stop, Hide). Scroll-driven motion is not paused:
// it only moves while the visitor scrolls.
type Sub = (paused: boolean) => void;
const subs = new Set<Sub>();
export const motion = {
  paused: false,
  on(fn: Sub) { subs.add(fn); },
  set(v: boolean) { this.paused = v; subs.forEach(f => f(v)); },
};

// big art (drawings, the hands data) waits for the page's own load so it never competes with the CSS, font and headline
export const afterLoad = <T>(fn: () => T | Promise<T>) => new Promise<T>((done) => {
  const go = () => Promise.resolve(fn()).then(done);
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
});

// resolves on the visitor's first scroll, touch, pointer move or key press (scroll restoration and anchor jumps
// fire scroll too). Work only a visitor can see once they move waits for it, so an untouched page stays idle.
export const firstInput = new Promise<void>((done) => {
  const on = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
  const go = () => { on.forEach(e => removeEventListener(e, go)); done(); };
  on.forEach(e => addEventListener(e, go, { passive: true }));
});
