import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFilms, featherMask, type FilmVideo } from './films.ts';

/** A stand-in for <video>: play() resolves or rejects as told, and 'ended' can be fired by hand. */
const stub = (o: { reject?: boolean } = {}) => {
	const listeners: Record<string, (() => void)[]> = {};
	let plays = 0;
	const v: FilmVideo & { fire(e: string): void; plays(): number } = {
		src: '', preload: 'none', playbackRate: 1, currentTime: 0, muted: true,
		play: () => { plays++; return o.reject ? Promise.reject(new Error('blocked')) : Promise.resolve(); },
		addEventListener: (e: string, fn: () => void) => { (listeners[e] ??= []).push(fn); },
		fire: (e: string) => (listeners[e] ?? []).forEach((fn) => fn()),
		plays: () => plays,
	};
	return v;
};

test('featherMask ramps in and out over the edge', () => {
	assert.deepEqual(featherMask(10, 2), [0, 0.5, 1, 1, 1, 1, 1, 1, 0.5, 0]);
});

test('a region is not drawn until its film has played', () => {
	const films = createFilms(() => stub());
	assert.equal(films.isDrawn('bench'), false);
});

test('a film that cannot play still leaves its region drawn', async () => {
	const films = createFilms(() => stub({ reject: true }));
	await films.playRegion('bench');
	assert.equal(films.isDrawn('bench'), true);
});

test('drawn stays drawn: a second play does not play the film again', async () => {
	const v = stub();
	const films = createFilms(() => v);
	const first = films.playRegion('bench');
	v.fire('ended');
	await first;
	await films.playRegion('bench');
	assert.equal(v.plays(), 1);
	assert.equal(films.isDrawn('bench'), true);
});

test('one film at a time: the second waits for the first to end', async () => {
	const a = stub(), b = stub();
	const films = createFilms((id) => (id === 'a' ? a : b));
	const pa = films.playRegion('a');
	const pb = films.playRegion('b');
	await Promise.resolve();
	assert.equal(b.plays(), 0);
	a.fire('ended');
	await pa;
	await new Promise((r) => setTimeout(r, 0));
	assert.equal(b.plays(), 1);
	b.fire('ended');
	await pb;
	assert.equal(films.playing(), null);
});
