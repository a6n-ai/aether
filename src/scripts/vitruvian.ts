// The closing scene: Leonardo's Vitruvian Man, drawn in the order he built it. The square inks in along
// its edges, the compass scribes the circle, the man settles in from his darkest lines to his lightest,
// and the hero's warm light opens at his raised fingertip. One OGL context on the GSAP ticker.
import { Renderer, Program, Mesh, Triangle, Texture, Vec2, Vec3 } from 'ogl';
import { gsap } from 'gsap';

// Measured on src/assets/art/vitruvian.jpg (Da_Vinci_Vitruve_Luc_Viatour.jpg at 1920 wide, crop left 90,
// top 48, 1741x2192, resized to 1112x1400), as image uv with y down.
const IMAGE = [1112, 1400];
const CIRCLE = { centre: [0.499, 0.471], radius: [0.474, 0.372] }; // the photo is a hair taller than wide
const SQUARE = [0.107, 0.233, 0.892, 0.841]; // left, top, right, bottom
const FINGERTIP = [0.143, 0.245]; // the raised right hand, on the viewer's left
const INK = [0.438, 0.24, 0.038]; // darkest 0.2-1% of the drawing's pixels

const VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tMap;
uniform vec2 uRes, uImage, uFocus, uMouse, uCentre, uRadius, uTip;
uniform vec4 uSquare;
uniform vec3 uPage, uInk;
uniform float uTime, uSquareP, uCircleP, uMan, uLight;

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
vec3 tex(vec2 t) { return texture2D(tMap, vec2(t.x, 1.0 - t.y)).rgb; }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Screen uv to image uv (y down): cover, held on the circle's centre.
vec2 toImage(vec2 uv) {
  float sa = uRes.x / uRes.y, ia = uImage.x / uImage.y;
  vec2 r = sa > ia ? vec2(1.0, ia / sa) : vec2(sa / ia, 1.0);
  vec2 s = vec2(uv.x, 1.0 - uv.y);
  vec2 t = (s - 0.5) * r + 0.5;
  // Keep the circle's centre where object-position puts it in the <img>.
  return t + (uFocus - 0.5) * (1.0 - r);
}

// One edge of the square inked from a to b: returns the stroke mask and how far along it is.
float edge(vec2 p, vec2 a, vec2 b, float progress, float w) {
  vec2 ab = b - a;
  float s = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  float d = length(p - a - ab * s);
  float drawn = 1.0 - smoothstep(progress - 0.01, progress + 0.002, s);
  return (1.0 - smoothstep(w * 0.5, w, d)) * drawn * step(0.0005, progress);
}

