import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { VerificationRequestPayload } from '@gmgncard/types';
import { Card } from './Card';
import { useAuth } from '../stores/auth';
import { useUserProfile } from '../hooks/useUserProfile';
import { adminApi } from '../lib/api';

const emptyState: VerificationRequestPayload = {
  pSize: '',
  fSize: '',
  topPosition: '',
  bottomPosition: '',
  sidePreference: '',
  notes: '',
  age: undefined
};

export const SelfProfilePanel = () => {
  const { user, token } = useAuth();
  const handle = user?.handle;
  const queryClient = useQueryClient();
  const profileQuery = useUserProfile(handle);
  const [form, setForm] = useState<VerificationRequestPayload>(emptyState);

  useEffect(() => {
    if (profileQuery.data?.data?.profile) {
      const profile = profileQuery.data.data.profile;
      setForm({
        pSize: profile.pSize ?? '',
        fSize: profile.fSize ?? '',
        topPosition: profile.topPosition ?? '',
        bottomPosition: profile.bottomPosition ?? '',
        sidePreference: profile.sidePreference ?? '',
        notes: profile.notes ?? '',
        age: profile.age,
        features: profile.features ?? undefined
      });
    }
  }, [profileQuery.data]);

  const mutation = useMutation({
    mutationFn: (payload: VerificationRequestPayload) => adminApi.submitProfile(handle!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-profile', handle] });
    }
  });

  if (!handle) {
    return (
      <Card title="资料管理" description="登录后可提交资料信息">
        <p className="muted">请先登录。</p>
      </Card>
    );
  }

  const profile = profileQuery.data?.data?.profile;

  return (
    <Card title="资料管理" description="提交资料由管理员审核后展示">
      {!token && <p className="error">登录后才能提交资料。</p>}
      {profile && (
        <div className="muted mb-4 text-sm">
          当前状态：{profile.verificationStatus}
          {profile.qrAccess ? ' · QR 已解锁' : ''}
        </div>
      )}
      <form className="settings-form" onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(form);
      }}>
        <label>
          Top Size
          <input value={form.pSize ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, pSize: e.target.value }))} />
        </label>
        <label>
          Bottom Size
          <input value={form.fSize ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, fSize: e.target.value }))} />
        </label>
        <label>
          年龄
          <input
            type="number"
            value={form.age ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value ? Number(e.target.value) : undefined }))}
          />
        </label>
        <label>
          Top Position
          <input value={form.topPosition ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, topPosition: e.target.value }))} />
        </label>
        <label>
          Bottom Position
          <input value={form.bottomPosition ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, bottomPosition: e.target.value }))} />
        </label>
        <label>
          Side Preference
          <input value={form.sidePreference ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, sidePreference: e.target.value }))} />
        </label>
        <label>
          备注 / Features
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </label>
        {mutation.error && <p className="error">{(mutation.error as Error).message}</p>}
        <button type="submit" disabled={!token || mutation.isPending}>
          {mutation.isPending ? '提交中…' : '提交审核'}
        </button>
      </form>
    </Card>
  );
};
