import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeHands } from './hands-data.ts';

test('public/art/hands.bin decodes back to src/data/hands.json', () => {
  const D = JSON.parse(readFileSync('src/data/hands.json', 'utf8'));
  const b = readFileSync('public/art/hands.bin');
  const got = decodeHands(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  assert.deepEqual([got.w, got.h, got.split], [D.w, D.h, D.split]);
  assert.deepEqual(got.contour, D.contour);
  got.hatch.forEach((p, i) => {
    assert.deepEqual([p[0], p[1], p[3]], [D.hatch[i][0], D.hatch[i][1], D.hatch[i][3]]);
    assert.ok(Math.abs(p[2] - D.hatch[i][2]) < .0006);
  });
  got.dots.forEach((p, i) => assert.ok(Math.abs(p[0] - D.dots[i][0]) <= .051 && Math.abs(p[1] - D.dots[i][1]) <= .051 && Math.abs(p[2] - D.dots[i][2]) < .0006));
});
