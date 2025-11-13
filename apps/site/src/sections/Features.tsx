const features = [
  {
    title: 'Pride',
    description: '🌈 专属社区支持'
  },
  {
    title: '二维码',
    description: '支持微信/群二维码上传'
  },
  {
    title: '更多',
    description: '等待你提建议'
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
