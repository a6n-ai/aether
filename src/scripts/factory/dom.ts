export const $ = <T extends Element = HTMLElement>(q: string, el: ParentNode = document) => el.querySelector<T>(q)!;
export const $$ = <T extends Element = HTMLElement>(q: string, el: ParentNode = document) => [...el.querySelectorAll<T>(q)];

export type Cond = Record<string, boolean>;
