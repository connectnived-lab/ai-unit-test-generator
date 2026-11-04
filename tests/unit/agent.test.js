import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runGenerate, buildMessages, extractCodeBlock } from '../../src/core/agent.js';
import { SAMPLE_MODULE } from '../../src/core/sample.js';

const LIVE = { baseUrl: 'https://llm.example/v1', apiKey: 'k', model: 'm', useLive: true };

function mock(content, calls = []) {
  return async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
    return { ok: true, json: async () => ({ choices: [{ message: { content } }] }) };
  };
}

test('demo mode generates tests offline with a summary', async () => {
  const r = await runGenerate({ src: SAMPLE_MODULE, moduleFile: 'math.js', settings: {} });
  assert.equal(r.mode, 'demo');
  assert.match(r.text, /node:test/);
  assert.match(r.summary, /functions are exported/);
  assert.ok(r.tests.length > 0);
});

test('empty input is refused', async () => {
  await assert.rejects(runGenerate({ src: '  ', settings: {} }), /Paste a module first/);
});

test('a module with no exports is refused with a useful hint', async () => {
  await assert.rejects(runGenerate({ src: 'function x() {}', settings: {} }), /Add "export"/);
});

test('live mode sends the module and returns the code block', async () => {
  const calls = [];
  const r = await runGenerate({
    src: 'export function f(a) { return a; }', moduleFile: 'f.js', settings: LIVE,
    fetchImpl: mock('```js\nimport { test } from "node:test";\n```', calls),
  });
  assert.equal(r.mode, 'live');
  assert.equal(r.tests, null);
  assert.match(r.text, /node:test/);
  assert.equal(calls[0].auth, 'Bearer k');
  assert.match(calls[0].body.messages[1].content, /export function f/);
});

test('live mode without a code block is an error, not a silent empty file', async () => {
  await assert.rejects(
    runGenerate({ src: 'export function f() {}', settings: LIVE, fetchImpl: mock('I cannot help.') }),
    /did not return a test file/,
  );
});

test('buildMessages names the import path without .js doubling', () => {
  const m = buildMessages({ src: 'x', moduleFile: 'util.js' });
  assert.match(m[1].content, /from '\.\/util\.js'/);
  assert.equal(extractCodeBlock('no block'), null);
});
