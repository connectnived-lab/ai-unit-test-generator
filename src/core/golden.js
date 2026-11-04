// Runs each function on sample inputs and records what it does now. These are characterisation tests:
// they pin current behaviour, so a person must still review each expected value.
import { sampleValuesFor, nullSample } from './inputs.js';

export const MAX_CASES = 6;

export function moduleBody(src) {
  return String(src)
    .split('\n')
    .filter((l) => !/^\s*import\s/.test(l) && !/^\s*export\s+default\b/.test(l))
    .join('\n')
    .replace(/^(\s*)export\s+/gm, '$1');
}

export function loadFunctions(src, names) {
  const body = moduleBody(src);
  const factory = new Function(`${body}\nreturn { ${names.join(', ')} };`);
  return factory();
}

export function caseCombinations(params) {
  if (params.length === 0) return [[]];
  const pools = params.slice(0, 2).map((p) => [...sampleValuesFor(p), nullSample()]);
  let combos = [[]];
  for (const pool of pools) {
    combos = combos.flatMap((c) => pool.map((s) => [...c, s]));
  }
  const seen = new Set();
  const unique = combos.filter((c) => {
    const k = c.map((s) => s.src).join('|');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return unique.slice(0, MAX_CASES);
}

export function literal(v) {
  if (v === undefined) return 'undefined';
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    return Object.is(v, -0) ? '-0' : String(v);
  }
  if (typeof v === 'bigint') return `${v}n`;
  if (typeof v === 'function' || typeof v === 'symbol') return null;
  if (Array.isArray(v)) {
    const parts = v.map(literal);
    return parts.some((p) => p === null) ? null : `[${parts.join(', ')}]`;
  }
  if (v && typeof v === 'object') {
    const parts = Object.entries(v).map(([k, x]) => {
      const lit = literal(x);
      return lit === null ? null : `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${lit}`;
    });
    return parts.some((p) => p === null) ? null : `{ ${parts.join(', ')} }`;
  }
  return JSON.stringify(v);
}

export function recordCases(fn, moduleSrc, allNames) {
  const impl = loadFunctions(moduleSrc, allNames)[fn.name];
  const cases = [];
  for (const combo of caseCombinations(fn.params)) {
    const args = combo.map((s) => s.value);
    const argSrc = combo.map((s) => s.src).join(', ');
    if (combo.some((s) => s.isFunction)) continue;
    try {
      const result = impl(...args);
      const lit = literal(result);
      if (lit === null) continue;
      cases.push({ argSrc, kind: 'returns', expected: lit });
    } catch (err) {
      cases.push({ argSrc, kind: 'throws', message: err?.message ?? String(err) });
    }
  }
  return cases;
}
