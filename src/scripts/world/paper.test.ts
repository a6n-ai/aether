import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foxing } from './paper.ts';

test('every foxing spot is on the sheet with a positive radius', () => {
	const spots = foxing(90, 6400, 4000);
	assert.equal(spots.length, 90);
	for (const [x, y, r] of spots) assert.ok(x >= 0 && x <= 6400 && y >= 0 && y <= 4000 && r > 0, `${x},${y},${r}`);
});
