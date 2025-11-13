import { useMemo } from 'react';

const gradients = ['from-indigo-500 via-sky-500 to-emerald-400', 'from-purple-600 via-pink-500 to-orange-400'];

export const Hero = () => {
  const gradient = useMemo(() => gradients[Math.floor(Math.random() * gradients.length)], []);

  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br opacity-40 blur-3xl animate-pulse" />
      <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
        <p className="uppercase tracking-[0.6em] text-xs text-indigo-200">Cloudflare Native</p>
        <h1 className="text-4xl md:text-6xl font-semibold leading-tight mt-6">
          GMGN Card
          <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>
            LinkStack, reimagined for CN compliance
          </span>
        </h1>
        <p className="mt-6 text-slate-300 max-w-2xl mx-auto">
          一站式 Worker + Pages 方案，原生支持二维码验证、微信/群资料、举报审核、R2 多媒体存储。让运营团队无需自建后端即可管理品牌主页。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            className="px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 transition shadow-lg shadow-indigo-500/25"
            href="/admin"
          >
            进入管理后台
          </a>
          <a
            className="px-6 py-3 rounded-full border border-slate-700 hover:border-slate-500"
            href="https://github.com/smxl/gmgncard"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
};
