import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { LinkDTO, UpsertLinkPayload } from '@gmgncard/types';
import { Card } from './Card';
import { useLinks } from '../hooks/useLinks';
import { adminApi } from '../lib/api';
import { useAuth } from '../stores/auth';
import { StatusBadge } from './StatusBadge';

export const LinksPanel = () => {
  const [handle, setHandle] = useState('alice');
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const linksQuery = useLinks(handle, Boolean(handle));
  const [form, setForm] = useState<UpsertLinkPayload>({
    title: '',
    url: '',
    order: 0,
    isHidden: false
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['links', handle] });
  };

  const linkToPayload = useMemo(
    () =>
      (link: LinkDTO): UpsertLinkPayload => ({
        title: link.title,
        url: link.url,
        order: link.order,
        isHidden: link.isHidden,
        typeId: link.type?.id,
        metadata: link.metadata
      }),
    []
  );

  const createMutation = useMutation({
    mutationFn: (payload: UpsertLinkPayload) => adminApi.createLink(handle, payload),
    onSuccess: async () => {
      setForm({ title: '', url: '', order: 0, isHidden: false });
      await invalidate();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (linkId: number) => adminApi.deleteLink(handle, linkId),
    onSuccess: invalidate
  });

  const toggleMutation = useMutation({
    mutationFn: ({ link, nextHidden }: { link: LinkDTO; nextHidden: boolean }) =>
      adminApi.updateLink(handle, link.id, {
        ...linkToPayload(link),
        isHidden: nextHidden
      }),
    onSuccess: invalidate
  });

  const reorderMutation = useMutation({
    mutationFn: ({ link, direction }: { link: LinkDTO; direction: number }) =>
      adminApi.updateLink(handle, link.id, {
        ...linkToPayload(link),
        order: (link.order ?? 0) + direction
      }),
    onSuccess: invalidate
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createMutation.mutateAsync(form);
  };

  const links = linksQuery.data?.data ?? [];

  return (
    <Card
      title="Links"
      description="管理单个用户的链接"
      actions={
        <input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="输入用户 handle"
        />
      }
    >
      {!token && <p className="error">请先登录以新增/删除链接</p>}
      {linksQuery.isLoading && <p className="muted">加载中…</p>}
      {linksQuery.isError && <p className="error">无法加载链接</p>}

      {links.length > 0 ? (
        <ul className="links-table">
          {links.map((link) => (
            <li key={link.id}>
              <div>
                <strong>{link.title}</strong>
                <span>{link.url}</span>
                <small className="text-xs text-slate-400">点击 {link.clicks}</small>
              </div>
              <div className="link-actions">
                <StatusBadge tone={link.isHidden ? 'warning' : 'success'} label={link.isHidden ? '隐藏' : '显示'} />
                <div className="order-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => reorderMutation.mutate({ link, direction: -1 })}
                    disabled={!token || reorderMutation.isPending}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => reorderMutation.mutate({ link, direction: 1 })}
                    disabled={!token || reorderMutation.isPending}
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
                  onClick={() => deleteMutation.mutateAsync(link.id)}
                  disabled={!token || deleteMutation.isPending}
                  type="button"
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">暂无链接</p>
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
      </form>
    </Card>
  );
};
