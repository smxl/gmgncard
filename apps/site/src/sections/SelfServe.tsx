import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { submitVerificationRequest, type VerificationRequestBody } from '../lib/api';
import { TurnstileWidget } from '../components/TurnstileWidget';

const emptyProfile = {
  pSize: '',
  fSize: '',
  topPosition: '',
  bottomPosition: '',
  versPosition: '',
  sidePreference: '',
  hidePosition: false,
  notes: ''
};

export const SelfServe = () => {
  const [form, setForm] = useState({
    handle: '',
    displayName: '',
    email: '',
    password: '',
    bio: ''
  });
  const [profile, setProfile] = useState(emptyProfile);
  const [links, setLinks] = useState([{ title: '', url: '' }]);
  const [turnstileToken, setTurnstileToken] = useState('');
  const mutation = useMutation({
    mutationFn: (payload: VerificationRequestBody) => submitVerificationRequest(payload)
  });

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.handle &&
          form.displayName &&
          form.email &&
          form.password &&
          turnstileToken &&
          !mutation.isPending
      ),
    [form, turnstileToken, mutation.isPending]
  );

  const handleLinkChange = (index: number, field: 'title' | 'url', value: string) => {
    setLinks((prev) => prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  };

  const addLink = () => {
    setLinks((prev) => [...prev, { title: '', url: '' }]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const cleanLinks = links.filter((link) => link.title && link.url);
    await mutation.mutateAsync({
      ...form,
      turnstileToken,
      profile: {
        ...profile,
        pSize: profile.pSize || undefined,
        fSize: profile.fSize || undefined,
        topPosition: profile.topPosition || undefined,
        bottomPosition: profile.bottomPosition || undefined,
        versPosition: profile.versPosition || undefined,
        sidePreference: profile.sidePreference || undefined,
        notes: profile.notes || undefined,
        hidePosition: profile.hidePosition
      },
      links: cleanLinks
    });
    setForm({ handle: '', displayName: '', email: '', password: '', bio: '' });
    setProfile(emptyProfile);
    setLinks([{ title: '', url: '' }]);
    setTurnstileToken('');
  };

  return (
    <section id="join" className="py-20 bg-slate-950 border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-indigo-200 uppercase tracking-[0.4em] text-xs">Join</p>
          <h2 className="text-3xl font-semibold mt-2">提交资料，加入 GMGN Card</h2>
          <p className="text-slate-400 mt-3 text-sm">
            完成表单后，我们会将资料标记为 Pending，管理员审核通过后即可在 plaza 展示。
          </p>
        </div>
        <form className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-3xl p-8" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            <label className="form-field">
              <span>Handle</span>
              <input
                value={form.handle}
                onChange={(event) => setForm((prev) => ({ ...prev, handle: event.target.value.toLowerCase() }))}
                placeholder="例如 alice"
                required
              />
            </label>
            <label className="form-field">
              <span>显示名称</span>
              <input
                value={form.displayName}
                onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                required
              />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>
            <label className="form-field">
              <span>密码</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </label>
          </div>
          <label className="form-field">
            <span>个人简介</span>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              placeholder="我们会展示在你的 @handle 页面上"
            />
          </label>
          <div className="grid md:grid-cols-3 gap-6">
            <label className="form-field">
              <span>Top Size</span>
              <input value={profile.pSize} onChange={(event) => setProfile((prev) => ({ ...prev, pSize: event.target.value }))} />
            </label>
            <label className="form-field">
              <span>Bottom Size</span>
              <input value={profile.fSize} onChange={(event) => setProfile((prev) => ({ ...prev, fSize: event.target.value }))} />
            </label>
            <label className="form-field">
              <span>Vers Position</span>
              <input value={profile.versPosition} onChange={(event) => setProfile((prev) => ({ ...prev, versPosition: event.target.value }))} />
            </label>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <label className="form-field">
              <span>身高 (cm)</span>
              <input
                type="number"
                value={profile.height}
                onChange={(event) => setProfile((prev) => ({ ...prev, height: event.target.value ? Number(event.target.value) : undefined }))}
              />
            </label>
            <label className="form-field">
              <span>体重 (kg)</span>
              <input
                type="number"
                value={profile.weight}
                onChange={(event) => setProfile((prev) => ({ ...prev, weight: event.target.value ? Number(event.target.value) : undefined }))}
              />
            </label>
            <label className="form-field">
              <span>年龄</span>
              <input
                type="number"
                value={profile.age}
                onChange={(event) => setProfile((prev) => ({ ...prev, age: event.target.value ? Number(event.target.value) : undefined }))}
              />
            </label>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <label className="form-field">
              <span>Top Position</span>
              <input value={profile.topPosition} onChange={(event) => setProfile((prev) => ({ ...prev, topPosition: event.target.value }))} />
            </label>
            <label className="form-field">
              <span>Bottom Position</span>
              <input value={profile.bottomPosition} onChange={(event) => setProfile((prev) => ({ ...prev, bottomPosition: event.target.value }))} />
            </label>
          </div>
          <label className="form-field">
            <span>备注</span>
            <textarea
              rows={3}
              value={profile.notes}
              onChange={(event) => setProfile((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </label>
          <div className="flex items-center gap-3">
            <input
              id="hide-position"
              type="checkbox"
              checked={profile.hidePosition}
              onChange={(event) => setProfile((prev) => ({ ...prev, hidePosition: event.target.checked }))}
            />
            <label htmlFor="hide-position" className="text-sm text-slate-400">
              隐藏 Position 信息，仅管理员可见
            </label>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">常用链接</h3>
              <button type="button" className="text-sm text-indigo-300" onClick={addLink}>
                + 添加
              </button>
            </div>
            {links.map((link, index) => (
              <div key={`link-${index}`} className="grid md:grid-cols-2 gap-4">
                <input
                  placeholder="标题，例如 Instagram"
                  value={link.title}
                  onChange={(event) => handleLinkChange(index, 'title', event.target.value)}
                />
                <input
                  placeholder="https://"
                  value={link.url}
                  onChange={(event) => handleLinkChange(index, 'url', event.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400 mb-2">验证码</p>
            <TurnstileWidget onVerify={setTurnstileToken} />
          </div>
          {mutation.isSuccess && (
            <p className="text-emerald-300 text-sm">
              提交成功，@{mutation.data?.handle ?? form.handle} 正在等待审核。你也可以使用注册的账号登录 Admin 查看进度。
            </p>
          )}
          {mutation.isError && (
            <p className="text-rose-300 text-sm">
              {(mutation.error as Error).message}
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-indigo-500 text-white font-semibold disabled:opacity-50"
          >
            {mutation.isPending ? '提交中…' : '提交审核'}
          </button>
        </form>
      </div>
    </section>
  );
};
