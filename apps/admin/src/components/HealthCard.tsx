import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { useHealth } from '../hooks/useHealth';
import type { ApiResult } from '../lib/api';
import type { HealthPayload } from '../lib/api';

const formatUptime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const BindingStatus = ({
  bindings
}: {
  bindings: HealthPayload['bindings'];
}) => (
  <dl className="meta-grid">
    {Object.entries(bindings).map(([name, enabled]) => (
      <div key={name}>
        <dt>{name.toUpperCase()}</dt>
        <dd>
          <StatusBadge tone={enabled ? 'success' : 'danger'} label={enabled ? 'online' : 'missing'} />
        </dd>
      </div>
    ))}
  </dl>
);

const FeatureList = ({
  features
}: {
  features: HealthPayload['featureFlags'];
}) => (
  <ul className="feature-list">
    {Object.entries(features).map(([name, enabled]) => (
      <li key={name}>
        <StatusBadge tone={enabled ? 'success' : 'warning'} label={enabled ? 'enabled' : 'pending'} /> {name}
      </li>
    ))}
  </ul>
);

const HealthContent = ({ payload }: { payload: ApiResult<HealthPayload> }) => {
  const data = payload.data;
  return (
    <>
      <div className="health-summary">
        <StatusBadge tone={data.ok ? 'success' : 'danger'} label={data.ok ? 'healthy' : 'degraded'} />
        <p>{data.service}</p>
        <span className="muted">uptime {formatUptime(data.uptime)}</span>
      </div>
      <BindingStatus bindings={data.bindings} />
      <h3>Feature flags</h3>
      <FeatureList features={data.featureFlags} />
    </>
  );
};

export const HealthCard = () => {
  const healthQuery = useHealth();

  return (
    <Card
      title="Worker health"
      description="Cloudflare Worker + resource bindings"
      actions={
        <button className="ghost-btn" onClick={() => healthQuery.refetch()} disabled={healthQuery.isFetching}>
          Refresh
        </button>
      }
    >
      {healthQuery.isLoading && <p className="muted">Loading health…</p>}
      {healthQuery.isError && (
        <p className="error">
          {(healthQuery.error as Error).message ?? 'Unable to fetch health'}
        </p>
      )}
      {healthQuery.data && <HealthContent payload={healthQuery.data} />}
    </Card>
  );
};
