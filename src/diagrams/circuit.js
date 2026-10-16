// A simple circuit: battery, bulb, a part at the bottom (a resistor, or a gap
// to fill with something from the drawer) and, optionally, a switch.
// Electrons run round the loop at a speed that grows with the current.
//
// mountCircuit(svg, { gap, onSwitch }) returns update(view), where view is
//   { volts, amps, ohms, glow (0-1), closed, hot, item: {emoji, name} | null }

import { el, fmt } from '../util.js';

const L = 90; // loop edges
const R = 470;
const T = 110;
const B = 300;
const BAT_TOP = 170;
const BAT_BOT = 240;
const MID = (L + R) / 2;

export function mountCircuit(svg, { gap = false, onSwitch } = {}) {
  svg.setAttribute('viewBox', '0 0 560 360');
  const uid = svg.id;

  const defs = el('defs', {}, svg);
  const grad = el('radialGradient', { id: `${uid}-glow` }, defs);
  el('stop', { offset: '0%', 'stop-color': '#fff6b0', 'stop-opacity': '1' }, grad);
  el('stop', { offset: '45%', 'stop-color': '#ffd23f', 'stop-opacity': '0.7' }, grad);
  el('stop', { offset: '100%', 'stop-color': '#ffb000', 'stop-opacity': '0' }, grad);

  // The loop of wire (electrons leave the battery's − end and come back to +)
  const loopD = `M${L},${BAT_BOT} L${L},${B} L${R},${B} L${R},${T} L${L},${T} L${L},${BAT_TOP} Z`;
  const wire = el('path', { d: loopD, class: 'wire', 'data-term': 'wire' }, svg);
  const loopLen = wire.getTotalLength();

  // Glow sits behind everything else
  const glow = el('circle', { cx: MID, cy: T - 36, r: 40, fill: `url(#${uid}-glow)`, class: 'bulb-glow' }, svg);

  // Electrons
  const electronLayer = el('g', { 'data-term': 'electron', class: 'electrons' }, svg);
  const N = 30;
  const electrons = Array.from({ length: N }, () => el('circle', { r: 5, class: 'electron' }, electronLayer));

  // Battery (drawn over the wire so electrons vanish inside it)
  const bat = el('g', { 'data-term': 'battery', class: 'battery' }, svg);
  el('rect', { x: L - 8, y: BAT_TOP - 12, width: 16, height: 12, rx: 3, class: 'bat-cap' }, bat);
  el('rect', { x: L - 30, y: BAT_TOP, width: 60, height: BAT_BOT - BAT_TOP, rx: 8, class: 'bat-body' }, bat);
  el('rect', { x: L - 30, y: BAT_TOP, width: 60, height: 24, rx: 8, class: 'bat-top' }, bat);
  const batPlus = el('text', { x: L, y: BAT_TOP + 18, class: 'bat-sign', 'text-anchor': 'middle' }, bat);
  batPlus.textContent = '+';
  const batMinus = el('text', { x: L, y: BAT_BOT - 6, class: 'bat-sign', 'text-anchor': 'middle' }, bat);
  batMinus.textContent = '−';
  const batV = el('text', { x: L, y: (BAT_TOP + BAT_BOT) / 2 + 14, class: 'bat-volts', 'text-anchor': 'middle' }, bat);
  const batLbl = el('text', { x: L + 40, y: (BAT_TOP + BAT_BOT) / 2 + 6, class: 'lbl small lbl-volt', 'data-term': 'voltage' }, svg);
  batLbl.textContent = 'push';

  // Bulb
  const bulb = el('g', { 'data-term': 'bulb', class: 'bulb' }, svg);
  const glass = el('circle', { cx: MID, cy: T - 36, r: 26, class: 'bulb-glass' }, bulb);
  el('path', { d: `M${MID - 10},${T - 12} L${MID - 6},${T - 36} L${MID - 2},${T - 28} L${MID + 2},${T - 36} L${MID + 6},${T - 28} L${MID + 10},${T - 36} L${MID + 10},${T - 12}`, class: 'filament' }, bulb);
  el('rect', { x: MID - 14, y: T - 14, width: 28, height: 18, rx: 4, class: 'bulb-base' }, bulb);
  const hotLbl = el('text', { x: MID + 44, y: T - 44, class: 'lbl hot-lbl' }, svg);
  hotLbl.textContent = 'Too hot! 🔥';

  // Bottom part: a resistor or a gap
  let ohmsLbl;
  let itemEmoji;
  let itemName;
  if (gap) {
    const g = el('g', {}, svg);
    el('rect', { x: MID - 52, y: B - 14, width: 104, height: 28, class: 'wire-mask' }, g);
    el('circle', { cx: MID - 46, cy: B, r: 7, class: 'clip' }, g);
    el('circle', { cx: MID + 46, cy: B, r: 7, class: 'clip' }, g);
    itemEmoji = el('text', { x: MID, y: B + 13, class: 'item-emoji', 'text-anchor': 'middle' }, g);
    itemName = el('text', { x: MID, y: B + 46, class: 'lbl small', 'text-anchor': 'middle' }, g);
  } else {
    const g = el('g', { 'data-term': 'resistor' }, svg);
    el('rect', { x: MID - 50, y: B - 14, width: 100, height: 28, class: 'wire-mask' }, g);
    let d = `M${MID - 50},${B}`;
    for (let i = 0; i < 8; i++) d += ` L${MID - 44 + i * 12},${B + (i % 2 ? 12 : -12)}`;
    d += ` L${MID + 50},${B}`;
    el('path', { d, class: 'resistor' }, g);
    ohmsLbl = el('text', { x: MID, y: B + 42, class: 'lbl lbl-ohm', 'text-anchor': 'middle', 'data-term': 'resistance' }, svg);
  }

  // Switch on the right-hand side
  let lever;
  if (onSwitch) {
    const sw = el('g', { class: 'switch', tabindex: '0', role: 'button', 'aria-label': 'Flip the switch' }, svg);
    const y1 = 175;
    const y2 = 235;
    el('rect', { x: R - 14, y: y1, width: 28, height: y2 - y1, class: 'wire-mask' }, sw);
    el('circle', { cx: R, cy: y1, r: 6, class: 'clip' }, sw);
    el('circle', { cx: R, cy: y2, r: 6, class: 'clip' }, sw);
    lever = el('line', { x1: R, y1: y2, x2: R, y2: y1, class: 'lever' }, sw);
    el('rect', { x: R - 34, y: y1 - 10, width: 68, height: y2 - y1 + 20, class: 'hit' }, sw);
    const lbl = el('text', { x: R + 18, y: (y1 + y2) / 2 + 6, class: 'lbl small' }, svg);
    lbl.textContent = 'switch';
    lbl.setAttribute('data-term', 'switch');
    sw.addEventListener('click', onSwitch);
    sw.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSwitch();
      }
    });
  }

  // Animation
  let view = { amps: 0, closed: false };
  let offset = 0;
  let last = performance.now();
  const spacing = loopLen / N;
  const speed = () => (view.closed && view.amps > 0 ? 150 * Math.log2(1 + view.amps) + 6 : 0);
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    offset = (offset + speed() * dt) % loopLen;
    electrons.forEach((dot, i) => {
      const p = wire.getPointAtLength((offset + i * spacing) % loopLen);
      dot.setAttribute('cx', p.x);
      dot.setAttribute('cy', p.y);
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return function update(v) {
    view = v;
    const lit = v.closed ? v.glow : 0;
    glow.setAttribute('r', 30 + 55 * lit);
    glow.style.opacity = lit > 0.01 ? Math.min(1, 0.25 + lit) : 0;
    glass.style.fill = lit > 0.01 ? `rgba(255, 236, 140, ${0.35 + 0.65 * lit})` : '';
    svg.classList.toggle('is-hot', !!v.hot && v.closed);
    svg.classList.toggle('is-open', !v.closed);
    batV.textContent = `${fmt(v.volts, v.volts % 1 ? 1 : 0)}V`;
    if (ohmsLbl) ohmsLbl.textContent = `R = ${fmt(v.ohms, 0)} Ω`;
    if (itemEmoji) {
      itemEmoji.textContent = v.item ? v.item.emoji : '?';
      itemName.textContent = v.item ? v.item.name : 'an empty gap';
    }
    if (lever) {
      // open switch: the lever swings out
      const x2 = v.closed ? R : R + 40;
      const y2 = v.closed ? 175 : 187;
      lever.setAttribute('x2', x2);
      lever.setAttribute('y2', y2);
    }
  };
}
