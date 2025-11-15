import type { PagesFunction } from '@cloudflare/workers-types';

const DEFAULT_WORKER_BASE = 'https://gmgncard-worker.beg.workers.dev';
const DEFAULT_ADMIN_BASE = 'https://gmgncard-admin.pages.dev';

type FunctionEnv = {
  WORKER_BASE_URL?: string;
  ADMIN_BASE_URL?: string;
};

const proxyRequest = (request: Request, target: string) => {
  const proxy = new Request(target, request);
  return fetch(proxy);
};

export const onRequest: PagesFunction<FunctionEnv> = async (context) => {
  const url = new URL(context.request.url);
  const workerBase = (context.env.WORKER_BASE_URL ?? DEFAULT_WORKER_BASE).replace(/\/$/, '');
  const adminBase = (context.env.ADMIN_BASE_URL ?? DEFAULT_ADMIN_BASE).replace(/\/$/, '');

  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    const target = new URL(`${pathname}${url.search}`, workerBase);
    return proxyRequest(context.request, target.toString());
  }

  if (pathname.startsWith('/card/')) {
    const target = new URL(`${pathname}${url.search}`, workerBase);
    return proxyRequest(context.request, target.toString());
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const remainder = pathname.replace(/^\/admin/, '') || '/';
    const target = new URL(`${remainder}${url.search}`, adminBase);
    return proxyRequest(context.request, target.toString());
  }

  return context.next();
};
