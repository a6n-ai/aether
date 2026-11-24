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
