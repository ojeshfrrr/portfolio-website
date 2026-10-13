import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRobots,
  buildSitemap,
  buildSocialUrls,
  isPreviewDeployment,
  resolvePublicOrigin,
  sitemapPaths,
} from '../src/lib/seo-config.mjs';

test('public origin accepts only a verified HTTPS origin', () => {
  assert.equal(resolvePublicOrigin('https://portfolio.example'), 'https://portfolio.example');
  assert.equal(resolvePublicOrigin('https://portfolio.example/'), 'https://portfolio.example');
  for (const candidate of [undefined, '', 'http://portfolio.example', 'http://localhost:3000', 'https://localhost', 'https://site.localhost', 'https://127.0.0.1', 'https://user:secret@portfolio.example', 'https://portfolio.example/path', 'https://portfolio.example/?preview=1']) {
    assert.equal(resolvePublicOrigin(candidate), undefined, `should reject ${candidate}`);
  }
});

test('sitemap includes only configured public page URLs and excludes the interactive planner', () => {
  assert.deepEqual(sitemapPaths, ['/', '/work', '/work/rewatch', '/work/arcus', '/lab', '/services', '/process', '/about', '/contact']);
  assert.ok(!sitemapPaths.includes('/start'));
  assert.deepEqual(buildSitemap(undefined), []);
  assert.deepEqual(buildSitemap('https://portfolio.example', sitemapPaths, true), []);
  const result = buildSitemap('https://portfolio.example');
  assert.equal(result.length, 9);
  assert.deepEqual(result[0], { url: 'https://portfolio.example/' });
  assert.ok(result.every(({ url }) => url.startsWith('https://portfolio.example/')));
  assert.equal(new Set(result.map(({ url }) => url)).size, result.length);
});

