// The world compositor: one 2D canvas that draws the sheet for a camera. Paper, then every place in view (its
// film while it draws itself, its still once drawn), the red-chalk lines between places up to their
// progress, the Vitruvian inking in, and the warm light. It only redraws when something changed.
import type { Cam } from './camera.ts';
import { visible } from './camera.ts';
import { createFilms, featherMask, type FilmVideo } from './films.ts';
import { WORLD, type Region, type Stroke } from './layout.ts';

export type WorldData = { regions: Region[]; strokes: Stroke[]; stills: Record<string, string>; films: Record<string, string>; vitruvian: string };
export type World = ReturnType<typeof createWorld>;

const FEATHER = 0.08; // share of a region's shorter side that melts into the paper

// One feathered alpha mask per size, built once.
const masks = new Map<string, HTMLCanvasElement>();
function maskFor(w: number, h: number): HTMLCanvasElement {
	const key = `${w}x${h}`;
	let m = masks.get(key);
	if (m) return m;
	const e = Math.max(2, Math.round(Math.min(w, h) * FEATHER));
	const fx = featherMask(w, e), fy = featherMask(h, e);
	m = document.createElement('canvas');
	m.width = w;
	m.height = h;
	const g = m.getContext('2d')!, data = g.createImageData(w, h);
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.data[(y * w + x) * 4 + 3] = 255 * fx[x] * fy[y];
	g.putImageData(data, 0, 0);
	masks.set(key, m);
	return m;
}

/** Draws `src` into `into` (resized to w x h) with its edges feathered to transparent; returns `into`. */
function feathered(src: CanvasImageSource, w: number, h: number, into: HTMLCanvasElement = document.createElement('canvas')): HTMLCanvasElement {
	if (into.width !== w || into.height !== h) { into.width = w; into.height = h; }
	const g = into.getContext('2d')!;
	g.globalCompositeOperation = 'source-over';
	g.clearRect(0, 0, w, h);
	g.drawImage(src, 0, 0, w, h);
	g.globalCompositeOperation = 'destination-in';
	g.drawImage(maskFor(w, h), 0, 0);
	g.globalCompositeOperation = 'source-over';
	return into;
}

