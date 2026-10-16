// The water analogy: a tank (voltage = how deep the water is), a pipe with a
// squeeze in it (resistance), water rushing through (current) and a water
// wheel it spins (power). A tap stands in for the circuit's switch.
//
// mountWater(svg) returns update(view), where view is
//   { volts, ohms, amps, watts, closed }

import { el } from '../util.js';

const TANK_L = 30;
const TANK_R = 150;
const TANK_T = 30;
const TANK_B = 250;
const PIPE_T = 210;
const PIPE_B = 250;
const PIPE_MID = (PIPE_T + PIPE_B) / 2;
const PIPE_END = 455;
const SQ_L = 270; // the squeeze
const SQ_R = 360;
const SLOPE = 18;
const TAP_X = 205;
const WHEEL_X = 492;
const WHEEL_Y = 292;
const WHEEL_R = 40;
const MAX_V = 12;

// Half the pipe's height at any x, for a squeeze of half-height sq.
function halfAt(x, sq) {
  const full = (PIPE_B - PIPE_T) / 2;
  if (x < SQ_L - SLOPE || x > SQ_R + SLOPE) return full;
  if (x < SQ_L) return full + ((sq - full) * (x - (SQ_L - SLOPE))) / SLOPE;
  if (x > SQ_R) return sq + ((full - sq) * (x - SQ_R)) / SLOPE;
  return sq;
}

function pipePath(sq, pad = 0) {
  const full = (PIPE_B - PIPE_T) / 2 + pad;
  const top = (h) => PIPE_MID - h;
  const bot = (h) => PIPE_MID + h;
  return [
    `M${TANK_R},${top(full)}`,
    `L${SQ_L - SLOPE},${top(full)} L${SQ_L},${top(sq)} L${SQ_R},${top(sq)} L${SQ_R + SLOPE},${top(full)} L${PIPE_END},${top(full)}`,
    `L${PIPE_END},${bot(full)}`,
    `L${SQ_R + SLOPE},${bot(full)} L${SQ_R},${bot(sq)} L${SQ_L},${bot(sq)} L${SQ_L - SLOPE},${bot(full)} L${TANK_R},${bot(full)} Z`,
  ].join(' ');
}

