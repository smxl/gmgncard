type StatusTone = 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
}

export const StatusBadge = ({ tone, label }: StatusBadgeProps) => (
  <span className={`status-badge status-${tone}`}>{label}</span>
);
