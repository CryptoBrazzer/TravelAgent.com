#!/usr/bin/env node
/* Bake the Russian text of each legal document into its page.
   The documents are assembled by legal.js at runtime, so without this a reader
   with JavaScript off — or a crawler, or a compliance checker — sees an empty
   page where the privacy policy should be. JS still re-renders on load, which
   is what switches the language. */
const fs = require('fs');
const path = require('path');
// Needs playwright and a server for BASE. Run it after changing legal-docs.js:
//   BASE=http://127.0.0.1:8899 node tools/prerender.js
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const PAGES = ['privacy', 'terms', 'cookies', 'disclaimer', 'community'];
const BASE = process.env.BASE || 'http://127.0.0.1:8899';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await br.newPage();
  for (const name of PAGES) {
    await p.goto(`${BASE}/${name}.html?lang=ru`, { waitUntil: 'networkidle' });
    const html = await p.evaluate(() => document.getElementById('docBody').innerHTML);
    if (!html || html.length < 2000) throw new Error(`${name}: renderer produced ${html.length} chars`);

    const file = path.join(root, `${name}.html`);
    const before = fs.readFileSync(file, 'utf8');
    const after = before.replace(
      /(<main class="wrap" id="docBody">)[\s\S]*?(<\/main>)/,
      (m, open, close) => open + '\n' + html + '\n' + close
    );
    if (after === before) throw new Error(`${name}: could not find #docBody`);
    fs.writeFileSync(file, after);
    console.log(`${name}.html  ${(html.length / 1024).toFixed(1)} KB of text baked in`);
  }
  await br.close();
})();
