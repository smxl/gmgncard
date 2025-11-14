import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { UpdateUserProfilePayload, VerificationRequestPayload } from '@gmgncard/types';
import { Card } from './Card';
import { useAuth } from '../stores/auth';
import { useUserProfile } from '../hooks/useUserProfile';
import { adminApi } from '../lib/api';

const POSITION_CHOICES = ['top', 'vers', 'bottom', 'side', 'hidden'] as const;
type PositionChoice = (typeof POSITION_CHOICES)[number] | '';

const emptyState: UpdateUserProfilePayload = {
  pSize: '',
  fSize: '',
  topPosition: '',
  bottomPosition: '',
  versPosition: '',
  sidePreference: undefined,
  hidePosition: false,
  notes: '',
  age: undefined,
  height: undefined,
  weight: undefined,
  displayName: '',
  password: ''
};

export const SelfProfilePanel = () => {
  const { user, token, bootstrapping } = useAuth();
  const handle = user?.handle;
  const queryClient = useQueryClient();
  const profileQuery = useUserProfile(handle);
  const [form, setForm] = useState<UpdateUserProfilePayload>(emptyState);
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [positionChoice, setPositionChoice] = useState<PositionChoice>('none');

  useEffect(() => {
    if (profileQuery.data?.data?.profile) {
      const profile = profileQuery.data.data.profile;
      const nextForm: UpdateUserProfilePayload = {
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
        features: profile.features ?? undefined,
        displayName: user?.displayName ?? '',
        password: ''
      };
      setForm(nextForm);
      const detectPosition = (): PositionChoice => {
        if (profile.topPosition) return 'top';
        if (profile.versPosition) return 'vers';
        if (profile.bottomPosition) return 'bottom';
        if (profile.sidePreference) return 'side';
        if (profile.hidePosition) return 'hidden';
        return 'none';
      };
      setPositionChoice(detectPosition());
    }
  }, [profileQuery.data, user]);

  useEffect(() => {
    if (user?.displayName) {
      setForm((prev) => ({ ...prev, displayName: user.displayName }));
    }
  }, [user]);

  const applyPositionChoice = (choice: PositionChoice) => {
    setPositionChoice(choice);
    setForm((prev) => ({
      ...prev,
      topPosition: choice === 'top' ? 'Top' : undefined,
      versPosition: choice === 'vers' ? 'Vers' : undefined,
      bottomPosition: choice === 'bottom' ? 'Bottom' : undefined,
      sidePreference: choice === 'side' ? 'Side' : undefined,
      hidePosition: choice === 'hidden'
    }));
  };

  const buildUpdatePayload = (): UpdateUserProfilePayload => {
    const { password, displayName, ...rest } = form;
    const payload: UpdateUserProfilePayload = { ...rest };
    if (displayName?.trim()) {
      payload.displayName = displayName.trim();
    }
    if (password && password.length >= 6) {
      payload.password = password;
    }
    return payload;
  };

  const buildVerificationPayload = (): VerificationRequestPayload => {
    const { password: _password, displayName: _displayName, ...rest } = form;
    return rest as VerificationRequestPayload;
  };

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserProfilePayload) => adminApi.updateProfile(handle!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-profile', handle] });
      setSuccess('资料已保存');
      setFormError(null);
      setForm((prev) => ({ ...prev, password: '' }));
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
        updateMutation.mutate(buildUpdatePayload());
      }}>
        <label>
          显示名称
          <input
            value={form.displayName ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
          />
        </label>
        <label>
          Cock Size
          <input
            value={form.pSize ?? ''}
            placeholder="cm"
            onChange={(e) => setForm((prev) => ({ ...prev, pSize: e.target.value }))}
          />
        </label>
        <label>
          Foot Size
          <input
            value={form.fSize ?? ''}
            placeholder="EU"
            onChange={(e) => setForm((prev) => ({ ...prev, fSize: e.target.value }))}
          />
        </label>
        <label>
          新密码
          <input
            type="password"
            value={form.password ?? ''}
            placeholder="至少 6 位"
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
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
          Position
          <select value={positionChoice} onChange={(e) => applyPositionChoice(e.target.value as PositionChoice)}>
            <option value="">未设置</option>
            {POSITION_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
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
            onClick={() => requestVerificationMutation.mutate(buildVerificationPayload())}
            disabled={!token || requestVerificationMutation.isPending}
          >
            {requestVerificationMutation.isPending ? '申请中…' : '申请验证'}
          </button>
        </div>
      </form>
    </Card>
  );
};
