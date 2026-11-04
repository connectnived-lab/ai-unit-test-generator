import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateTests } from '../../src/core/generate.js';
import { SAMPLE_MODULE } from '../../src/core/sample.js';

// The generated file must actually run against the module it was written for.
test('generated tests pass when run with node --test against the module', () => {
  const dir = mkdtempSync(join(tmpdir(), 'utg-'));
  try {
    const g = generateTests({ src: SAMPLE_MODULE, moduleFile: 'math.js' });
    writeFileSync(join(dir, 'math.js'), SAMPLE_MODULE);
    writeFileSync(join(dir, 'math.test.js'), g.text);
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const out = execFileSync(process.execPath, ['--test', '--test-reporter=tap', join(dir, 'math.test.js')], { encoding: 'utf8', env });
    assert.match(out, new RegExp(`# pass ${g.tests.length}\\b`));
    assert.match(out, /# fail 0/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
