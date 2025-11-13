import { useEffect, useState, type FormEvent } from 'react';
import { DEFAULT_SETTINGS } from '@gmgncard/config';
import type { SettingsDTO } from '@gmgncard/types';
import { Card } from './Card';
import { useSettings } from '../hooks/useSettings';

type FormState = SettingsDTO;

export const SettingsPanel = () => {
  const { data, isLoading, isError, error, updateSettings, updating } =
    useSettings();
  const [formState, setFormState] = useState<FormState>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (data?.data) {
      setFormState(data.data);
    }
  }, [data]);

  const handleChange = <
    Key extends keyof FormState,
    Value extends FormState[Key]
  >(
    key: Key,
    value: Value
  ) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setStatus('idle');
      await updateSettings(formState);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Card
      title="Settings"
      description="Theme, verification & gating controls"
      actions={
        <button className="ghost-btn" onClick={() => window.location.reload()}>
          Hard refresh
        </button>
      }
    >
      {isLoading && <p className="muted">Loading settings…</p>}
      {isError && (
        <p className="error">
          {(error as Error).message ?? 'Unable to load settings'}
        </p>
      )}

      {!isLoading && !isError && (
        <form className="settings-form" onSubmit={handleSubmit}>
          <label>
            Theme
            <input
              type="text"
              value={formState.theme}
              onChange={(event) => handleChange('theme', event.target.value)}
              required
            />
          </label>

          <label>
            Accent color
            <input
              type="color"
              value={formState.accentColor}
              onChange={(event) => handleChange('accentColor', event.target.value)}
            />
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={formState.allowPublicProfiles}
              onChange={(event) =>
                handleChange('allowPublicProfiles', event.target.checked)
              }
            />
            Allow public profiles
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={formState.verificationRequired}
              onChange={(event) =>
                handleChange('verificationRequired', event.target.checked)
              }
            />
            Require verification for new handles
          </label>

          <div className="form-actions">
            <button type="submit" disabled={updating}>
              {updating ? 'Saving…' : 'Save changes'}
            </button>
            {status === 'success' && (
              <span className="success">Saved.</span>
            )}
            {status === 'error' && (
              <span className="error">Unable to save.</span>
            )}
          </div>
        </form>
      )}
    </Card>
  );
};
