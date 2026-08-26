const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8');
const exists = (...segments) => fs.existsSync(path.join(root, ...segments));

const canonicalDomain = 'https://aisim.teachmeai.in';
const socialImage = '/aisim.teachmeai.png';

test('SEO metadata uses the live canonical domain and share image', () => {
  const layout = read('app', 'layout.tsx');

  assert.match(
    layout,
    new RegExp(`siteUrl\\s*=\\s*['\"]${canonicalDomain.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}['\"]`),
    'the site URL constant must use the live production domain',
  );
  assert.match(
    layout,
    /metadataBase:\s*new URL\(siteUrl\)/,
    'metadataBase must use the live production domain',
  );
  assert.match(
    layout,
    /alternates:[\s\S]*canonical:\s*['\"]\/['\"]/,
    'metadata must declare the canonical URL relative to the live metadata base',
  );
  assert.ok(exists('public', socialImage.slice(1)), 'the social preview image must exist in public');
  assert.match(
    layout,
    /const socialImage\s*=\s*`\$\{siteUrl\}\/aisim\.teachmeai\.png`/,
    'the social image must resolve from the production domain',
  );
  assert.match(layout, /openGraph:[\s\S]*url:\s*socialImage[\s\S]*twitter:/, 'Open Graph must use the social image');
  assert.match(layout, /twitter:[\s\S]*images:\s*\[socialImage\]/, 'Twitter must use the social image');
});

test('the site exposes machine-readable learning-product structured data', () => {
  const layout = read('app', 'layout.tsx');

  assert.match(layout, /application\/ld\+json/, 'the root layout must publish JSON-LD');
  assert.match(layout, /['\"]WebSite['\"]/, 'JSON-LD must describe the website');
  assert.match(layout, /['\"]LearningResource['\"]/, 'JSON-LD must describe the learning experience');
  assert.match(layout, /['\"]WebApplication['\"]/, 'JSON-LD must describe the interactive simulation');
});

test('search and agent discovery files exist with useful crawl guidance', () => {
  assert.ok(exists('app', 'robots.ts'), 'app/robots.ts must define crawler policy');
  assert.ok(exists('app', 'sitemap.ts'), 'app/sitemap.ts must define the sitemap');
  assert.ok(exists('public', 'llms.txt'), 'public/llms.txt must provide agent-readable context');

  const robots = read('app', 'robots.ts');
  const sitemap = read('app', 'sitemap.ts');
  const llms = read('public', 'llms.txt');

  assert.match(robots, /allow:\s*['\"]\/['\"]/i, 'robots policy must allow the public site');
  assert.match(robots, /sitemap/i, 'robots policy must advertise the sitemap');
  assert.match(sitemap, /aisim\.teachmeai\.in/, 'sitemap must use the live production domain');
  assert.match(llms, /^#\s+The AI Investment Challenge/m, 'llms.txt must identify the product');
  assert.match(llms, /12[ -]quarters?/i, 'llms.txt must explain the core learning loop');
  assert.match(llms, /scenario/i, 'llms.txt must describe the available scenario system');
});
