import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caseCombinations, literal, recordCases, loadFunctions, moduleBody, MAX_CASES } from '../../src/core/golden.js';
import { parseFunctions } from '../../src/core/parse.js';

test('moduleBody strips imports and exports', () => {
  const body = moduleBody("import x from 'y';\nexport function f() {}\nexport default 1;\nexport const g = 2;");
  assert.doesNotMatch(body, /import|export/);
  assert.match(body, /function f\(\) \{\}/);
});

test('loadFunctions returns the named functions from module text', () => {
  const fns = loadFunctions('export function add(a, b) { return a + b; }', ['add']);
  assert.equal(fns.add(2, 3), 5);
});

test('caseCombinations crosses the first two params and caps the count', () => {
  const combos = caseCombinations(['count', 'text']);
  assert.ok(combos.length <= MAX_CASES);
  assert.ok(combos.every((c) => c.length === 2));
  assert.deepEqual(caseCombinations([]), [[]]);
});

test('literal renders JSON-like values as source', () => {
  assert.equal(literal(NaN), 'NaN');
  assert.equal(literal(-0), '-0');
  assert.equal(literal(Infinity), 'Infinity');
  assert.equal(literal(10n), '10n');
  assert.equal(literal({ a: 1, 'b-c': [true, null] }), '{ a: 1, "b-c": [true, null] }');
  assert.equal(literal(undefined), 'undefined');
  assert.equal(literal('x"y'), '"x\\"y"');
  assert.equal(literal(() => 1), null);
  assert.equal(literal([() => 1]), null);
  assert.equal(literal({ f: () => 1 }), null);
  assert.equal(literal(Symbol('s')), null);
});

test('recordCases records returns and thrown errors', () => {
  const src = "export function safe(n) {\n  if (n < 0) throw new Error('neg');\n  return n * 2;\n}";
  const [fn] = parseFunctions(src);
  const cases = recordCases(fn, src, ['safe']);
  assert.ok(cases.some((c) => c.kind === 'returns' && c.expected === '0'));
  assert.ok(cases.some((c) => c.kind === 'throws' && c.message === 'neg'));
});

test('recordCases skips function-valued inputs but keeps the null case', () => {
  const src = 'export function apply(callback) { return callback; }';
  const [fn] = parseFunctions(src);
  const cases = recordCases(fn, src, ['apply']);
  assert.ok(cases.length > 0);
  assert.ok(cases.every((c) => !c.argSrc.includes('(x) => x')));
  assert.ok(cases.some((c) => c.argSrc === 'null'));
});

test('recordCases handles zero-parameter functions', () => {
  const src = 'export function answer() { return 42; }';
  const [fn] = parseFunctions(src);
  assert.deepEqual(recordCases(fn, src, ['answer']), [{ argSrc: '', kind: 'returns', expected: '42' }]);
});
