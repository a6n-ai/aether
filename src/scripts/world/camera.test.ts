import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cameraAt, clampCam, fit, scrollForStop, stopIndexForScroll, visible, type Cam } from './camera.ts';

const keys: Cam[] = [
	{ x: 1000, y: 800, z: 0.5 },
	{ x: 3000, y: 900, z: 1 },
	{ x: 5000, y: 2600, z: 0.4 },
];
const r = { x: 2000, y: 1000, w: 1400, h: 900 };

test('cameraAt rests on the first key at the very top', () => {
	assert.deepEqual(cameraAt(0, keys), keys[0]);
});

test('cameraAt holds a key through its dwell', () => {
	assert.deepEqual(cameraAt(0.375, keys), keys[0]);
	assert.deepEqual(cameraAt(0.9, keys), keys[0]);
});

test('cameraAt arrives at the next key when its travel ends', () => {
	assert.deepEqual(cameraAt(1.375, keys), keys[1]);
});

test('cameraAt is between two keys while travelling', () => {
	const c = cameraAt(1.1875, keys);
	assert.ok(c.x > keys[0].x && c.x < keys[1].x);
});

test('cameraAt holds the last key past the end', () => {
	assert.deepEqual(cameraAt(7, keys), keys[2]);
});

test('fit puts the region left of centre when the panel is on the right', () => {
	const cam = fit(r, 1440, 900, 'right');
	assert.ok(cam.x > r.x + r.w / 2);
});

test('fit puts the region right of centre when the panel is on the left', () => {
	const cam = fit(r, 1440, 900, 'left');
	assert.ok(cam.x < r.x + r.w / 2);
});

test('fit on a phone fills the width less the gutters', () => {
	const cam = fit(r, 390, 664, 'below');
	assert.ok(Math.abs(cam.z * r.w - (390 - 32)) < 0.5);
});

test('fit recomputes for a new viewport', () => {
	assert.notDeepEqual(fit(r, 1440, 900, 'right'), fit(r, 1024, 768, 'right'));
});

test('stopIndexForScroll inverts scrollForStop', () => {
	assert.equal(stopIndexForScroll(scrollForStop(3, 900) + 10, 900), 3);
	assert.equal(stopIndexForScroll(0, 900), 0);
});

test('visible is true for the framed region and false far away', () => {
	assert.equal(visible(r, fit(r, 1440, 900, 'right'), 1440, 900), true);
	assert.equal(visible({ ...r, x: r.x + 3000 }, fit(r, 1440, 900, 'right'), 1440, 900), false);
});

test('clampCam keeps the view inside the sheet', () => {
	const c = clampCam({ x: 100, y: 50, z: 0.5 }, 1440, 900, { w: 6400, h: 4000 });
	assert.equal(c.x, 1440 / 2 / 0.5);
	assert.equal(c.y, 900 / 2 / 0.5);
	const d = clampCam({ x: 6300, y: 3990, z: 0.5 }, 1440, 900, { w: 6400, h: 4000 });
	assert.equal(d.x, 6400 - 1440 / 2 / 0.5);
	assert.equal(d.y, 4000 - 900 / 2 / 0.5);
});

test('clampCam centres the sheet when the view is bigger than it', () => {
	const c = clampCam({ x: 10, y: 10, z: 0.1 }, 1440, 900, { w: 6400, h: 4000 });
	assert.deepEqual([c.x, c.y], [3200, 2000]);
});

test('clampCam leaves a camera well inside the sheet alone', () => {
	const cam = { x: 3000, y: 2000, z: 0.6 };
	assert.deepEqual(clampCam(cam, 1440, 900, { w: 6400, h: 4000 }), cam);
});
