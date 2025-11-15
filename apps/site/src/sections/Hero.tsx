import { useMemo, useState } from 'react';
import { RegisterDialog } from '../components/RegisterDialog';

const gradients = ['from-indigo-500 via-sky-500 to-emerald-400', 'from-purple-600 via-pink-500 to-orange-400'];

export const Hero = () => {
  const gradient = useMemo(() => gradients[Math.floor(Math.random() * gradients.length)], []);
  const [showDialog, setShowDialog] = useState(false);

  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br opacity-40 blur-3xl animate-pulse" />
      <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
        <p className="uppercase tracking-[0.6em] text-xs text-indigo-200">Gay.Pet with Luv</p>
        <h1 className="text-4xl md:text-6xl font-semibold leading-tight mt-6">
          GMGN Card
          <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>
            Gay Man Get Now, Card
          </span>
        </h1>
        <p className="mt-6 text-slate-300 max-w-2xl mx-auto">
          由 Gay.Pet 提供的专为同志群体设计的数字身份认证与社交平台，旨在提供安全、私密且多样化的服务，帮助用户建立真实可信的数字身份，促进社区内的交流与支持。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            className="px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 transition shadow-lg shadow-indigo-500/25"
            onClick={() => setShowDialog(true)}
            type="button"
          >
            申请
          </button>
          <a
            className="px-6 py-3 rounded-full border border-slate-700 hover-border-slate-500"
            href="/admin"
          >
            登入
          </a>
        </div>
        {showDialog && <RegisterDialog onClose={() => setShowDialog(false)} />}
      </div>
    </header>
  );
};
