import './shared/explainer.css';
import './style.css';
import './terms.js';
import { linkify, linkifyPage, renderGlossary } from './shared/glossary.js';
import { initTooltips } from './shared/tooltip.js';
import { createState, num, solve } from './util.js';
import { mountCircuit } from './diagrams/circuit.js';
import { mountWater } from './diagrams/water.js';
import { mountRelations } from './relations.js';

const $ = (id) => document.getElementById(id);
let ready = false; // missions are checked once every section is mounted
const missionState = { switchedOff: false, moreFlowSamePush: false, mostPower: false, coveredI: false };

linkifyPage();
initTooltips();

// ---------- 1. Fill the gap: conductors and insulators ----------
const BULB_OHMS = 6;
const GAP_VOLTS = 3;
// ohms: Infinity means an insulator (nothing gets through)
const ITEMS = [
  { id: 'spoon', emoji: '🥄', name: 'metal spoon', ohms: 0, says: 'Metal is a {{conductor}}: its {{electron|electrons}} can move freely, so the bulb lights up bright.' },
  { id: 'clip', emoji: '📎', name: 'paper clip', ohms: 0, says: 'A paper clip is steel wire, a {{metal}}, so it’s a {{conductor}}. Bright!' },
  { id: 'coin', emoji: '🪙', name: 'coin', ohms: 0, says: 'Coins are {{metal}}, so they’re {{conductor|conductors}}. On goes the light!' },
  { id: 'pencil', emoji: '✏️', name: 'pencil lead', ohms: 10, says: 'Pencil "lead" is really {{graphite}}. It lets some {{electricity}} through, but it has lots of {{resistance}}, so the bulb only glows dimly.' },
  { id: 'salt', emoji: '🧂', name: 'salty water', ohms: 20, says: 'Salt in water lets a little {{current}} through, so the bulb just barely glows. (Pure water hardly conducts at all.)' },
  { id: 'glove', emoji: '🧤', name: 'rubber glove', ohms: Infinity, says: 'Rubber is an {{insulator}}: its electrons are stuck in place. That’s why electricians wear rubber gloves!' },
  { id: 'wood', emoji: '🪵', name: 'wooden stick', ohms: Infinity, says: 'Dry wood is an {{insulator}}. The {{circuit}} has a gap, so nothing flows.' },
  { id: 'ruler', emoji: '📏', name: 'plastic ruler', ohms: Infinity, says: 'Plastic is an {{insulator}}. It’s what keeps you safe from the {{copper}} inside a {{wire}}.' },
];

const gap = createState({ item: null });
const drawGap = mountCircuit($('gap-svg'), { gap: true });
$('gap-items').innerHTML = ITEMS.map(
  (it) => `<button type="button" class="item-btn" data-item="${it.id}"><span class="item-icon">${it.emoji}</span>${it.name}</button>`,
).join('');
$('gap-items').addEventListener('click', (e) => {
  const id = e.target.closest('[data-item]')?.dataset.item;
  if (id) gap.set({ item: ITEMS.find((it) => it.id === id) });
});
const gapTried = new Set();
gap.subscribe(({ item }) => {
  document.querySelectorAll('.item-btn').forEach((b) => b.classList.toggle('chosen', b.dataset.item === item?.id));
  const closed = !!item && item.ohms !== Infinity;
  const amps = closed ? GAP_VOLTS / (BULB_OHMS + item.ohms) : 0;
  const bulbWatts = amps * amps * BULB_OHMS;
  drawGap({ volts: GAP_VOLTS, amps, glow: Math.sqrt(bulbWatts / 1.5), closed, item });
  const verdict = $('gap-verdict');
  if (!item) {
    verdict.innerHTML = linkify('The {{circuit}} has a gap, so the bulb is dark. Pick something to bridge the gap.');
    verdict.className = 'verdict';
  } else {
    const kind = item.ohms === Infinity ? 'Insulator' : item.ohms > 0 ? 'A bit of both' : 'Conductor';
    verdict.innerHTML = `<b>${kind}!</b> ${linkify(item.says)}`;
    verdict.className = `verdict ${item.ohms === Infinity ? 'v-no' : item.ohms > 0 ? 'v-dim' : 'v-yes'}`;
    gapTried.add(item.ohms === Infinity ? 'insulator' : item.ohms > 0 ? 'dim' : 'conductor');
  }
  checkMissions();
});

