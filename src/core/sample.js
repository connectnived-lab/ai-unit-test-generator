export const SAMPLE_MODULE = `export function add(a, b) {
  return a + b;
}

export function countWords(text) {
  return String(text).trim().split(/\\s+/).filter(Boolean).length;
}

export function discount(price, percent) {
  if (percent < 0 || percent > 100) throw new Error('percent must be between 0 and 100');
  return Math.round(price * (100 - percent)) / 100;
}

export const isEven = (n) => n % 2 === 0;

export function describeTotal(amount) {
  const label = amount > 10 ? 'large' : 'small';
  return label + ':' + add(amount, 1);
}

function helper(x) {
  return x * 2;
}
`;
