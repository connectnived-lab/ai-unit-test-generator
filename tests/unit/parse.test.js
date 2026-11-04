import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFunctions, matchBrace, splitParams, callsInside } from '../../src/core/parse.js';

test('matchBrace skips braces inside strings and template literals', () => {
  const src = 'f { const s = "}"; const t = `{`; }';
  assert.equal(matchBrace(src, 2), src.length - 1);
});

test('matchBrace returns -1 when unbalanced', () => {
  assert.equal(matchBrace('{ open', 0), -1);
});

test('splitParams drops defaults and blanks', () => {
  assert.deepEqual(splitParams('a, b = 2, '), ['a', 'b']);
});

test('parseFunctions finds declarations, arrows, async and exports', () => {
  const src = [
    'export function add(a, b) {',
    '  return a + b;',
    '}',
    'async function load(url) { return url; }',
    'export const isEven = (n) => n % 2 === 0;',
    'const twice = async (x) => {',
    '  return x * 2;',
    '};',
  ].join('\n');
  const fns = parseFunctions(src);
  const byName = Object.fromEntries(fns.map((f) => [f.name, f]));
  assert.equal(byName.add.exported, true);
  assert.deepEqual(byName.add.params, ['a', 'b']);
  assert.equal(byName.load.exported, false);
  assert.equal(byName.load.isAsync, true);
  assert.equal(byName.isEven.kind, 'arrow');
  assert.match(byName.isEven.body, /n % 2/);
  assert.equal(byName.twice.isAsync, true);
  assert.match(byName.twice.body, /return x \* 2/);
});

test('parseFunctions keeps source order', () => {
  const fns = parseFunctions('function b() {}\nfunction a() {}');
  assert.deepEqual(fns.map((f) => f.name), ['b', 'a']);
});

test('parseFunctions on text with no functions returns nothing', () => {
  assert.deepEqual(parseFunctions('const x = 1;'), []);
  assert.deepEqual(parseFunctions(undefined), []);
});

test('callsInside finds other functions called in the body', () => {
  const fn = { name: 'outer', body: 'return inner(1) + helper();' };
  assert.deepEqual(callsInside(fn, ['outer', 'inner', 'helper', 'unused']), ['inner', 'helper']);
});
