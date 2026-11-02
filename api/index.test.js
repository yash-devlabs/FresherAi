import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreExpressPath } from './index.js';

test('restores nested API paths from the Vercel rewrite before Express routing', () => {
  for (const path of ['/api/dashboard', '/api/roadmap/latest', '/api/interview/start', '/api/resume/history', '/api/feedback/latest']) {
    const req = { url: `/api/index?__express_path=${encodeURIComponent(path)}` };
    restoreExpressPath(req);
    assert.equal(req.url, path);
  }
});

test('preserves endpoint query parameters while removing the internal rewrite parameter', () => {
  const req = { url: '/api/index?__express_path=%2Fapi%2Froadmap%2Flatest&view=compact' };
  restoreExpressPath(req);
  assert.equal(req.url, '/api/roadmap/latest?view=compact');
});

test('does not rewrite non-API requests or unsafe path values', () => {
  const frontend = { url: '/dashboard' };
  const unsafe = { url: '/api/index?__express_path=%2Fadmin%2Fdata' };
  restoreExpressPath(frontend);
  restoreExpressPath(unsafe);
  assert.equal(frontend.url, '/dashboard');
  assert.equal(unsafe.url, '/api/index?__express_path=%2Fadmin%2Fdata');
});

test('all reported production endpoints are registered as POST routes in Express', async () => {
  const { app } = await import('../backend/app.js');
  const routes = new Set();
  function collect(stack, prefix = '') {
    for (const layer of stack || []) {
      if (layer.route) {
        for (const method of Object.keys(layer.route.methods)) routes.add(`${method.toUpperCase()} ${prefix}${layer.route.path}`);
      } else if (layer.handle?.stack) {
        collect(layer.handle.stack, prefix);
      }
    }
  }
  collect(app.router?.stack);
  for (const path of ['/dashboard', '/roadmap/latest', '/interview/start', '/resume/history', '/feedback/latest']) {
    assert.ok(routes.has(`POST ${path}`), `Express POST ${path} route is missing`);
  }
});
