import { usePlaza } from '../hooks/usePlaza';

export const Plaza = () => {
  const plazaQuery = usePlaza();
  const users = plazaQuery.data?.data ?? [];

  return (
    <section className="py-20 border-t border-slate-800 bg-slate-900/30">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-indigo-200 uppercase tracking-[0.4em] text-xs">Plaza</p>
            <h2 className="text-3xl font-semibold mt-2">发现新朋友</h2>
          </div>
          <a href="/admin" className="text-sm text-indigo-300 underline">
            登入我的页面 →
          </a>
        </div>
        {plazaQuery.isLoading && <p className="text-slate-400">加载中…</p>}
        {plazaQuery.isError && <p className="text-rose-300">无法加载广场数据</p>}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {users.map((user: any) => (
            <article key={user.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-sm">@</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{user.displayName}</p>
                  <p className="text-slate-400 text-sm">@{user.handle}</p>
                </div>
                {user.adLabel && <span className="ml-auto text-xs px-2 py-1 rounded-full bg-amber-400/20 text-amber-300">ad</span>}
              </div>
              {user.bio && <p className="text-slate-300 text-sm mt-4 line-clamp-3">{user.bio}</p>}
              <a className="mt-4 inline-flex text-indigo-300 text-sm" href={`/@${user.handle}`}>
                查看主页 →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
