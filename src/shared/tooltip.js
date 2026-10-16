// Reusable word tooltips for the explainer series.
//
// Any element with data-term="id" (HTML or SVG) becomes a word you can hover,
// tap or tab to. The bubble shows the glossary entry, and words inside the
// bubble are clickable too, with a Back button, so a child can keep asking
// "what does THAT mean?" without losing their place.

import { getTerm, linkify } from './glossary.js';

export function initTooltips() {
  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.id = 'word-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);

  let anchor = null; // element the bubble points at
  let pinned = false; // opened by click/tap: stays until dismissed
  let history = []; // words visited inside the bubble
  let hideTimer = 0;

  // Make every word focusable and announce itself as a button.
  const prepare = (root) => {
    root.querySelectorAll?.('[data-term]:not([data-term-ready])').forEach((el) => {
      el.setAttribute('data-term-ready', '');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-describedby', 'word-tip');
    });
  };
  prepare(document);
  new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => n.nodeType === 1 && prepare(n.parentNode || n));
  }).observe(document.body, { childList: true, subtree: true });

  function render() {
    const entry = getTerm(history[history.length - 1]);
    if (!entry) return;
    tip.innerHTML = `
      <div class="tip-head">
        ${history.length > 1 ? '<button class="tip-back" type="button" aria-label="Back">← back</button>' : ''}
        <span class="tip-word">${entry.word}</span>
        ${entry.short ? `<span class="tip-short">${entry.short}</span>` : ''}
        ${pinned ? '<button class="tip-close" type="button" aria-label="Close">×</button>' : ''}
      </div>
      ${entry.say ? `<div class="tip-say">say it: <b>${entry.say}</b></div>` : ''}
      <p class="tip-def">${linkify(entry.def)}</p>
      ${entry.example ? `<p class="tip-example">${linkify(entry.example)}</p>` : ''}
      ${entry.origin ? `<p class="tip-origin"><b>Word story:</b> ${linkify(entry.origin)}</p>` : ''}
      ${pinned ? '' : '<div class="tip-hint">Tap the word to keep this open</div>'}`;
    prepare(tip);
  }

  function place() {
    if (!anchor || tip.hidden) return;
    const r = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const gap = 10;
    const vw = document.documentElement.clientWidth;
    let left = r.left + r.width / 2 - t.width / 2;
    left = Math.max(8, Math.min(left, vw - t.width - 8));
    let top = r.bottom + gap;
    let below = true;
    if (top + t.height > window.innerHeight - 8 && r.top - gap - t.height > 8) {
      top = r.top - gap - t.height;
      below = false;
    }
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.dataset.side = below ? 'below' : 'above';
    const arrowX = Math.max(14, Math.min(r.left + r.width / 2 - left, t.width - 14));
    tip.style.setProperty('--arrow-x', `${arrowX}px`);
  }

  function show(el, { pin = false } = {}) {
    clearTimeout(hideTimer);
    const id = el.getAttribute('data-term');
    if (!getTerm(id)) return;
    if (anchor) anchor.classList.remove('term-active');
    anchor = el;
    anchor.classList.add('term-active');
    pinned = pin;
    history = [id];
    tip.hidden = false;
    render();
    place();
  }

  function hide() {
    clearTimeout(hideTimer);
    tip.hidden = true;
    pinned = false;
    if (anchor) anchor.classList.remove('term-active');
    anchor = null;
  }

  const hideSoon = () => {
    if (pinned) return;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 180);
  };

  // Hover (mouse only: touch uses tap)
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || pinned) return;
    if (tip.contains(e.target)) return clearTimeout(hideTimer);
    const el = e.target.closest?.('[data-term]');
    if (el && el !== anchor) show(el);
    else if (el) clearTimeout(hideTimer);
  });
  document.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    const from = e.target.closest?.('[data-term]') || (tip.contains(e.target) && tip);
    if (from && !(e.relatedTarget && (tip.contains(e.relatedTarget) || anchor?.contains(e.relatedTarget)))) hideSoon();
  });

  // Click / tap: pin open, follow words inside the bubble, or close.
  document.addEventListener('click', (e) => {
    if (tip.contains(e.target)) {
      if (e.target.closest('.tip-close')) return hide();
      if (e.target.closest('.tip-back')) {
        history.pop();
        render();
        return place();
      }
      const inner = e.target.closest('[data-term]');
      if (inner) {
        pinned = true;
        history.push(inner.getAttribute('data-term'));
        render();
        place();
      }
      return;
    }
    const el = e.target.closest?.('[data-term]');
    if (el) {
      if (el === anchor && pinned) return hide();
      return show(el, { pin: true });
    }
    if (!tip.hidden) hide();
  });

  // Keyboard
  document.addEventListener('focusin', (e) => {
    if (tip.contains(e.target) || pinned) return;
    const el = e.target.closest?.('[data-term]');
    if (el) show(el);
  });
  document.addEventListener('focusout', (e) => {
    if (!pinned && e.target.closest?.('[data-term]') && !tip.contains(e.relatedTarget)) hideSoon();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tip.hidden) {
      const back = anchor;
      hide();
      back?.focus?.();
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-term]')) {
      e.preventDefault();
      e.target.click();
    }
  });

  window.addEventListener('resize', place);
  window.addEventListener('scroll', () => (pinned ? place() : hide()), { passive: true });

  return { hide };
}
