// The hero: the Creation of Adam, full bleed, split down the finger gap. The two halves start far apart
// with the headline in the space between; scroll draws them together until the fingers almost touch,
// a warm light opens in the gap, and the camera pushes through it. One OGL context on the GSAP ticker.
import { Renderer, Program, Mesh, Triangle, Texture, Vec2 } from 'ogl';
import { gsap } from 'gsap';

const VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tMap;
uniform vec2 uRes, uImage, uGap, uMouse;
uniform float uTime, uSpread, uZoom, uLight, uFade;
uniform vec3 uPage;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
// The open wall between the hands: each row's sky, averaged across the gap and softened in height,
// laid on a plaster texture so it reads as more ceiling, not a stretched strip of pixels.
vec3 wall(vec2 t) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    for (int j = -3; j <= 3; j++) {
      vec2 q = vec2(uGap.x + (float(i) - 1.0) * 0.005, t.y + float(j) * 0.022);
      c += texture2D(tMap, clamp(q, 0.001, 0.999)).rgb;
    }
  }
  c /= 21.0;
  vec2 a = t * vec2(uImage.x / uImage.y, 1.0);
  float tex = fbm(a * 9.0);
  float crack = smoothstep(0.01, 0.0, abs(fbm(a * 2.6 + 4.0) - 0.5)) * 0.07;
  return c * (0.95 + 0.09 * tex) - crack;
}

// Screen uv to painting uv: cover, centred on the finger gap, zoomed into it.
vec2 toImage(vec2 uv) {
  float sa = uRes.x / uRes.y, ia = uImage.x / uImage.y;
  vec2 r = sa > ia ? vec2(1.0, ia / sa) : vec2(sa / ia, 1.0);
  return (uv - 0.5) * r / uZoom + uGap;
}

void main() {
  vec2 t = toImage(vUv);
  // The pointer leans each half a hair toward it; at rest they breathe.
  float lean = (uMouse.x - 0.5) * 0.006 + sin(uTime * 0.6) * 0.0015;
  float s = uSpread;
  float d = t.x - uGap.x;
  vec2 src;
  float side = sign(d);
  if (abs(d) > s) {
    src = vec2(t.x - side * s + lean * side, t.y);
  } else {
    src = vec2(-1.0);
  }
  vec3 open = wall(t);
  vec3 col = src.x < 0.0 ? open : texture2D(tMap, clamp(src, 0.001, 0.999)).rgb;
  // Each half's inner edge melts into the open wall over a short, uneven band.
  float edge = abs(d) - s + (fbm(vec2(t.y * 12.0, side)) - 0.5) * 0.02;
  float band = 0.03 * clamp(s / 0.04, 0.0, 1.0);
  if (band > 0.0005) col = mix(open, col, smoothstep(0.0, band, edge));

  // Light in the gap: grows as the fingers close.
  vec2 g = (t - uGap) * vec2(uImage.x / uImage.y, 1.0);
  float r = length(g / vec2(0.16, 0.11));
  float glow = exp(-r * r * 2.4) * uLight * (0.88 + 0.12 * sin(uTime * 1.3));
  col += vec3(1.0, 0.86, 0.6) * glow * 0.55;

  col = mix(col, col * 0.94 + 0.03, 0.5);
  col += (hash(vUv * uRes + fract(uTime)) - 0.5) * 0.025;
  col = mix(col, uPage, uFade);
  gl_FragColor = vec4(col, 1.0);
}`;

export type Hands = { set: (p: { spread: number; zoom: number; light: number; fade: number }) => void; destroy: () => void };

export function mountHands(stage: HTMLElement, img: HTMLImageElement, page: [number, number, number]): Hands | null {
	let renderer: Renderer;
	try {
		renderer = new Renderer({ dpr: 1, alpha: false, antialias: false });
	} catch {
		return null;
	}
	const gl = renderer.gl;
	if (!gl) return null;
	const info = gl.getExtension('WEBGL_debug_renderer_info');
	const software = info ? /swiftshader|llvmpipe|software/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : false;
	const small = matchMedia('(max-width: 767px)').matches;
	// ponytail: fixed quality tiers; add a frame-time governor if a real mid-range phone drops frames.
	const ratio = software ? 0.6 : Math.min(devicePixelRatio, small ? 1.25 : 1.75);
	renderer.dpr = ratio;
	const canvas = gl.canvas as HTMLCanvasElement;
	canvas.className = 'hands-canvas';
	canvas.setAttribute('aria-hidden', 'true');
	stage.prepend(canvas);

	const map = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
	const program = new Program(gl, {
		vertex: VERTEX,
		fragment: FRAGMENT,
		uniforms: {
			tMap: { value: map },
			uRes: { value: new Vec2(1, 1) },
			uImage: { value: new Vec2(1533, 863) },
			uGap: { value: new Vec2(0.496, 0.5) },
			uMouse: { value: new Vec2(0.5, 0.5) },
			uTime: { value: 0 },
			uSpread: { value: 0.2 },
			uZoom: { value: 1 },
			uLight: { value: 0 },
			uFade: { value: 0 },
			uPage: { value: page },
		},
	});
	const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

	let ready = false;
	const source = new Image();
	source.decoding = 'async';
	source.onload = () => {
		map.image = source;
		program.uniforms.uImage.value.set(source.naturalWidth, source.naturalHeight);
		ready = true;
	};
	source.src = img.currentSrc || img.src;

	const resize = () => {
		const w = stage.clientWidth || 1;
		const h = stage.clientHeight || 1;
		renderer.setSize(w, h);
		program.uniforms.uRes.value.set(w * ratio, h * ratio);
	};
	const ro = new ResizeObserver(resize);
	ro.observe(stage);
	resize();

	const mouse = { x: 0.5, tx: 0.5 };
	const move = (e: PointerEvent) => {
		mouse.tx = e.clientX / innerWidth;
	};
	addEventListener('pointermove', move, { passive: true });

	const goal = { spread: 0.2, zoom: 1, light: 0, fade: 0 };
	const now = { ...goal };
	let visible = true;
	let first = true;
	let acc = 0;
	const tick = (time: number, delta: number) => {
		if (!ready || !visible || document.hidden) return;
		if (software) {
			acc += delta;
			if (acc < 33) return;
			acc = 0;
		}
		const k = Math.min(1, 0.1 * gsap.ticker.deltaRatio());
		for (const key of Object.keys(goal) as (keyof typeof goal)[]) now[key] += (goal[key] - now[key]) * k;
		mouse.x += (mouse.tx - mouse.x) * k * 0.6;
		const u = program.uniforms;
		u.uTime.value = time;
		u.uSpread.value = now.spread;
		u.uZoom.value = now.zoom;
		u.uLight.value = now.light;
		u.uFade.value = now.fade;
		u.uMouse.value.set(mouse.x, 0.5);
		renderer.render({ scene: mesh });
		if (first) {
			first = false;
			stage.classList.add('is-live');
		}
	};
	gsap.ticker.add(tick);
	const io = new IntersectionObserver(([e]) => {
		visible = e.isIntersecting;
	});
	io.observe(stage);

	return {
		set: (p) => Object.assign(goal, p),
		destroy: () => {
			gsap.ticker.remove(tick);
			io.disconnect();
			ro.disconnect();
			removeEventListener('pointermove', move);
			canvas.remove();
		},
	};
}
