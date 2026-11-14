import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldDegrade } from './degrade.ts';

test('reduced motion gets the still page', () => assert.equal(shouldDegrade({ reduced: true, canvas: true }), true));
test('no canvas gets the still page', () => assert.equal(shouldDegrade({ reduced: false, canvas: false }), true));
test('a 2 GB device gets the still page', () => assert.equal(shouldDegrade({ reduced: false, canvas: true, deviceMemory: 2 }), true));
test('under 40 fps gets the still page', () => assert.equal(shouldDegrade({ reduced: false, canvas: true, fps: 39 }), true));
test('a capable device keeps the world', () => assert.equal(shouldDegrade({ reduced: false, canvas: true, deviceMemory: 8, fps: 58 }), false));
test('unknown memory and no fps yet keeps the world', () => assert.equal(shouldDegrade({ reduced: false, canvas: true }), false));
