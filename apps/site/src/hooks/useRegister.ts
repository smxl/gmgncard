import { useMutation } from '@tanstack/react-query';

const API_BASE = (import.meta.env.VITE_WORKER_BASE ?? '').replace(/\/$/, '') || window.location.origin;

interface RegisterFormPayload {
  brand: string;
  email: string;
  handle: string;
}

export const useRegister = () =>
  useMutation({
    mutationFn: async (payload: RegisterFormPayload) => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: payload.handle,
          displayName: payload.brand,
          email: payload.email,
          password: Math.random().toString(36).slice(2, 10)
        })
      });

      if (!response.ok) {
        throw new Error('注册失败，请稍后再试');
      }

      return response.json();
    }
  });
