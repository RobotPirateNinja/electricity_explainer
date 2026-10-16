# Volts, Amps, Ohms & Watts: an electricity explainer

The second app in the *Explainers for Titus* series: an interactive, kid-friendly
page (ages 8–10) about voltage, current, resistance and power. Plain Vite +
vanilla JS, no framework.

## Run it

```sh
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the built dist/
```

## Deploy (Netlify)

`netlify.toml` already sets the build command (`npm run build`) and publish
folder (`dist`). Point a Netlify site at this folder (or its Git repo) and it
builds with no extra settings.

## What's on the page

1. **Round and round: the circuit**: a battery and a bulb with a gap. Pick things
   from the kitchen drawer to bridge it and find conductors, insulators and the
   in-betweens (pencil lead, salty water) that only make the bulb glow dimly.
2. **Push, flow and squeeze**: one pair of sliders drives two pictures side by
   side, the real circuit (electrons speed up with the current, the bulb glows
   with the power) and a water analogy (tank depth = voltage, a squeeze in the
   pipe = resistance, flow = current, a water wheel = power). Live readouts show
   I = V ÷ R and P = V × I. Too much power makes the bulb overheat.
3. **Watts around the house**: everyday appliances compared with an LED bulb.
4. **How they're connected**: cover-up triangles for Ohm's law (V = I × R) and
   power (P = V × I) with the lab's live numbers, plus "double it" experiments.
5. **Missions**: small goals that tick themselves off.
6. **Word bank**: every word, generated from the glossary.

Colours are fixed per idea everywhere: voltage red, current blue, resistance
purple, power amber.

## Shared pieces

`src/shared/` is the same topic-free code as in the trig explainer (copy it, or
later turn it into a shared package):

- `glossary.js`: `defineTerms({...})` registers words; `term(id, label)` and
  `{{id}}` / `{{id|label}}` markers (in any element with `data-linkify`, or via
  `linkify()`) turn words into clickable terms; `renderGlossary(el)` builds a Word Bank.
- `tooltip.js`: `initTooltips()` once per page. Any HTML or SVG element with
  `data-term="id"` gets a bubble on hover, tap or keyboard focus. Words inside a
  bubble are clickable too, with a Back button.
- `explainer.css`: page base, term underline, the bubble and Word Bank cards.

This explainer's own words are in `src/terms.js`. Each entry can have `word`,
`say` (pronunciation), `short` (symbol), `def`, `example` and `origin` (word story).

## Node version

This project uses **Vite 6**, which runs on Node 18 or newer. (Vite 7 and 8 need
Node 20.19+ or 22.12+; on older Node, npm silently skips their native bundler and
`npm run dev` fails with "Cannot find native binding".)

## Installable app and link previews

- `public/manifest.webmanifest` plus the icons in `public/icons/` and
  `public/apple-touch-icon.png` let phones and Chrome "install" the page.
- `public/og-image.png` (1200×630) is the picture shown when the link is shared.
  Social sites need its full web address, so `vite.config.js` fills it in from
  Netlify's `URL` setting at build time. To use a custom domain, set
  `VITE_SITE_URL` (for example `https://electricity.example.com`) in Netlify.

## License

[MIT](LICENSE)