// ---------- 2. The circuit lab: voltage, resistance, current, power ----------
const HOT_WATTS = 60;
const lab = createState({ volts: 6, ohms: 12, on: true });
const toggle = () => lab.set({ on: !lab.get().on });
const drawLab = mountCircuit($('lab-svg'), { onSwitch: toggle });
const drawWater = mountWater($('water-svg'), { onTap: toggle });

$('lab-volts').addEventListener('input', (e) => lab.set({ volts: +e.target.value }));
$('lab-ohms').addEventListener('input', (e) => lab.set({ ohms: +e.target.value }));
$('lab-switch').addEventListener('click', toggle);

let prev = null;
lab.subscribe((s) => {
  const v = solve(s);
  const hot = v.watts > HOT_WATTS;
  $('lab-volts').value = s.volts;
  $('lab-ohms').value = s.ohms;
  $('lab-volts-out').textContent = `${num(s.volts)} V`;
  $('lab-ohms-out').textContent = `${s.ohms} Ω`;
  $('lab-switch').textContent = s.on ? 'Switch off' : 'Switch on';
  $('lab-switch').setAttribute('aria-pressed', String(s.on));

  drawLab({ ...v, glow: Math.min(1, Math.sqrt(v.watts / 50)), closed: s.on, hot });
  drawWater({ ...v, closed: s.on });

  $('v-volt').textContent = `${num(v.volts)} V`;
  $('v-ohm').textContent = `${num(v.ohms)} Ω`;
  $('v-amp').textContent = `${num(v.amps)} A`;
  $('v-watt').textContent = `${num(v.watts)} W`;
  $('s-amp').innerHTML = s.on
    ? `<span class="c-volt">${num(v.volts)} V</span> ÷ <span class="c-ohm">${v.ohms} Ω</span> = ${num(v.amps)} A`
    : 'The switch is off, so there’s a gap. Nothing flows.';
  $('s-watt').innerHTML = `<span class="c-volt">${num(v.volts)} V</span> × <span class="c-amp">${num(v.amps)} A</span> = ${num(v.watts)} W`;
  $('m-volt').style.width = `${(v.volts / 12) * 100}%`;
  $('m-ohm').style.width = `${(v.ohms / 50) * 100}%`;
  $('m-amp').style.width = `${Math.min(100, (v.amps / 12) * 100)}%`;
  $('m-watt').style.width = `${Math.min(100, (v.watts / 144) * 100)}%`;
  $('lab-flash').innerHTML = !s.on
    ? linkify('Switch off: the {{circuit}} is broken, so the {{electron|electrons}} stop.')
    : hot
      ? linkify('Whoa! That much {{power}} makes a lot of {{heat}}. A real bulb would burn out.')
      : v.amps === 0
        ? linkify('No push, no flow: with 0 {{volt|volts}}, nothing moves.')
        : '';

  if (!s.on) missionState.switchedOff = true;
  if (prev && prev.on && s.on && prev.volts === s.volts && v.amps > solve(prev).amps) missionState.moreFlowSamePush = true;
  prev = s;
  checkMissions();
});

