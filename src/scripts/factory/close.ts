import { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, type Cond } from './dom';
import { createSketch } from './sketch';

// Closing: Leonardo's hand study draws itself. Scrolling in draws most of it; the visitor's sentence finishes the sketch.
export function createClose() {
  const need = $<HTMLTextAreaElement>('#need'), sent = $('.sent'), canvas = $<HTMLCanvasElement>('.sketch-canvas');
  const sketch = createSketch(canvas, '/art/leo-hands.webp');
  const state = { scroll: 0, typed: 0, done: 0 };
  const paint = () => sketch.setProgress(state.scroll * .8 + state.typed * .2 + state.done);

  // load the art only when the section is close
  const load = () => sketch.load();
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '800px 0px' });
  io.observe(canvas);

  need.addEventListener('input', () => { gsap.to(state, { typed: Math.min(1, need.value.trim().length / 40), duration: .6, ease: 'power2.out', onUpdate: paint }); });
  $('.toggle')?.addEventListener('click', () => sketch.refresh());

  // list the error in aria-describedby only while the field is invalid, so it isn't read out from page load
  const describe = (input: HTMLInputElement) => {
    const bad = !input.checkValidity(), id = input.dataset.error!;
    input.setAttribute('aria-invalid', String(bad));
    if (bad) input.setAttribute('aria-describedby', id); else input.removeAttribute('aria-describedby');
    input.classList.toggle('is-invalid', bad);   // runs only after blur or submit, so this is 'after interaction'
  };
  const emailEl = $<HTMLInputElement>('#email');
  emailEl.addEventListener('blur', () => describe(emailEl));
  emailEl.addEventListener('input', () => { if (emailEl.getAttribute('aria-invalid') === 'true') describe(emailEl); });

  const run = (c: Cond) => {
    const formSubmit = (e: Event) => {
      e.preventDefault();
      if (!need.value.trim()) { need.focus(); sent.textContent = 'Add a sentence about what you need first.'; return; }
      const email = $<HTMLInputElement>('#email');
      if (!email.checkValidity()) { email.classList.add('is-invalid'); describe(email); email.focus(); return; }
      sent.textContent = 'Sketch finished. This preview does not send anything yet.';
      gsap.to(state, { done: 1, duration: c.still ? 0 : 1.2, ease: 'power2.inOut', onUpdate: paint });
    };
    const form = $('.close .form'); form.addEventListener('submit', formSubmit);
    let st: ScrollTrigger | undefined;
    if (c.still) { state.scroll = 1; paint(); }
    else st = gsap.to(state, { scroll: 1, ease: 'none', onUpdate: paint, scrollTrigger: { trigger: '.close', start: 'top 85%', end: 'center 45%', scrub: .6 } }).scrollTrigger;
    return () => { form.removeEventListener('submit', formSubmit); st?.kill(); };
  };

  return { run };
}
