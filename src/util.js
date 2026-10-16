export const rad = (deg) => (deg * Math.PI) / 180;

// Tiny observable state: set() merges and notifies every listener.
export function createState(initial) {
  let value = { ...initial };
  const listeners = new Set();
  return {
    get: () => value,
    set(patch) {
      value = { ...value, ...patch };
      listeners.forEach((fn) => fn(value));
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(value);
    },
  };
}

// Kid-friendly number: fixed decimals, a real minus sign, no "-0.00".
export function fmt(n, digits = 2) {
  if (!Number.isFinite(n)) return '∞';
  const s = (Math.abs(n) < 0.5 * 10 ** -digits ? 0 : n).toFixed(digits);
  return s.replace('-', '−');
}

export const svgNS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs = {}, parent) {
  const node = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.append(node);
  return node;
}

// Pointer position in an SVG's own coordinates.
export function svgPoint(svg, e) {
  const p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

// Friendly number for electrical readings: fewer decimals as numbers grow.
export function num(n) {
  if (!Number.isFinite(n)) return '∞';
  if (n === 0) return '0';
  const a = Math.abs(n);
  const s = a >= 100 ? n.toFixed(0) : a >= 10 ? n.toFixed(1) : a >= 0.1 ? n.toFixed(2) : n.toFixed(3);
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '').replace('-', '−');
}

// Ohm's law and power: I = V ÷ R, P = V × I.
export function solve({ volts, ohms, on = true }) {
  const amps = on ? volts / ohms : 0;
  return { volts, ohms, amps, watts: volts * amps };
}
