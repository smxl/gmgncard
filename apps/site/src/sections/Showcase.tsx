const steps = [
  '注册账号或通过 Access 登录',
  '提交二维码、资料等待审核',
  '发布个性化 @handle 页面并追踪数据'
];

const mockLinks = [
  { title: 'GMGN 官网', url: 'gmgncard.com', hidden: false },
  { title: '客服微信', url: 'wechat://gmgn', hidden: false },
  { title: '内部链接', url: 'private.gmgn', hidden: true }
];

export const Showcase = () => (
  <section className="py-20">
    <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <p className="text-indigo-200 uppercase tracking-[0.4em] text-xs">Workflow</p>
        <h2 className="text-3xl font-semibold mt-3">三步搭建品牌主页</h2>
        <ol className="mt-6 space-y-3 text-slate-300">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-200 flex items-center justify-center text-sm">
                {index + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20" />
          <div>
            <p className="font-semibold">Alice Zhang</p>
            <p className="text-slate-400 text-sm">@alice</p>
          </div>
        </div>
        <div className="space-y-3">
          {mockLinks.map((link) => (
            <div key={link.title} className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 flex justify-between">
              <div>
                <p className="font-semibold">{link.title}</p>
                <p className="text-xs text-slate-400">{link.url}</p>
              </div>
              {link.hidden && <span className="text-amber-400 text-xs">Hidden</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