// ---------- 3. Watts around the house ----------
const LED_WATTS = 9;
const APPLIANCES = [
  { id: 'charger', emoji: '🔌', name: 'Phone charger', watts: 5 },
  { id: 'led', emoji: '💡', name: 'LED light bulb', watts: 9 },
  { id: 'laptop', emoji: '💻', name: 'Laptop', watts: 60 },
  { id: 'tv', emoji: '📺', name: 'Television', watts: 100 },
  { id: 'fridge', emoji: '🧊', name: 'Fridge', watts: 150 },
  { id: 'microwave', emoji: '🍿', name: 'Microwave', watts: 1000 },
  { id: 'hairdryer', emoji: '💨', name: 'Hair dryer', watts: 1500 },
  { id: 'kettle', emoji: '🫖', name: 'Kettle', watts: 2000 },
];
const house = createState({ id: 'led' });
$('appliance-list').innerHTML = APPLIANCES.map(
  (a) => `<button type="button" class="item-btn" data-app="${a.id}"><span class="item-icon">${a.emoji}</span>${a.name}</button>`,
).join('');
$('appliance-list').addEventListener('click', (e) => {
  const id = e.target.closest('[data-app]')?.dataset.app;
  if (id) house.set({ id });
});
house.subscribe(({ id }) => {
  const a = APPLIANCES.find((x) => x.id === id);
  document.querySelectorAll('[data-app]').forEach((b) => b.classList.toggle('chosen', b.dataset.app === id));
  const leds = a.watts / LED_WATTS;
  const watts = a.watts >= 1000 ? `${a.watts.toLocaleString('en')} W ({{kilowatt|${num(a.watts / 1000)} kW}})` : `${a.watts} W`;
  const compare =
    a.id === 'led'
      ? 'This is our measuring stick: every little light below is one LED bulb.'
      : leds < 1
        ? `That’s less than one {{led|LED}} bulb: about ${Math.round(leds * 10) / 10} of one.`
        : `That’s as much {{power}} as <b>${Math.round(leds).toLocaleString('en')}</b> {{led|LED}} bulbs all switched on at once!`;
  $('appliance-info').innerHTML = linkify(`<span class="app-big">${a.emoji} ${a.name}: <b class="c-watt">${watts}</b></span><br>${compare}`);
  const count = Math.max(1, Math.round(leds));
  $('led-grid').innerHTML = '<span class="led-dot"></span>'.repeat(count);
  $('led-grid').classList.toggle('tiny', count > 60);
  $('led-grid').setAttribute('aria-label', `${count} LED bulbs`);
  if (a.id === 'kettle') missionState.mostPower = true;
  checkMissions();
});

// ---------- 4. How they're connected ----------
const rules = createState({ ohm: null, power: null });
mountRelations($('relations-root'), lab, rules);
rules.subscribe(({ ohm, power }) => {
  if (ohm === 'left' || power === 'right') missionState.coveredI = true;
  checkMissions();
});

// ---------- 5. Missions ----------
const labNow = () => solve(lab.get());
const missions = [
  { text: 'Put a {{conductor}} in the gap and light the bulb.', done: () => gapTried.has('conductor') },
  { text: 'Find an {{insulator}} that keeps the bulb dark.', done: () => gapTried.has('insulator') },
  { text: 'Find something that makes the bulb glow only dimly. What’s it made of?', done: () => gapTried.has('dim') },
  { text: 'Flip the {{switch}} off in the lab and watch the {{electron|electrons}} stop.', done: () => missionState.switchedOff },
  { text: 'Make exactly 1 {{amp}} of {{current}} flow.', done: () => lab.get().on && Math.abs(labNow().amps - 1) < 1e-9 },
  { text: 'Make more current flow <b>without</b> touching the {{voltage}} slider.', done: () => missionState.moreFlowSamePush },
  { text: 'Make the circuit use exactly 12 {{watt|watts}}. (There’s more than one way!)', done: () => lab.get().on && Math.abs(labNow().watts - 12) < 1e-9 },
  { text: 'Turn the {{power}} up so high that the bulb gets too hot.', done: () => lab.get().on && labNow().watts > HOT_WATTS },
  { text: 'Find the {{appliance}} that uses the most power.', done: () => missionState.mostPower },
  { text: 'In a rule triangle, cover up the I to find the {{formula}} for {{current}}.', done: () => missionState.coveredI },
];
const doneEver = new Set();
ready = true;

function checkMissions() {
  if (!ready) return;
  const list = $('mission-list');
  if (!list.children.length) {
    list.innerHTML = missions.map((m) => `<li><span class="check" aria-hidden="true"></span><span>${linkify(m.text)}</span></li>`).join('');
  }
  missions.forEach((m, i) => {
    if (m.done()) doneEver.add(i);
    list.children[i].classList.toggle('done', doneEver.has(i));
  });
  const n = doneEver.size;
  $('mission-score').textContent =
    n === missions.length ? `All ${n} missions complete. You’re a fully charged electricity expert! ⚡` : `${n} of ${missions.length} missions complete`;
}
checkMissions();

// ---------- 6. Word bank ----------
renderGlossary($('word-bank'));
