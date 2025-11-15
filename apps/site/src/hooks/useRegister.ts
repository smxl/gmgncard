import { useMutation } from '@tanstack/react-query';
import { buildApiUrl } from '../lib/api';

interface RegisterFormPayload {
  brand: string;
  email: string;
  handle: string;
}

export const useRegister = () =>
  useMutation({
    mutationFn: async (payload: RegisterFormPayload) => {
      const response = await fetch(buildApiUrl('/api/auth/register'), {
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
        let message = '注册失败，请稍后再试';
        try {
          const errorJson = await response.json();
          message = (errorJson?.error as string) ?? message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      return response.json();
    }
  });
