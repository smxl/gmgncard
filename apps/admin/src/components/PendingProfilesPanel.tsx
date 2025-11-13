import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { UpdateUserProfilePayload, UserDTO } from '@gmgncard/types';
import { Card } from './Card';
import { useAuth } from '../stores/auth';
import { adminApi } from '../lib/api';

export const PendingProfilesPanel = () => {
  const { token } = useAuth();
  const [selected, setSelected] = useState<UserDTO | null>(null);
  const [pendingUsers, setPendingUsers] = useState<UserDTO[]>([]);
  const queryClient = useQueryClient();

  const loadPending = async () => {
    const response = await adminApi.listUsers({ status: 'pending', limit: 50 });
    setPendingUsers(response.data);
    if (!selected && response.data.length) {
      setSelected(response.data[0]);
    }
  };

  useEffect(() => {
    loadPending().catch(console.error);
  }, []);

  const mutation = useMutation({
    mutationFn: ({ handle, payload }: { handle: string; payload: UpdateUserProfilePayload }) =>
      adminApi.updateProfile(handle, payload),
    onSuccess: async () => {
      await loadPending();
      await queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
    }
  });

  const handleApprove = async (user: UserDTO, overrides: Partial<UpdateUserProfilePayload>) => {
    const payload: UpdateUserProfilePayload = {
      verificationStatus: 'approved',
      qrAccess: overrides.qrAccess ?? user.profile?.qrAccess ?? false,
      ...overrides
    };
    await mutation.mutateAsync({ handle: user.handle, payload });
  };

  if (!token) {
    return (
      <Card title="资料审核" description="登录管理员账号后可审核用户资料">
        <p className="error">请先登录</p>
      </Card>
    );
  }

  return (
    <Card title="资料审核" description="确认 pSize/fSize/二维码 后通过">
      {pendingUsers.length === 0 && <p className="muted">暂无待审核资料。</p>}
      <div className="users-panel">
        <aside className="users-list">
          {pendingUsers.map((user) => (
            <button
              key={user.id}
              className={selected?.handle === user.handle ? 'active' : ''}
              onClick={() => setSelected(user)}
            >
              <div>
                <strong>{user.displayName}</strong>
                <span>@{user.handle}</span>
              </div>
            </button>
          ))}
        </aside>
        <section className="user-detail">
          {selected ? (
            <ProfileReviewForm user={selected} onApprove={handleApprove} loading={mutation.isPending} />
          ) : (
            <p className="muted">选择左侧用户开始审核。</p>
          )}
        </section>
      </div>
    </Card>
  );
};

const ProfileReviewForm = ({
  user,
  onApprove,
  loading
}: {
  user: UserDTO;
  onApprove: (user: UserDTO, payload: Partial<UpdateUserProfilePayload>) => Promise<void>;
  loading: boolean;
}) => {
  const profile = user.profile;
  const [qrAccess, setQrAccess] = useState(Boolean(profile?.qrAccess));

  return (
    <div>
      <header className="mb-4">
        <h3>{user.displayName}</h3>
        <p className="muted">@{user.handle}</p>
      </header>
      {profile ? (
        <dl className="verification-summary">
          <dt>Top Size</dt>
          <dd>{profile.pSize || '-'}</dd>
          <dt>Bottom Size</dt>
          <dd>{profile.fSize || '-'}</dd>
          <dt>年龄</dt>
          <dd>{profile.age ?? '-'}</dd>
          <dt>Top Position</dt>
          <dd>{profile.topPosition ?? '-'}</dd>
          <dt>Bottom Position</dt>
          <dd>{profile.bottomPosition ?? '-'}</dd>
          <dt>Side</dt>
          <dd>{profile.sidePreference ?? '-'}</dd>
          <dt>备注</dt>
          <dd>{profile.notes ?? '-'}</dd>
        </dl>
      ) : (
        <p className="muted">尚未提交资料</p>
      )}
      <label className="checkbox">
        <input type="checkbox" checked={qrAccess} onChange={(event) => setQrAccess(event.target.checked)} />
        允许展示二维码
      </label>
      <div className="form-actions">
        <button onClick={() => onApprove(user, { qrAccess })} disabled={loading}>
          {loading ? '处理中…' : '通过' }
        </button>
      </div>
    </div>
  );
};
