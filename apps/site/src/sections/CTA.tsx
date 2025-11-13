export const CTA = () => (
  <section className="py-16 border-t border-slate-800 bg-slate-900">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <p className="text-indigo-200 uppercase tracking-[0.5em] text-xs">Next Step</p>
      <h2 className="text-3xl font-semibold mt-3">准备让 GMGN Card 承载你的品牌入口？</h2>
      <p className="text-slate-300 mt-4">
        免费部署到 Cloudflare，或联系我们获取定制化运营服务。
      </p>
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <a
          className="px-8 py-3 rounded-full bg-emerald-500 text-slate-900 font-semibold"
          href="mailto:gmgn@support.com"
        >
          联系销售
        </a>
        <a
          className="px-8 py-3 rounded-full border border-slate-700"
          href="https://github.com/smxl/gmgncard"
          target="_blank"
          rel="noreferrer"
        >
          查看文档
        </a>
      </div>
    </div>
  </section>
);
