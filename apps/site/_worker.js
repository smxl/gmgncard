const DEFAULT_WORKER_BASE = 'https://gmgncard-worker.beg.workers.dev';
const DEFAULT_ADMIN_BASE = 'https://gmgncard-admin.pages.dev';

const normalizeBase = (value, fallback) => {
  const base = (value ?? fallback).trim();
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

const proxyFetch = (request, target) => {
  const proxied = new Request(target, request);
  return fetch(proxied);
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const workerBase = normalizeBase(env.WORKER_BASE_URL, DEFAULT_WORKER_BASE);
    const adminBase = normalizeBase(env.ADMIN_BASE_URL, DEFAULT_ADMIN_BASE);

    const forwardToWorker = () => {
      const targetUrl = `${workerBase}${url.pathname}${url.search}`;
      return proxyFetch(request, targetUrl);
    };

    if (url.pathname.startsWith('/api/')) {
      return forwardToWorker();
    }

    if (url.pathname.startsWith('/card/')) {
      return forwardToWorker();
    }

    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      const remainder = url.pathname.replace(/^\/admin/, '') || '/';
      const targetUrl = `${adminBase}${remainder}${url.search}`;
      return proxyFetch(request, targetUrl);
    }

    return env.ASSETS.fetch(request, env, ctx);
  }
};
