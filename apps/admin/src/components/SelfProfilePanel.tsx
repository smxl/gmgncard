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
  versPosition: '',
  sidePreference: '',
  hidePosition: false,
  notes: '',
  age: undefined,
  height: undefined,
  weight: undefined
};

export const SelfProfilePanel = () => {
  const { user, token, bootstrapping } = useAuth();
  const handle = user?.handle;
  const queryClient = useQueryClient();
  const profileQuery = useUserProfile(handle);
  const [form, setForm] = useState<VerificationRequestPayload>(emptyState);
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (profileQuery.data?.data?.profile) {
      const profile = profileQuery.data.data.profile;
      setForm({
        pSize: profile.pSize ?? '',
        fSize: profile.fSize ?? '',
        topPosition: profile.topPosition ?? '',
        bottomPosition: profile.bottomPosition ?? '',
        versPosition: profile.versPosition ?? '',
        sidePreference: profile.sidePreference ?? '',
        hidePosition: profile.hidePosition ?? false,
        notes: profile.notes ?? '',
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        features: profile.features ?? undefined
      });
    }
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: VerificationRequestPayload) => adminApi.updateProfile(handle!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-profile', handle] });
      setSuccess('资料已保存');
      setFormError(null);
    }
  });

  const requestVerificationMutation = useMutation({
    mutationFn: (payload: VerificationRequestPayload) => adminApi.submitProfile(handle!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-profile', handle] });
      setSuccess('已提交审核，管理员通过后会展示验证标识。');
      setFormError(null);
    }
  });

  if (bootstrapping) {
    return (
      <Card title="资料管理" description="提交资料由管理员审核后展示">
        <p className="muted">资料加载中…</p>
      </Card>
    );
  }

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
        if (form.pSize && Number.isNaN(Number(form.pSize))) {
          setFormError('Penis 长度需为数字');
          return;
        }
        if (form.fSize && Number.isNaN(Number(form.fSize))) {
          setFormError('Foot 尺码需为数字');
          return;
        }
        setFormError(null);
        setSuccess(null);
        updateMutation.mutate(form);
      }}>
        <label>
          Top Size
          <input
            value={form.pSize ?? ''}
            placeholder="cm"
            onChange={(e) => setForm((prev) => ({ ...prev, pSize: e.target.value }))}
          />
        </label>
        <label>
          Bottom Size
          <input
            value={form.fSize ?? ''}
            placeholder="EU"
            onChange={(e) => setForm((prev) => ({ ...prev, fSize: e.target.value }))}
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label>
            年龄
            <input
              type="number"
              value={form.age ?? ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, age: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
          </label>
          <label>
            身高 (cm)
            <input
              type="number"
              value={form.height ?? ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, height: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
          </label>
          <label>
            体重 (kg)
            <input
              type="number"
              value={form.weight ?? ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, weight: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
          </label>
        </div>
        <label>
          Top Position
          <input value={form.topPosition ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, topPosition: e.target.value }))} />
        </label>
        <label>
          Bottom Position
          <input value={form.bottomPosition ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, bottomPosition: e.target.value }))} />
        </label>
        <label>
          Vers Position
          <input value={form.versPosition ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, versPosition: e.target.value }))} />
        </label>
        <label>
          Side Preference
          <input value={form.sidePreference ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, sidePreference: e.target.value }))} />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.hidePosition ?? false}
            onChange={(e) => setForm((prev) => ({ ...prev, hidePosition: e.target.checked }))}
          />
          不公开 Position
        </label>
        <label>
          备注 / Features
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </label>
        {formError && <p className="error">{formError}</p>}
        {success && <p className="success">{success}</p>}
        {updateMutation.error && <p className="error">{(updateMutation.error as Error).message}</p>}
        {requestVerificationMutation.error && (
          <p className="error">{(requestVerificationMutation.error as Error).message}</p>
        )}
        <div className="form-actions">
          <button type="submit" disabled={!token || updateMutation.isPending}>
            {updateMutation.isPending ? '保存中…' : '保存资料'}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => requestVerificationMutation.mutate(form)}
            disabled={!token || requestVerificationMutation.isPending}
          >
            {requestVerificationMutation.isPending ? '申请中…' : '申请验证'}
          </button>
        </div>
      </form>
    </Card>
  );
};
