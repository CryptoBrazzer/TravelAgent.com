#!/usr/bin/env node
/* Stamp every asset reference in the HTML with a hash of that asset's content.
   Without this a redeploy reuses the same URL, and any browser holding the file
   from a previous visit keeps serving it from disk until the cache expires. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const hashes = new Map();

function hashOf(rel) {
  if (hashes.has(rel)) return hashes.get(rel);
  const file = path.join(root, rel.replace(/^\//, ''));
  if (!fs.existsSync(file)) return null;
  const h = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 10);
  hashes.set(rel, h);
  return h;
}

let changed = 0;
for (const page of pages) {
  const file = path.join(root, page);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(
    /(?:href|src)="(\/assets\/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"/g,
    (m, rel) => {
      const h = hashOf(rel);
      if (!h) { console.warn('  missing asset:', rel, 'in', page); return m; }
      return m.replace(/"[^"]*"/, `"${rel}?v=${h}"`);
    }
  );
  if (after !== before) { fs.writeFileSync(file, after); changed++; }
}

console.log(`stamped ${hashes.size} assets across ${changed} page(s)`);
for (const [rel, h] of hashes) console.log('  ' + h + '  ' + rel);