void main() {
  vec2 t = toImage(vUv) + (uMouse - 0.5) * vec2(0.006, 0.004);
  vec2 px = t * uImage; // image pixels: strokes and noise stay the same size on every screen
  vec3 img = tex(t);

  // Blank paper: the brightest of four tap pairs a hand's width away, so the figure and its hatching lift out
  // and only the sheet's own tone and stains stay.
  vec2 o = 46.0 / uImage;
  vec3 blank = img;
  for (int i = 0; i < 4; i++) {
    vec2 d = vec2(cos(float(i) * 0.785398), sin(float(i) * 0.785398)) * o;
    blank = max(blank, (tex(t + d) + tex(t - d)) * 0.5); // a pair averages single bright specks away
    blank = max(blank, (tex(t + d * 2.2) + tex(t - d * 2.2)) * 0.5); // the hair is wider than a hand
  }
  blank = max(blank, img);
  // Paper fibre, drifting very slowly.
  float fibre = fbm(px * 0.035 + vec2(uTime * 0.02, 0.0));

  // The man: darkest lines first, the lightest hatching last, with a ragged wet edge.
  float ink = lum(img) + (fibre - 0.5) * 0.25;
  float man = smoothstep(ink - 0.14, ink, uMan * 1.2 - 0.08);
  // A faint ghost of the finished sheet from the start, like the underdrawing, so it never reads as a failed load.
  vec3 col = mix(blank, img, max(man, 0.22));

  // The square: all four sides ink along their length, clockwise from each corner.
  float w = 5.0;
  vec2 tl = uSquare.xy * uImage, br = uSquare.zw * uImage;
  vec2 tr = vec2(br.x, tl.y), bl = vec2(tl.x, br.y);
  float sq = max(max(edge(px, tl, tr, uSquareP, w), edge(px, tr, br, uSquareP, w)), max(edge(px, br, bl, uSquareP, w), edge(px, bl, tl, uSquareP, w)));

  // The circle: one compass sweep, starting at the feet.
  vec2 c = uCentre * uImage, rr = uRadius * uImage;
  vec2 q = (px - c) / rr;
  float ring = abs(length(q) - 1.0) * min(rr.x, rr.y);
  float angle = fract(atan(-q.x, q.y) / 6.28318 + 1.0);
  float swept = (1.0 - smoothstep(uCircleP - 0.006, uCircleP + 0.002, angle)) * step(0.0005, uCircleP);
  float ci = (1.0 - smoothstep(w * 0.5, w, ring)) * swept;

  // Strokes uncover Leonardo's own line underneath, with a film of fresh ink that dries as the stroke ends.
  float stroke = max(sq, ci);
  col = mix(col, img, stroke);
  float wet = max(sq * (1.0 - uSquareP), ci * (1.0 - uCircleP));
  col = mix(col, uInk, wet * 0.45 * (1.0 - smoothstep(0.55, 0.85, lum(img) / max(lum(blank), 0.01))));

  // The reach: the hero's warm light opens at the raised fingertip.
  vec2 g = (px - uTip * uImage) / uImage.y;
  float r = length(g / vec2(0.16, 0.11));
  float glow = exp(-r * r * 2.4) * uLight * (0.88 + 0.12 * sin(uTime * 1.3));
  col += vec3(1.0, 0.86, 0.6) * glow * 0.45;

  // The sheet melts into the page at its edges: no hard rectangle.
  vec2 e = min(vUv, 1.0 - vUv) * vec2(uRes.x / uRes.y, 1.0);
  float edgeFade = smoothstep(0.0, 0.14, min(e.x, e.y) + (fibre - 0.5) * 0.04);
  col = mix(uPage, col, edgeFade);
  col += (hash(vUv * uRes + fract(uTime)) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}`;

export type Vitruvian = { set: (p: { square: number; circle: number; man: number; light: number }) => void; destroy: () => void };

export function mountVitruvian(stage: HTMLElement, img: HTMLImageElement): Vitruvian | null {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
	let renderer: Renderer;
	try {
		// Transparent until drawn: a freshly sized canvas is clear, never a black box over the picture.
		renderer = new Renderer({ dpr: 1, alpha: true, antialias: false });
	} catch {
		return null;
	}
	const gl = renderer.gl;
	if (!gl) return null;
	const info = gl.getExtension('WEBGL_debug_renderer_info');
	const software = info ? /swiftshader|llvmpipe|software/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : false;
	const small = matchMedia('(max-width: 767px)').matches;
	const ratio = software ? 0.6 : Math.min(devicePixelRatio, small ? 1.25 : 1.75);
	renderer.dpr = ratio;
	const canvas = gl.canvas as HTMLCanvasElement;
	canvas.className = 'vitruvian-canvas';
	canvas.setAttribute('aria-hidden', 'true');
	stage.prepend(canvas);

	const page = getComputedStyle(document.documentElement).getPropertyValue('--page').trim();
	const hex = /^#([0-9a-f]{6})$/i.exec(page)?.[1] ?? 'ece6da';
	const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

	const map = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
	const program = new Program(gl, {
		vertex: VERTEX,
		fragment: FRAGMENT,
		uniforms: {
			tMap: { value: map },
			uRes: { value: new Vec2(1, 1) },
			uImage: { value: new Vec2(IMAGE[0], IMAGE[1]) },
			uFocus: { value: new Vec2(CIRCLE.centre[0], CIRCLE.centre[1]) },
			uMouse: { value: new Vec2(0.5, 0.5) },
			uCentre: { value: new Vec2(CIRCLE.centre[0], CIRCLE.centre[1]) },
			uRadius: { value: new Vec2(CIRCLE.radius[0], CIRCLE.radius[1]) },
			uTip: { value: new Vec2(FINGERTIP[0], FINGERTIP[1]) },
			uSquare: { value: SQUARE },
			uPage: { value: new Vec3(rgb[0], rgb[1], rgb[2]) },
			uInk: { value: new Vec3(INK[0], INK[1], INK[2]) },
			uTime: { value: 0 },
			uSquareP: { value: 0 },
			uCircleP: { value: 0 },
			uMan: { value: 0 },
			uLight: { value: 0 },
		},
	});
	const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

	let ready = false;
	const source = new Image();
	source.decoding = 'async';
	source.onload = () => {
		map.image = source;
		ready = true;
	};
	// The largest rendition the <img> offers: strokes are drawn in image pixels.
	const load = () => (source.src = img.currentSrc || img.src);
	if (img.complete && img.currentSrc) load();
	else img.addEventListener('load', load, { once: true });

	const resize = () => {
		const w = stage.clientWidth || 1;
		const h = stage.clientHeight || 1;
		renderer.setSize(w, h);
		program.uniforms.uRes.value.set(w * ratio, h * ratio);
		if (ready) renderer.render({ scene: mesh }); // resizing clears the canvas; repaint at once
	};
	const ro = new ResizeObserver(resize);
	ro.observe(stage);
	resize();

	const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
	const move = (e: PointerEvent) => {
		mouse.tx = e.clientX / innerWidth;
		mouse.ty = e.clientY / innerHeight;
	};
	addEventListener('pointermove', move, { passive: true });

	const goal = { square: 0, circle: 0, man: 0, light: 0 };
	const now = { ...goal };
	let visible = false;
	let frames = 0;
	let acc = 0;
	const tick = (time: number, delta: number) => {
		if (!ready || !visible || document.hidden) return;
		if (software) {
			acc += delta;
			if (acc < 33) return;
			acc = 0;
		}
		const k = Math.min(1, 0.12 * gsap.ticker.deltaRatio());
		for (const key of Object.keys(goal) as (keyof typeof goal)[]) now[key] += (goal[key] - now[key]) * k;
		mouse.x += (mouse.tx - mouse.x) * k * 0.6;
		mouse.y += (mouse.ty - mouse.y) * k * 0.6;
		const u = program.uniforms;
		u.uTime.value = time;
		u.uSquareP.value = now.square;
		u.uCircleP.value = now.circle;
		u.uMan.value = now.man;
		u.uLight.value = now.light;
		u.uMouse.value.set(mouse.x, mouse.y);
		renderer.render({ scene: mesh });
		// The picture underneath hides only once the canvas has painted for real.
		if (++frames === 3) stage.classList.add('is-live');
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
			img.removeEventListener('load', load);
			canvas.remove();
		},
	};
}
