import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { LinkDTO, UpsertLinkPayload } from '@gmgncard/types';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '../stores/auth';
import { useLinks } from '../hooks/useLinks';
import { adminApi } from '../lib/api';

export const SelfLinksPanel = () => {
  const { user, token, bootstrapping } = useAuth();
  const handle = user?.handle ?? '';
  const linksQuery = useLinks(handle, Boolean(handle));
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpsertLinkPayload>({
    title: '',
    url: '',
    order: 0,
    isHidden: false
  });
  const [editingLink, setEditingLink] = useState<(UpsertLinkPayload & { id: number }) | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['links', handle] });
  };

  const linkToPayload = (link: LinkDTO): UpsertLinkPayload => ({
    title: link.title,
    url: link.url,
    order: link.order,
    isHidden: link.isHidden,
    typeId: link.type?.id,
    metadata: link.metadata
  });

  const createMutation = useMutation({
    mutationFn: (payload: UpsertLinkPayload) => adminApi.createLink(handle, payload),
    onSuccess: async () => {
      setForm({ title: '', url: '', order: 0, isHidden: false });
      setFeedback('已创建链接');
      await invalidate();
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ link, nextHidden }: { link: LinkDTO; nextHidden: boolean }) =>
      adminApi.updateLink(handle, link.id, { ...linkToPayload(link), isHidden: nextHidden }),
    onSuccess: async () => {
      setFeedback('已更新显示状态');
      await invalidate();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (linkId: number) => adminApi.deleteLink(handle, linkId),
    onSuccess: async () => {
      setFeedback('已删除链接');
      await invalidate();
    }
  });

  if (bootstrapping) {
    return (
      <Card title="我的链接" description="登录后管理你的个人主页">
        <p className="muted">加载中…</p>
      </Card>
    );
  }

  if (!handle) {
    return (
      <Card title="我的链接" description="登录后管理你的个人主页">
        <p className="muted">请先登录。</p>
      </Card>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createMutation.mutateAsync(form);
  };

  const links = linksQuery.data?.data ?? [];

  const handleStartEdit = (link: LinkDTO) => {
    setEditingLink({ id: link.id, ...linkToPayload(link) });
  };

  const handleEditChange = (name: keyof UpsertLinkPayload, value: string | number | boolean) => {
    setEditingLink((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingLink) return;
    await updateMutation.mutateAsync({ linkId: editingLink.id, payload: editingLink });
  };

  const handleReorder = async (link: LinkDTO, delta: number) => {
    const nextOrder = (link.order ?? 0) + delta;
    await updateMutation.mutateAsync({
      linkId: link.id,
      payload: { ...linkToPayload(link), order: nextOrder }
    });
  };

  return (
    <Card title="我的链接" description="直接管理 @handle 页面上的按钮">
      {!token && <p className="error">请先登录。</p>}
      {linksQuery.isLoading && <p className="muted">加载中…</p>}
      {linksQuery.isError && <p className="error">无法加载链接</p>}

      {links.length > 0 ? (
        <ul className="links-table">
          {links.map((link) => (
            <li key={link.id}>
              <div>
                <strong>{link.title}</strong>
                <span>{link.url}</span>
              </div>
              <div className="link-actions">
                <StatusBadge tone={link.isHidden ? 'warning' : 'success'} label={link.isHidden ? '隐藏' : '显示'} />
                <div className="reorder-controls">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => handleReorder(link, -1)}
                    disabled={!token || updateMutation.isPending}
                    title="向前"
                  >
                    ↑
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => handleReorder(link, 1)}
                    disabled={!token || updateMutation.isPending}
                    title="向后"
                  >
                    ↓
                  </button>
                </div>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => toggleMutation.mutate({ link, nextHidden: !link.isHidden })}
                  disabled={!token || toggleMutation.isPending}
                >
                  {link.isHidden ? '设为显示' : '设为隐藏'}
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => handleStartEdit(link)}
                  disabled={!token}
                >
                  编辑
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => deleteMutation.mutateAsync(link.id)}
                  disabled={!token || deleteMutation.isPending}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">暂无链接，立即添加一个吧。</p>
      )}

      {editingLink && (
        <form className="link-form edit-form" onSubmit={handleEditSubmit}>
          <h4>编辑链接</h4>
          <label>
            标题
            <input
              value={editingLink.title}
              onChange={(event) => handleEditChange('title', event.target.value)}
              required
            />
          </label>
          <label>
            URL
            <input
              value={editingLink.url}
              onChange={(event) => handleEditChange('url', event.target.value)}
              required
            />
          </label>
          <label>
            排序
            <input
              type="number"
              value={editingLink.order ?? 0}
              onChange={(event) =>
                handleEditChange('order', Number.parseInt(event.target.value, 10) || 0)
              }
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={editingLink.isHidden ?? false}
              onChange={(event) => handleEditChange('isHidden', event.target.checked)}
            />
            隐藏
          </label>
          <div className="form-actions">
            <button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '保存中…' : '保存修改'}
            </button>
            <button type="button" className="ghost-btn" onClick={() => setEditingLink(null)}>
              取消
            </button>
          </div>
        </form>
      )}

      <form className="link-form" onSubmit={handleSubmit}>
        <h4>新建链接</h4>
        <label>
          标题
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </label>
        <label>
          URL
          <input
            value={form.url}
            onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
            required
          />
        </label>
        <label>
          排序
          <input
            type="number"
            value={form.order ?? 0}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, order: Number.parseInt(event.target.value, 10) || 0 }))
            }
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.isHidden ?? false}
            onChange={(event) => setForm((prev) => ({ ...prev, isHidden: event.target.checked }))}
          />
          隐藏
        </label>
        <button type="submit" disabled={!token || createMutation.isPending}>
          {createMutation.isPending ? '添加中…' : '添加链接'}
        </button>
        {feedback && <p className="success">{feedback}</p>}
      </form>
    </Card>
  );
};
  const updateMutation = useMutation({
    mutationFn: ({ linkId, payload }: { linkId: number; payload: UpsertLinkPayload }) =>
      adminApi.updateLink(handle, linkId, payload),
    onSuccess: async () => {
      setFeedback('已更新链接');
      setEditingLink(null);
      await invalidate();
    }
  });
