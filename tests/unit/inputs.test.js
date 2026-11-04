import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleValuesFor, nullSample } from '../../src/core/inputs.js';

const values = (p) => sampleValuesFor(p).map((s) => s.value);

test('numeric names get numeric samples', () => {
  assert.deepEqual(values('count'), [0, 7, -3]);
  assert.deepEqual(values('price'), [0, 7, -3]);
});

test('text names get string samples', () => {
  assert.deepEqual(values('text'), ['', 'hello world']);
});

test('list names get array samples', () => {
  assert.deepEqual(values('items'), [[], [1, 2, 3]]);
});

test('boolean names get true and false', () => {
  assert.deepEqual(values('isActive'), [true, false]);
  assert.deepEqual(values('enabled'), [true, false]);
});

test('callback names get a placeholder that is marked as a function', () => {
  const [s] = sampleValuesFor('callback');
  assert.equal(s.isFunction, true);
});

test('unknown names fall back to a string and a number', () => {
  assert.deepEqual(values('zork'), ['sample', 1]);
});

test('nullSample is a null with its source text', () => {
  assert.deepEqual(nullSample(), { src: 'null', value: null });
});
