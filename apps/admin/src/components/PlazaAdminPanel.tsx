import { useEffect, useState } from 'react';
import { Card } from './Card';
import { useAuth } from '../stores/auth';
import { adminApi } from '../lib/api';

interface PlazaUserMeta {
  id: number;
  handle: string;
  displayName: string;
  isFeatured?: boolean;
  adLabel?: string;
}

export const PlazaAdminPanel = () => {
  const { token, user } = useAuth();
  const [items, setItems] = useState<PlazaUserMeta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const response = await adminApi.listUsers({ limit: 100 });
        setItems(response.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (user?.role !== 'admin') {
    return null;
  }

  const handleUpdate = async (handle: string, payload: { isFeatured?: boolean; adLabel?: string | null }) => {
    await adminApi.updateFeatured(handle, payload);
    const response = await adminApi.listUsers({ limit: 100 });
    setItems(response.data);
  };

  return (
    <Card title="Plaza 设置" description="配置精选用户与广告标签">
      {loading && <p className="muted">加载中…</p>}
      <table className="plaza-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>精选</th>
            <th>广告标签</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>@{item.handle}</td>
              <td>
                <input
                  type="checkbox"
                  checked={Boolean(item.isFeatured)}
                  onChange={(event) => handleUpdate(item.handle, { isFeatured: event.target.checked })}
                />
              </td>
              <td>
                <input
                  className="plaza-input"
                  value={item.adLabel ?? ''}
                  onChange={(event) =>
                    handleUpdate(item.handle, { adLabel: event.target.value || null })
                  }
                  placeholder="例如 sponsor"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};
