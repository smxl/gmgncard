import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type {
  ApiResponse,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UserDTO
} from '@gmgncard/types';
import { adminApi, registerAuthTokenGetter } from '../lib/api';

interface AuthContextValue {
  token: string | null;
  user: UserDTO | null;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  bootstrapping: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'gmgncard:auth_token';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    registerAuthTokenGetter(() => token);
    if (!token) {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setBootstrapping(false);
      return;
    }
    localStorage.setItem(STORAGE_KEY, token);
    setBootstrapping(true);
    (async () => {
      try {
        const profile = await adminApi.profile();
        setUser(profile.data);
      } catch (err) {
        console.error(err);
        setToken(null);
        setUser(null);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [token]);

  const performAuth = async <T extends LoginPayload | RegisterPayload>(
    action: (payload: T) => Promise<ApiResponse<AuthResponse>>,
    payload: T
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await action(payload);
      setToken(response.data.token);
      setUser(response.data.user);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      error,
      bootstrapping,
      login: (payload: LoginPayload) => performAuth(adminApi.login, payload),
      register: (payload: RegisterPayload) => performAuth(adminApi.register, payload),
      logout: () => {
        setToken(null);
        setUser(null);
      }
    }),
    [token, user, loading, error, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
