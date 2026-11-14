import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, REGIONS, STOPS, STROKES, boxOf } from './layout.ts';

test('every region sits inside the sheet', () => {
	for (const r of REGIONS) assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= WORLD.w && r.y + r.h <= WORLD.h, r.id);
});

test('no two regions overlap', () => {
	for (const a of REGIONS) for (const b of REGIONS) {
		if (a === b) continue;
		const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
		assert.equal(overlap, false, `${a.id} overlaps ${b.id}`);
	}
});

test('every stop frames something that exists', () => {
	for (const s of STOPS) assert.ok(boxOf(s.target), s.id);
});

test('the Vitruvian is at the centre of the sheet', () => {
	const v = boxOf('vitruvian')!;
	assert.ok(Math.abs(v.x + v.w / 2 - WORLD.w / 2) < 200 && Math.abs(v.y + v.h / 2 - WORLD.h / 2) < 200);
});

test('the home journey runs bench, shop, street, post, workshops, notes, whole', () => {
	assert.deepEqual(STOPS.filter((s) => s.page === '/').map((s) => s.target), ['bench', 'shop', 'street', 'post', 'workshops', 'notes', 'whole']);
});

test('every stroke joins two things that exist', () => {
	for (const s of STROKES) assert.ok(boxOf(s.from) && boxOf(s.to), `${s.from} → ${s.to}`);
});
