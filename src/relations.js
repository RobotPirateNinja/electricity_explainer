// "How they're connected": two cover-up triangles (Ohm's law and power),
// filled with the live numbers from the circuit lab, plus quick experiments.

import { linkify } from './shared/glossary.js';
import { el, num, solve } from './util.js';

// Each triangle: one quantity on top, two underneath.
// Cover one with your finger and the other two tell you how to find it.
const TRIANGLES = [
  {
    id: 'ohm',
    title: 'The Ohm’s law triangle',
    intro: 'Push, flow and squeeze, all in one triangle. This is {{ohms-law|Ohm’s law}}.',
    top: { sym: 'V', cls: 'volt', term: 'voltage', key: 'volts', unit: 'V' },
    left: { sym: 'I', cls: 'amp', term: 'current', key: 'amps', unit: 'A' },
    right: { sym: 'R', cls: 'ohm', term: 'resistance', key: 'ohms', unit: 'Ω' },
  },
  {
    id: 'power',
    title: 'The power triangle',
    intro: '{{power|Power}} is the push and the flow together.',
    top: { sym: 'P', cls: 'watt', term: 'power', key: 'watts', unit: 'W' },
    left: { sym: 'V', cls: 'volt', term: 'voltage', key: 'volts', unit: 'V' },
    right: { sym: 'I', cls: 'amp', term: 'current', key: 'amps', unit: 'A' },
  },
];

const say = (q, v) => `<span class="c-${q.cls}">${num(v[q.key])} ${q.unit}</span>`;
const sym = (q) => `<span class="c-${q.cls}">${q.sym}</span>`;

function formula(t, covered, v) {
  const { top, left, right } = t;
  if (covered === 'top')
    return [`${sym(top)} = ${sym(left)} {{multiply|×}} ${sym(right)}`, `${say(left, v)} × ${say(right, v)} = ${say(top, v)}`];
  if (covered === 'left')
    return [`${sym(left)} = ${sym(top)} {{divide|÷}} ${sym(right)}`, `${say(top, v)} ÷ ${say(right, v)} = ${say(left, v)}`];
  return [`${sym(right)} = ${sym(top)} {{divide|÷}} ${sym(left)}`, `${say(top, v)} ÷ ${say(left, v)} = ${say(right, v)}`];
}

function triangleSvg(t, onCover) {
  const svg = el('svg', { viewBox: '0 0 240 196', class: 'rule-tri', role: 'group', 'aria-label': t.title });
  el('path', { d: 'M120 8 L8 188 L232 188 Z', class: 'rt-shape' }, svg);
  el('line', { x1: 58, y1: 108, x2: 182, y2: 108, class: 'rt-line' }, svg);
  el('line', { x1: 120, y1: 108, x2: 120, y2: 188, class: 'rt-line' }, svg);
  const spots = { top: [120, 84], left: [76, 164], right: [164, 164] };
  const parts = {};
  for (const [slot, [x, y]] of Object.entries(spots)) {
    const q = t[slot];
    const g = el('g', { class: `rt-letter rt-${q.cls}`, tabindex: '0', role: 'button', 'aria-label': `Cover up ${q.sym}` }, svg);
    el('circle', { cx: x, cy: y - 12, r: 30, class: 'rt-hit' }, g);
    const txt = el('text', { x, y, 'text-anchor': 'middle', class: 'rt-sym' }, g);
    txt.textContent = q.sym;
    const cover = el('g', { class: 'rt-cover' }, g);
    el('circle', { cx: x, cy: y - 12, r: 27 }, cover);
    const qm = el('text', { x, y: y - 2, 'text-anchor': 'middle' }, cover);
    qm.textContent = '?';
    g.addEventListener('click', () => onCover(slot));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCover(slot);
      }
    });
    parts[slot] = g;
  }
  return { svg, parts };
}

export function mountRelations(root, lab, rules) {
  root.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'rel-grid';
  root.append(grid);

  const cards = TRIANGLES.map((t) => {
    const card = document.createElement('article');
    card.className = 'rel-card';
    card.innerHTML = `<h3>${t.title}</h3><p>${linkify(t.intro)} Tap a letter to cover it up.</p>`;
    const { svg, parts } = triangleSvg(t, (slot) => rules.set({ [t.id]: slot }));
    card.append(svg);
    const eq = document.createElement('div');
    eq.className = 'equation';
    card.append(eq);
    const help = document.createElement('p');
    help.className = 'rel-help';
    card.append(help);
    grid.append(card);
    return { t, parts, eq, help };
  });

  function render() {
    const v = solve(lab.get());
    const covered = rules.get();
    for (const { t, parts, eq, help } of cards) {
      const slot = covered[t.id];
      Object.entries(parts).forEach(([s, g]) => g.classList.toggle('covered', s === slot));
      if (!slot) {
        eq.innerHTML = '<small>Cover a letter to see its formula.</small>';
        help.innerHTML = '';
        continue;
      }
      const [f, sum] = formula(t, slot, v);
      eq.innerHTML = `${linkify(f)}<br><small>Right now: ${sum}</small>`;
      const [a, b] = slot === 'top' ? [t.left, t.right] : [t.top, slot === 'left' ? t.right : t.left];
      help.innerHTML = slot === 'top'
        ? `${a.sym} and ${b.sym} sit side by side, so you <b>multiply</b> them.`
        : `${a.sym} is on top of ${b.sym}, so you <b>divide</b>.`;
    }
  }
  lab.subscribe(render);
  rules.subscribe(render);

  // Quick experiments that change the lab's numbers
  const exp = document.createElement('div');
  exp.className = 'experiments';
  exp.innerHTML = `
    <h3>Try it: what happens if you double things?</h3>
    <div class="exp-buttons">
      <button type="button" data-do="volts">Double the voltage</button>
      <button type="button" data-do="ohms">Double the resistance</button>
      <button type="button" data-do="reset">Back to 6 V and 12 Ω</button>
    </div>
    <p class="rel-note" aria-live="polite"></p>`;
  root.append(exp);
  const note = exp.querySelector('.rel-note');
  exp.addEventListener('click', (e) => {
    const what = e.target.closest('button')?.dataset.do;
    if (!what) return;
    const before = solve(lab.get());
    const { volts, ohms } = lab.get();
    if (what === 'volts') {
      if (volts * 2 > 12) return (note.textContent = 'The battery only goes up to 12 volts. Turn it down first!');
      lab.set({ volts: volts * 2, on: true });
    } else if (what === 'ohms') {
      if (ohms * 2 > 50) return (note.textContent = 'The resistance only goes up to 50 ohms. Turn it down first!');
      lab.set({ ohms: ohms * 2, on: true });
    } else lab.set({ volts: 6, ohms: 12, on: true });
    const after = solve(lab.get());
    if (what === 'reset') return (note.textContent = '');
    note.innerHTML = linkify(
      what === 'volts'
        ? `Twice the push: the {{current}} doubled from ${num(before.amps)} A to ${num(after.amps)} A, and the {{power}} went up four times, from ${num(before.watts)} W to ${num(after.watts)} W!`
        : `Twice the squeeze: the {{current}} halved from ${num(before.amps)} A to ${num(after.amps)} A, and the {{power}} halved too, to ${num(after.watts)} W.`,
    );
  });
}
