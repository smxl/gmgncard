import { useState } from 'react';
import { Card } from './Card';
import { useAuth } from '../stores/auth';

export const AuthPanel = () => {
  const { token, user, login, register, logout, loading, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    handle: '',
    displayName: '',
    password: ''
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.handle || !form.password) {
      return;
    }
    if (mode === 'login') {
      await login({ handle: form.handle.trim(), password: form.password });
    } else {
      await register({
        handle: form.handle.trim(),
        displayName: form.displayName.trim() || form.handle.trim(),
        password: form.password
      });
    }
  };

  return (
    <Card
      title="Admin Access"
      description="登录后可执行链接管理操作"
      actions={
        token ? (
          <button className="ghost-btn" onClick={logout}>
            退出
          </button>
        ) : (
          <div className="tabs">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
              type="button"
            >
              登录
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
              type="button"
            >
              注册
            </button>
          </div>
        )
      }
    >
      {token && user ? (
        <div>
          <p className="muted">当前登录：@{user.handle}</p>
          <p className="muted">角色：{user.role ?? 'user'}</p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
         <label>
           Handle
           <input
             value={form.handle}
             onChange={(event) => setForm((prev) => ({ ...prev, handle: event.target.value }))}
             required
              minLength={3}
              maxLength={32}
            />
         </label>
          {mode === 'register' && (
            <label>
              显示名称
              <input
                value={form.displayName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, displayName: event.target.value }))
                }
              />
            </label>
          )}
          <label>
            密码
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '提交中…' : mode === 'login' ? '登录' : '注册并登录'}
          </button>
        </form>
      )}
    </Card>
  );
};