export function mountWater(svg, { onTap } = {}) {
  svg.setAttribute('viewBox', '0 0 560 360');

  // Tank
  el('rect', { x: TANK_L, y: TANK_T, width: TANK_R - TANK_L, height: TANK_B - TANK_T, rx: 10, class: 'tank' }, svg);
  const water = el('rect', { x: TANK_L + 4, width: TANK_R - TANK_L - 8, rx: 6, class: 'tank-water', 'data-term': 'voltage' }, svg);
  const depth = el('text', { x: (TANK_L + TANK_R) / 2, class: 'lbl lbl-volt', 'text-anchor': 'middle', 'data-term': 'voltage' }, svg);
  const tankLbl = el('text', { x: (TANK_L + TANK_R) / 2, y: TANK_T - 8, class: 'lbl small', 'text-anchor': 'middle', 'data-term': 'voltage' }, svg);
  tankLbl.textContent = 'deeper = bigger push';

  // Pipe
  const pipeOuter = el('path', { class: 'pipe' }, svg);
  const pipeWater = el('path', { class: 'pipe-water', 'data-term': 'current' }, svg);
  const drops = el('g', { class: 'drops', 'data-term': 'current' }, svg);
  const N = 26;
  const particles = Array.from({ length: N }, (_, i) => ({
    x: TANK_R + ((PIPE_END - TANK_R) * i) / N,
    lane: Math.random() * 1.6 - 0.8,
    node: el('circle', { r: 3.5, class: 'drop' }, drops),
  }));
  const sqLbl = el('text', { x: (SQ_L + SQ_R) / 2, y: PIPE_T - 34, class: 'lbl lbl-ohm', 'text-anchor': 'middle', 'data-term': 'resistance' }, svg);
  sqLbl.textContent = 'the squeeze';
  const flowLbl = el('text', { x: (SQ_L + SQ_R) / 2, y: PIPE_B + 32, class: 'lbl lbl-amp', 'text-anchor': 'middle', 'data-term': 'current' }, svg);

  // Tap
  const tap = el('g', { class: 'tap' }, svg);
  el('rect', { x: TAP_X - 6, y: PIPE_T - 26, width: 12, height: 26, rx: 3, class: 'tap-stem' }, tap);
  el('rect', { x: TAP_X - 22, y: PIPE_T - 34, width: 44, height: 10, rx: 5, class: 'tap-handle' }, tap);
  const gate = el('rect', { x: TAP_X - 5, y: PIPE_T, width: 10, height: PIPE_B - PIPE_T, class: 'tap-gate' }, tap);
  if (onTap) {
    tap.setAttribute('tabindex', '0');
    tap.setAttribute('role', 'button');
    tap.setAttribute('aria-label', 'Turn the tap');
    tap.addEventListener('click', onTap);
    tap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTap();
      }
    });
  }
  const tapLbl = el('text', { x: TAP_X, y: PIPE_T - 42, class: 'lbl small', 'text-anchor': 'middle', 'data-term': 'switch' }, svg);
  tapLbl.textContent = 'tap = switch';

  // Water pouring onto the wheel
  const pour = el('path', { class: 'pour', d: `M${PIPE_END},${PIPE_T + 4} Q${PIPE_END + 30},${PIPE_T + 6} ${WHEEL_X - 8},${WHEEL_Y - WHEEL_R - 2} L${WHEEL_X - 22},${WHEEL_Y - WHEEL_R + 4} Q${PIPE_END + 14},${PIPE_B} ${PIPE_END},${PIPE_B - 4} Z` }, svg);

  // Wheel
  const wheelG = el('g', { 'data-term': 'power', class: 'wheel' }, svg);
  el('circle', { cx: WHEEL_X, cy: WHEEL_Y, r: WHEEL_R, class: 'wheel-rim' }, wheelG);
  const spin = el('g', {}, wheelG);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x = WHEEL_X + Math.cos(a) * WHEEL_R;
    const y = WHEEL_Y + Math.sin(a) * WHEEL_R;
    el('line', { x1: WHEEL_X, y1: WHEEL_Y, x2: x, y2: y, class: 'spoke' }, spin);
    el('rect', { x: x - 7, y: y - 7, width: 14, height: 14, rx: 2, class: 'paddle', transform: `rotate(${(a * 180) / Math.PI} ${x} ${y})` }, spin);
  }
  el('circle', { cx: WHEEL_X, cy: WHEEL_Y, r: 7, class: 'hub' }, wheelG);
  const wheelLbl = el('text', { x: WHEEL_X - WHEEL_R - 10, y: WHEEL_Y + WHEEL_R + 14, class: 'lbl lbl-watt', 'text-anchor': 'end', 'data-term': 'power' }, svg);
  wheelLbl.textContent = 'wheel = power';

  let view = { amps: 0, watts: 0, closed: false, ohms: 1 };
  let sq = 20;
  let angle = 0;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const flowing = view.closed && view.amps > 0;
    const v = flowing ? 120 * Math.log2(1 + view.amps) + 4 : 0;
    for (const p of particles) {
      p.x += v * dt;
      if (p.x > PIPE_END) p.x -= PIPE_END - TANK_R;
      const h = halfAt(p.x, sq) - 4;
      p.node.setAttribute('cx', p.x);
      p.node.setAttribute('cy', PIPE_MID + p.lane * Math.max(0, h));
      p.node.style.opacity = flowing || p.x < TAP_X ? 1 : 0;
    }
    angle = (angle + (flowing ? 40 * Math.sqrt(view.watts) * dt : 0)) % 360;
    spin.setAttribute('transform', `rotate(${angle} ${WHEEL_X} ${WHEEL_Y})`);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return function update(v) {
    view = v;
    // Water depth follows the voltage
    const h = ((TANK_B - TANK_T - 8) * v.volts) / MAX_V;
    water.setAttribute('y', TANK_B - 4 - h);
    water.setAttribute('height', Math.max(0, h));
    depth.setAttribute('y', Math.min(TANK_B - 12, TANK_B - h + 22));
    depth.textContent = `${v.volts} V`;
    // The squeeze gets narrower as resistance grows (1 Ω: none, 50 Ω: tiny)
    const full = (PIPE_B - PIPE_T) / 2;
    sq = 3 + (full - 3) * (1 - Math.log(v.ohms) / Math.log(50));
    pipeOuter.setAttribute('d', pipePath(sq + 5, 5));
    pipeWater.setAttribute('d', pipePath(sq));
    const flowing = v.closed && v.amps > 0;
    svg.classList.toggle('is-dry', !flowing);
    gate.style.opacity = v.closed ? 0 : 1;
    pour.style.opacity = flowing ? Math.min(1, 0.3 + v.amps / 3) : 0;
    flowLbl.textContent = flowing ? 'whoosh: the flow' : 'no flow';
  };
}
