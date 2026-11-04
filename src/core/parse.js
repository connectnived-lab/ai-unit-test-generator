// Finds top-level function declarations and arrow functions in a JavaScript module. Regex plus brace matching.
const DECL = /(^|\n)[ \t]*(export[ \t]+)?(async[ \t]+)?function[ \t]+([A-Za-z_$][\w$]*)[ \t]*\(([^)]*)\)[ \t]*\{/g;
const ARROW = /(^|\n)[ \t]*(export[ \t]+)?(?:const|let)[ \t]+([A-Za-z_$][\w$]*)[ \t]*=[ \t]*(async[ \t]+)?\(([^)]*)\)[ \t]*=>[ \t]*/g;

export function matchBrace(src, openIndex) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function splitParams(s = '') {
  return String(s)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/=.*$/, '').trim());
}

export function parseFunctions(src) {
  const text = String(src ?? '');
  const found = [];
  let m;
  DECL.lastIndex = 0;
  while ((m = DECL.exec(text))) {
    const open = m.index + m[0].length - 1;
    const close = matchBrace(text, open);
    found.push({
      index: m.index,
      name: m[4],
      params: splitParams(m[5]),
      exported: !!m[2],
      isAsync: !!m[3],
      kind: 'declaration',
      body: close > open ? text.slice(open + 1, close) : '',
    });
  }
  ARROW.lastIndex = 0;
  while ((m = ARROW.exec(text))) {
    const start = m.index + m[0].length;
    let body;
    if (text[start] === '{') {
      const close = matchBrace(text, start);
      body = text.slice(start + 1, close);
    } else {
      const end = text.indexOf('\n', start);
      body = text.slice(start, end === -1 ? undefined : end).replace(/;\s*$/, '');
    }
    found.push({
      index: m.index,
      name: m[3],
      params: splitParams(m[5]),
      exported: !!m[2],
      isAsync: !!m[4],
      kind: 'arrow',
      body,
    });
  }
  return found.sort((a, b) => a.index - b.index).map(({ index, ...rest }) => rest);
}

export function callsInside(fn, names) {
  return names.filter((n) => n !== fn.name && new RegExp(`\\b${n}\\s*\\(`).test(fn.body));
}
