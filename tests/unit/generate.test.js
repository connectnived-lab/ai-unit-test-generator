import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateTests, planModule, summaryText } from '../../src/core/generate.js';
import { SAMPLE_MODULE } from '../../src/core/sample.js';

test('planModule separates exported, async and private functions', () => {
  const src = 'export function a() {}\nexport async function b() {}\nfunction c() {}';
  const plan = planModule(src);
  assert.deepEqual(plan.exported.map((f) => f.name), ['a']);
  assert.deepEqual(plan.skipped.map((s) => s.name), ['b', 'c']);
  assert.match(plan.skipped[0].reason, /async/);
  assert.match(plan.skipped[1].reason, /not exported/);
});

test('generateTests writes a node:test file that imports the exported names', () => {
  const g = generateTests({ src: SAMPLE_MODULE, moduleFile: 'math.js' });
  assert.match(g.text, /import \{ test \} from 'node:test';/);
  assert.match(g.text, /import \{ add, countWords, discount, isEven, describeTotal \} from '.\/math.js';/);
  assert.doesNotMatch(g.text, /helper/);
  assert.ok(g.tests.length > 8);
});

test('generated expectations are the recorded values', () => {
  const g = generateTests({ src: SAMPLE_MODULE, moduleFile: 'math.js' });
  assert.match(g.text, /assert\.deepEqual\(add\(0, 0\), 0\);/);
  assert.match(g.text, /assert\.deepEqual\(countWords\(""\), 0\);/);
  assert.match(g.text, /assert\.throws\(\(\) => discount\(0, -3\)\);/);
});

test('error paths become assert.throws tests', () => {
  const g = generateTests({ src: SAMPLE_MODULE, moduleFile: 'math.js' });
  assert.ok(g.tests.some((t) => t.kind === 'throws' && t.fn === 'discount'));
});

test('integration tests are labelled when a function calls another', () => {
  const g = generateTests({ src: SAMPLE_MODULE, moduleFile: 'math.js' });
  const integ = g.tests.filter((t) => t.fn === 'describeTotal');
  assert.ok(integ.length > 0);
  assert.ok(integ.every((t) => /integration: calls add/.test(t.title)));
});

test('a module with nothing exported yields no file and a clear summary', () => {
  const g = generateTests({ src: 'function x() {}', moduleFile: 'x.js' });
  assert.equal(g.text, '');
  assert.equal(g.summary.exported, 0);
  assert.equal(g.summary.skipped.length, 1);
});

test('summaryText says what was covered and what was skipped', () => {
  const s = summaryText({ functions: 3, exported: 2, tests: 9, skipped: [{ name: 'b', reason: 'async, so it needs a hand-written test' }] });
  assert.match(s, /2 of 3 functions are exported and covered; 9 tests generated\./);
  assert.match(s, /Skipped b: async, so it needs a hand-written test\./);
});
