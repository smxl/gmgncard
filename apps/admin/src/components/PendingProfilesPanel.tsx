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
  const [rejectReason, setRejectReason] = useState('');
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

  const handleReject = async (user: UserDTO, notes?: string) => {
    const payload: UpdateUserProfilePayload = {
      verificationStatus: 'rejected',
      notes: notes || '资料不符合规范'
    };
    await mutation.mutateAsync({ handle: user.handle, payload });
    setRejectReason('');
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
            <ProfileReviewForm
              user={selected}
              onApprove={handleApprove}
              onReject={handleReject}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              loading={mutation.isPending}
            />
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
  onReject,
  rejectReason,
  setRejectReason,
  loading
}: {
  user: UserDTO;
  onApprove: (user: UserDTO, payload: Partial<UpdateUserProfilePayload>) => Promise<void>;
  onReject: (user: UserDTO, notes?: string) => Promise<void>;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  loading: boolean;
}) => {
  const profile = user.profile;
  const [qrAccess, setQrAccess] = useState(Boolean(profile?.qrAccess));
  const [rejectReason, setRejectReason] = useState('');

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
          <dt>Foot Size</dt>
          <dd>{profile.fSize || '-'}</dd>
          <dt>年龄</dt>
          <dd>{profile.age ?? '-'}</dd>
          <dt>身高</dt>
          <dd>{profile.height ?? '-'} cm</dd>
          <dt>体重</dt>
          <dd>{profile.weight ?? '-'} kg</dd>
          <dt>Top Position</dt>
          <dd>{profile.topPosition ?? '-'}</dd>
          <dt>Bottom Position</dt>
          <dd>{profile.bottomPosition ?? '-'}</dd>
          <dt>Vers</dt>
          <dd>{profile.versPosition ?? '-'}</dd>
          <dt>Side</dt>
          <dd>{profile.sidePreference ?? '-'}</dd>
          <dt>隐藏 Position</dt>
          <dd>{profile.hidePosition ? 'Yes' : 'No'}</dd>
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
          {loading ? '处理中…' : '通过'}
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => onReject(user, rejectReason)}
          disabled={loading}
        >
          拒绝
        </button>
      </div>
      <textarea
        className="plaza-input"
        placeholder="拒绝原因"
        value={rejectReason}
        onChange={(event) => setRejectReason(event.target.value)}
        rows={3}
      />
    </div>
  );
};
