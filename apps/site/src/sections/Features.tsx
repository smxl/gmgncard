const features = [
  {
    title: 'Cloudflare 原生',
    description: 'Workers API + D1/KV/R2 + Pages 前端，一份代码覆盖多环境。'
  },
  {
    title: '二维码验证',
    description: '支持微信/群二维码上传、审核和公开页面展示，符合监管要求。'
  },
  {
    title: '举报与风控',
    description: '内置举报 API、状态流转及 KV 缓存，快速响应用户反馈。'
  }
];

export const Features = () => (
  <section className="py-16 border-t border-slate-800 bg-slate-900/30">
    <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8">
      {features.map((feature) => (
        <article key={feature.title} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{feature.description}</p>
        </article>
      ))}
    </div>
  </section>
);
