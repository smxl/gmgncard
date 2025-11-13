import { useQuery } from '@tanstack/react-query';

const API_BASE = (import.meta.env.VITE_WORKER_BASE ?? '').replace(/\/$/, '') || window.location.origin;

export interface PlazaUser {
  id: number;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isFeatured?: boolean;
  adLabel?: string;
}

export const usePlaza = (limit = 12) =>
  useQuery({
    queryKey: ['plaza', limit],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE}/api/plaza?limit=${limit}`);
      if (!resp.ok) {
        throw new Error('加载广场失败');
      }
      return resp.json();
    }
  });
