#!/usr/bin/env node
/**
 * Quick smoke test for the Worker + Admin API.
 * Usage: WORKER_BASE=http://localhost:8787 pnpm smoke
 */

const base = (process.env.WORKER_BASE ?? 'http://localhost:8787').replace(/\/$/, '');

const routes = [
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/users' },
  { method: 'GET', path: '/api/users/alice' },
  { method: 'GET', path: '/@alice', type: 'text' }
];

const fetchJson = async (url, init) => {
  const response = await fetch(url, init);
  const body = await response.text();
  let parsed = body;
  try {
    parsed = JSON.parse(body);
  } catch {
    // non-JSON response
  }
  return { ok: response.ok, status: response.status, body: parsed };
};

const run = async () => {
  let failures = 0;
  for (const route of routes) {
    const url = `${base}${route.path}`;
    try {
      const result = await fetchJson(url, { method: route.method });
      if (!result.ok) {
        failures += 1;
        console.error(`✗ ${route.method} ${route.path} -> ${result.status}`, result.body);
      } else {
        console.log(`✓ ${route.method} ${route.path} -> ${result.status}`);
      }
    } catch (error) {
      failures += 1;
      console.error(`✗ ${route.method} ${route.path} -> error`, error);
    }
  }
  if (failures > 0) {
    process.exitCode = 1;
  } else {
    console.log('Smoke tests passed.');
  }
};

run();
