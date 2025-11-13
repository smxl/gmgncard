import { useEffect, useMemo, useState } from 'react';
import type { UserDTO, VerificationStatus } from '@gmgncard/types';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { useUsers } from '../hooks/useUsers';

const statusTone: Record<VerificationStatus, 'success' | 'warning' | 'danger'> =
  {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger'
  };

const VerificationSummary = ({ user }: { user: UserDTO }) => {
  if (!user.profile) {
    return <p className="muted">No verification data yet.</p>;
  }

  const profile = user.profile;
  return (
    <div className="verification-summary">
      <StatusBadge
        tone={statusTone[profile.verificationStatus]}
        label={profile.verificationStatus}
      />
      <dl>
        {profile.wechatQrUrl && (
          <>
            <dt>WeChat QR</dt>
            <dd>{profile.wechatQrUrl}</dd>
          </>
        )}
        {profile.groupQrUrl && (
          <>
            <dt>Group QR</dt>
            <dd>{profile.groupQrUrl}</dd>
          </>
        )}
        {profile.notes && (
          <>
            <dt>Notes</dt>
            <dd>{profile.notes}</dd>
          </>
        )}
      </dl>
    </div>
  );
};

const LinksList = ({ user }: { user: UserDTO }) => {
  if (!user.links?.length) {
    return <p className="muted">No links published.</p>;
  }

  return (
    <ul className="links-list">
      {user.links.map((link) => (
        <li key={link.id}>
          <p>
            <strong>{link.title}</strong>
            <span>{link.url}</span>
          </p>
          <StatusBadge tone={link.isHidden ? 'warning' : 'success'} label={link.isHidden ? 'hidden' : 'live'} />
        </li>
      ))}
    </ul>
  );
};

export const UsersPanel = () => {
  const usersQuery = useUsers(20);
  const users = usersQuery.data?.data ?? [];
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedHandle && users.length > 0) {
      setSelectedHandle(users[0]?.handle ?? null);
    }
  }, [selectedHandle, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.handle === selectedHandle),
    [selectedHandle, users]
  );

  return (
    <Card
      title="Users"
      description="Verification status & top links"
      actions={
        <button className="ghost-btn" onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching}>
          Refresh
        </button>
      }
    >
      {usersQuery.isLoading && <p className="muted">Loading users…</p>}
      {usersQuery.isError && (
        <p className="error">
          {(usersQuery.error as Error).message ?? 'Unable to fetch users'}
        </p>
      )}
      {!usersQuery.isLoading && users.length === 0 && (
        <p className="muted">No users found.</p>
      )}
      {users.length > 0 && (
        <div className="users-panel">
          <aside className="users-list">
            {users.map((user) => (
              <button
                key={user.id}
                className={user.handle === selectedUser?.handle ? 'active' : ''}
                onClick={() => setSelectedHandle(user.handle)}
              >
                <div>
                  <strong>{user.displayName}</strong>
                  <span>@{user.handle}</span>
                </div>
                {user.profile && (
                  <StatusBadge
                    tone={statusTone[user.profile.verificationStatus]}
                    label={user.profile.verificationStatus}
                  />
                )}
              </button>
            ))}
          </aside>
          <section className="user-detail">
            {selectedUser ? (
              <>
                <header>
                  <div>
                    <h3>{selectedUser.displayName}</h3>
                    <p className="muted">@{selectedUser.handle}</p>
                  </div>
                  {selectedUser.email && <span>{selectedUser.email}</span>}
                </header>
                <VerificationSummary user={selectedUser} />
                <h4>Links</h4>
                <LinksList user={selectedUser} />
              </>
            ) : (
              <p className="muted">Select a user to inspect details.</p>
            )}
          </section>
        </div>
      )}
    </Card>
  );
};