export function createWorld(canvas: HTMLCanvasElement, data: WorldData) {
	const ctx = canvas.getContext('2d', { alpha: false })!;
	const css = getComputedStyle(document.documentElement);
	const ink = css.getPropertyValue('--sanguine-ink').trim() || '#933823';
	const light = css.getPropertyValue('--gap-light').trim() || '#ffdb99';
	let cam: Cam = { x: WORLD.w / 2, y: WORLD.h / 2, z: 0.2 };
	let vw = 0, vh = 0, dpr = 1, dirty = true, raf = 0, alive = true;
	const strokeP = new Map<string, number>();
	let lightP = 0, lightAt: [number, number] = [0, 0], vitP = 0;

	// stills, decoded once and feathered once
	const stills = new Map<string, HTMLCanvasElement>();
	for (const r of data.regions) {
		const src = r.film && data.stills[r.film];
		if (!src) continue;
		const img = new Image();
		img.decoding = 'async';
		img.onload = () => { stills.set(r.id, feathered(img, img.naturalWidth, img.naturalHeight)); dirty = true; };
		img.src = src;
	}
	// films: one <video> per region, made on first play, kept off-screen
	const films = createFilms((id) => {
		const r = data.regions.find((x) => x.id === id)!;
		const v = document.createElement('video');
		v.src = data.films[r.film!];
		v.playsInline = true;
		return v as unknown as FilmVideo;
	});
	const frame = document.createElement('canvas');
	// paper: a sheet-wide warm ground and some foxing, in world space
	const foxing = Array.from({ length: 90 }, (_, i) => {
		const s = Math.sin(i * 12.9898) * 43758.5453, t = Math.sin(i * 78.233) * 12345.678;
		return [(s - Math.floor(s)) * WORLD.w, (t - Math.floor(t)) * WORLD.h, 20 + ((s * 7) % 1) * 90] as const;
	});
	// the Vitruvian, inked by its own luminance: darkest lines first
	const vit = data.regions.find((r) => r.id === 'vitruvian');
	let vitImg: HTMLImageElement | null = null, vitLum: Uint8ClampedArray | null = null, vitMask: HTMLCanvasElement | null = null;
	const VW = 400, VH = 504;
	const vitInk = document.createElement('canvas'), vitOut = document.createElement('canvas');
	vitInk.width = VW;
	vitInk.height = VH;
	if (vit) {
		vitImg = new Image();
		vitImg.onload = () => {
			const c = document.createElement('canvas');
			c.width = VW;
			c.height = VH;
			const g = c.getContext('2d')!;
			g.drawImage(vitImg!, 0, 0, VW, VH);
			const px = g.getImageData(0, 0, VW, VH).data;
			vitLum = new Uint8ClampedArray(VW * VH);
			for (let i = 0; i < VW * VH; i++) vitLum[i] = px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114;
			vitMask = c;
			dirty = true;
		};
		vitImg.src = data.vitruvian;
	}
	let vitBuilt = -1;
	const buildVitMask = () => {
		if (!vitLum || !vitMask || Math.abs(vitBuilt - vitP) < 0.004) return;
		vitBuilt = vitP;
		const g = vitMask.getContext('2d')!, m = g.createImageData(VW, VH), t = vitP * 300 - 40;
		for (let i = 0; i < VW * VH; i++) m.data[i * 4 + 3] = Math.max(0, Math.min(255, (t - vitLum[i]) * 6));
		g.putImageData(m, 0, 0);
	};
	const strokeLen = new Map<string, number>();
	const lengthOf = (d: string) => {
		const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		p.setAttribute('d', d);
		return p.getTotalLength();
	};

	const toScreen = () => ctx.setTransform(cam.z * dpr, 0, 0, cam.z * dpr, (vw / 2 - cam.x * cam.z) * dpr, (vh / 2 - cam.y * cam.z) * dpr);
	const draw = () => {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = '#d8c39a';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		toScreen();
		const gr = ctx.createRadialGradient(WORLD.w * 0.48, WORLD.h * 0.45, 200, WORLD.w / 2, WORLD.h / 2, WORLD.w * 0.62);
		gr.addColorStop(0, '#efe2c2');
		gr.addColorStop(0.6, '#e2cfa6');
		gr.addColorStop(1, '#c9ad80');
		ctx.fillStyle = gr;
		ctx.fillRect(0, 0, WORLD.w, WORLD.h);
		ctx.fillStyle = 'rgba(156,116,64,0.06)';
		for (const [x, y, r] of foxing) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
		// places in view
		for (const r of data.regions) {
			if (!visible(r, cam, vw, vh)) continue;
			if (films.playing() === r.id) {
				const v = films.video(r.id) as unknown as HTMLVideoElement;
				if (v.readyState >= 2) ctx.drawImage(feathered(v, v.videoWidth, v.videoHeight, frame), r.x, r.y, r.w, r.h);
			} else if (films.isDrawn(r.id)) {
				const s = stills.get(r.id);
				if (s) ctx.drawImage(s, r.x, r.y, r.w, r.h);
			}
		}
		// the lines between places
		ctx.strokeStyle = ink;
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';
		for (const s of data.strokes) {
			const p = strokeP.get(`${s.from}>${s.to}`) ?? 0;
			if (p <= 0) continue;
			const len = strokeLen.get(s.d) ?? lengthOf(s.d);
			strokeLen.set(s.d, len);
			ctx.setLineDash([len, len]);
			ctx.lineDashOffset = len * (1 - p);
			ctx.globalAlpha = 0.85;
			ctx.stroke(new Path2D(s.d));
		}
		ctx.setLineDash([]);
		ctx.globalAlpha = 1;
		// the Vitruvian, inking in
		if (vit && vitImg?.complete && vitP > 0 && visible(vit, cam, vw, vh)) {
			buildVitMask();
			const g = vitInk.getContext('2d')!;
			g.globalCompositeOperation = 'source-over';
			g.clearRect(0, 0, VW, VH);
			g.drawImage(vitImg, 0, 0, VW, VH);
			g.globalCompositeOperation = 'destination-in';
			g.drawImage(vitMask!, 0, 0);
			ctx.drawImage(feathered(vitInk, VW, VH, vitOut), vit.x, vit.y, vit.w, vit.h);
		}
		// the warm light
		if (lightP > 0) {
			ctx.globalCompositeOperation = 'screen';
			const lg = ctx.createRadialGradient(lightAt[0], lightAt[1], 0, lightAt[0], lightAt[1], 900);
			lg.addColorStop(0, light);
			lg.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.globalAlpha = Math.min(1, lightP) * 0.55;
			ctx.fillStyle = lg;
			ctx.fillRect(lightAt[0] - 900, lightAt[1] - 900, 1800, 1800);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = 'source-over';
		}
	};
	const loop = () => {
		raf = 0;
		if (!alive) return;
		if (dirty || films.playing()) { dirty = false; draw(); }
		raf = requestAnimationFrame(loop);
	};
	const resize = () => {
		dpr = Math.min(2, devicePixelRatio || 1);
		vw = innerWidth;
		vh = innerHeight;
		canvas.width = Math.round(vw * dpr);
		canvas.height = Math.round(vh * dpr);
		dirty = true;
	};
	resize();
	raf = requestAnimationFrame(loop);

	return {
		setCamera(c: Cam) { cam = c; dirty = true; },
		camera: () => cam,
		setStrokeProgress(id: string, p: number) { if (strokeP.get(id) !== p) { strokeP.set(id, p); dirty = true; } },
		playRegion: (id: string) => films.playRegion(id),
		isDrawn: (id: string) => films.isDrawn(id),
		markDrawn(id: string) { films.markDrawn(id); dirty = true; },
		setLight(p: number, at: [number, number]) { lightP = p; lightAt = at; dirty = true; },
		revealVitruvian(p: number) { vitP = p; dirty = true; },
		resize,
		destroy() { alive = false; cancelAnimationFrame(raf); },
	};
}
