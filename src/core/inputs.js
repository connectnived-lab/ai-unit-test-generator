// Picks sample inputs from parameter names. Each sample keeps its source text (for the test file) and its value (for recording).
const NUM = /(count|num|total|price|size|index|amount|number|percent|age|qty|value|^[nixyab]$|^(n|i|x|y|a|b|c)$)/i;
const STR = /(str|text|name|word|title|label|msg|message|slug|email|url|input|query|^s$)/i;
const ARR = /(list|items|arr|values|nums|numbers|rows|entries|words)/i;
const BOOL = /(^is[A-Z]|^has[A-Z]|flag|enabled|^ok$|^can[A-Z])/;
const FN = /(fn|callback|handler|cb|predicate)/i;

const num = (n) => ({ src: String(n), value: n });
const str = (s) => ({ src: JSON.stringify(s), value: s });
const arr = (a) => ({ src: JSON.stringify(a), value: a });
const bool = (b) => ({ src: String(b), value: b });

export function sampleValuesFor(param) {
  const p = String(param);
  if (BOOL.test(p)) return [bool(true), bool(false)];
  if (FN.test(p)) return [{ src: '(x) => x', value: null, isFunction: true }];
  if (ARR.test(p)) return [arr([]), arr([1, 2, 3])];
  if (STR.test(p)) return [str(''), str('hello world')];
  if (NUM.test(p)) return [num(0), num(7), num(-3)];
  return [str('sample'), num(1)];
}

export function nullSample() {
  return { src: 'null', value: null };
}
