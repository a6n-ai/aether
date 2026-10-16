// @ts-expect-error vendored ESM without types
import { glLayer, glCamera, settle } from '../lib/anatomy/gl.mjs';
import { fitProjection } from '../lib/anatomy/iso-kit';

// The finger gap in the cropped painting (see src/assets/art/SOURCES.md). object-position keeps it here at every size.
const GAP = [0.496, 0.5];
const BREATH_S = 6;
// The glow is a wide blur: half resolution and 24 fps are invisible, and keep software renderers (and Lighthouse) cool.
const RATIO = 0.5;
const FRAME_S = 1 / 24;

// Light that only adds: a warm body with a pale core, alpha capped so the painting always shows through.
const FRAGMENT = `
uniform float uLevel;
uniform vec2 uGap;
void main(){
  vec2 uv=gl_FragCoord.xy/uCanvas;
  uv.y=1.-uv.y;
  float aspect=uCanvas.x/uCanvas.y;
  vec2 d=(uv-uGap)*vec2(aspect,1.);
  float r=length(d/vec2(.30,.20));
  float body=exp(-r*r*2.2);
  float core=exp(-r*r*14.);
  float breath=.82+.18*sin(uTime*${((2 * Math.PI) / BREATH_S).toFixed(4)});
  float e=uLevel*breath;
  vec3 col=mix(vec3(.96,.74,.42),vec3(1.,.97,.9),core);
  float a=min(.35,(body*.24+core*.16)*e);
  a+=(hash12(gl_FragCoord.xy+fract(uTime))-.5)/255.;
  a=clamp(a,0.,.35);
  gl_FragColor=vec4(min(col*a,vec3(a)),a);
}`;

export function mountHeroLight(art: HTMLElement): () => void {
	const canvas = document.createElement('canvas');
	canvas.setAttribute('aria-hidden', 'true');
	canvas.className = 'hero-light';
	art.append(canvas);
	const view: [number, number] = [art.clientWidth || 1, art.clientHeight || 1];
	const camera = glCamera(fitProjection([[0, 0, 0], [1, 1, 1]], view[0], view[1]));
	const layer = glLayer({ canvas, fragment: FRAGMENT, view, camera, uniforms: ['uLevel'], fixed: { uGap: GAP }, maxRatio: RATIO, onError: () => {} });
	const gl = layer?.gl as WebGLRenderingContext | undefined;
	const info = gl?.getExtension('WEBGL_debug_renderer_info');
	const software = info ? /swiftshader|llvmpipe|software/i.test(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL)) : false;
	if (!layer || software) {
		canvas.remove();
		return () => {};
	}

	const level = { x: 0, v: 0 };
	let frame = 0;
	let last = 0;
	let clock = 0;
	let visible = false;
	const tick = (now: number) => {
		const dt = last ? Math.min((now - last) / 1000, 1 / 10) : FRAME_S;
		if (last && dt < FRAME_S) {
			frame = visible ? requestAnimationFrame(tick) : 0;
			return;
		}
		last = now;
		clock += dt;
		settle(level, 1, dt, 1.2);
		layer.draw({ uLevel: level.x }, clock);
		frame = visible ? requestAnimationFrame(tick) : 0;
	};
	const io = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (visible && !frame) {
			last = 0;
			frame = requestAnimationFrame(tick);
		}
	});
	io.observe(art);
	return () => {
		cancelAnimationFrame(frame);
		io.disconnect();
		canvas.remove();
	};
}
