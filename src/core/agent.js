// Demo mode is the generator above. Live mode asks a model for a node:test file and keeps its code block.
import { chatCompletion } from './llm.js';
import { isLiveConfigured, normalizeSettings } from './settings.js';
import { generateTests, summaryText } from './generate.js';

export function extractCodeBlock(text) {
  const m = /```[\w+-]*\n([\s\S]*?)```/.exec(String(text || ''));
  return m ? m[1].replace(/\n$/, '') : null;
}

export function buildMessages({ src, moduleFile }) {
  return [
    {
      role: 'system',
      content: 'You write Node.js unit tests with node:test and node:assert/strict. Test real behaviour, include error paths and edge cases, and return one complete test file in a single fenced block.',
    },
    {
      role: 'user',
      content: `Write unit tests for every exported function in ./${moduleFile}. Import them from './${moduleFile.replace(/\.js$/, '')}.js'.\n\n\`\`\`js\n${src}\n\`\`\``,
    },
  ];
}

export async function runGenerate({ src, moduleFile = 'module.js', settings, fetchImpl } = {}) {
  if (String(src ?? '').trim() === '') throw new Error('Paste a module first.');
  const s = normalizeSettings(settings);
  if (!isLiveConfigured(s)) {
    const g = generateTests({ src, moduleFile });
    if (g.tests.length === 0) {
      throw new Error('No exported functions found to test. Add "export" in front of a function.');
    }
    return { mode: 'demo', text: g.text, summary: summaryText(g.summary), tests: g.tests };
  }
  const reply = await chatCompletion({
    baseUrl: s.baseUrl,
    apiKey: s.apiKey,
    model: s.model,
    messages: buildMessages({ src, moduleFile }),
    fetchImpl,
  });
  const code = extractCodeBlock(reply);
  if (!code) throw new Error('The model did not return a test file. Try again.');
  return { mode: 'live', text: code, summary: 'Written by the live model. Read each test before you trust it.', tests: null };
}
