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

