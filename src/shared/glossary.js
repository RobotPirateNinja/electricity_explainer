// Reusable glossary registry for the explainer series.
//
// Each explainer registers its words with defineTerms(), then marks words in
// its HTML as <span class="term" data-term="id">word</span> (or uses term()).
// Definitions may link to other words with {{id}} or {{id|shown text}}.
//
// Entry shape:
//   word:    the word as a heading ("Hypotenuse")
//   say:     optional pronunciation ("hy-POT-en-yoos")
//   short:   optional symbol or nickname ("sin")
//   def:     the kid-friendly meaning (required)
//   example: optional "for example..." line
//   origin:  optional word story

const registry = new Map();

export function defineTerms(terms) {
  for (const [id, entry] of Object.entries(terms)) {
    registry.set(id, { id, ...entry });
  }
}

export function getTerm(id) {
  return registry.get(id);
}

export function allTerms() {
  return [...registry.values()].sort((a, b) => a.word.localeCompare(b.word));
}

// HTML for a clickable word. Label defaults to the glossary word in lower case.
export function term(id, label) {
  const entry = registry.get(id);
  const text = label ?? (entry ? entry.word.toLowerCase() : id);
  return `<span class="term" data-term="${id}">${text}</span>`;
}

// Replace {{id}} and {{id|label}} markers with clickable words.
export function linkify(text = '') {
  return text.replace(/\{\{([\w-]+)(?:\|([^}]+))?\}\}/g, (_, id, label) => term(id, label));
}

// Fill any [data-linkify] element's text with clickable words, so plain HTML
// pages can write {{hypotenuse}} instead of the full span.
export function linkifyPage(root = document) {
  root.querySelectorAll('[data-linkify]').forEach((el) => {
    el.innerHTML = linkify(el.innerHTML);
  });
}

// Render every registered word as a card grid ("Word Bank").
export function renderGlossary(container) {
  container.innerHTML = allTerms()
    .map(
      (t) => `
      <article class="word-card" id="word-${t.id}">
        <h3>${t.word}${t.short ? ` <span class="word-short">${t.short}</span>` : ''}</h3>
        ${t.say ? `<p class="word-say">say it: <b>${t.say}</b></p>` : ''}
        <p>${linkify(t.def)}</p>
        ${t.example ? `<p class="word-example">${linkify(t.example)}</p>` : ''}
        ${t.origin ? `<p class="word-origin">Word story: ${linkify(t.origin)}</p>` : ''}
      </article>`,
    )
    .join('');
}
