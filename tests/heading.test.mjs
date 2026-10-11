import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Exercise the real TSX component and installed React renderer, with no browser
// globals. This checks the readable baseline, not native animation or hydration.
const require = createRequire(new URL('../src/components/PageHeading.tsx', import.meta.url));
const { PathnameContext } = require('next/dist/shared/lib/hooks-client-context.shared-runtime');
const source = readFileSync(new URL('../src/components/PageHeading.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const componentModule = { exports: {} };
runInNewContext(compiled, { module: componentModule, exports: componentModule.exports, require });
const PageHeading = componentModule.exports.default;

test('transition heading is visible and retains accessible semantics in server-rendered routes', () => {
  const routes = ['/', '/work', '/work/rewatch', '/work/arcus', '/services', '/process', '/about', '/contact', '/start'];
  for (const pathname of routes) {
    const html = renderToStaticMarkup(React.createElement(PathnameContext.Provider, { value: pathname },
      React.createElement(PageHeading, { id: 'page-title', 'aria-label': 'Page title', className: 'editorial-heading' },
        'A considered interface', React.createElement('span', { className: 'brand-dot', 'aria-hidden': true }, '.'))));
    assert.equal((html.match(/<h1\b/g) || []).length, 1, pathname);
    assert.match(html, /id="page-title"/);
    assert.match(html, /aria-label="Page title"/);
    assert.match(html, /class="editorial-heading"/);
    assert.match(html, /A considered interface/);
    assert.match(html, /<span class="brand-dot" aria-hidden="true">\.<\/span>/);
    assert.doesNotMatch(html.match(/<h1\b[^>]*>/)[0], /\s(?:style|hidden)=|aria-hidden="true"/);
  }
});

test('heading fallback remains readable without pathname context or browser animation APIs', () => {
  const html = renderToStaticMarkup(React.createElement(PageHeading, null, 'Direct page access'));
  assert.equal(html, '<h1>Direct page access</h1>');
});
