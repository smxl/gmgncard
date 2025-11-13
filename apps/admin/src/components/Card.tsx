import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export const Card = ({ title, description, actions, children }: CardProps) => (
  <section className="card">
    <header className="card-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="card-actions">{actions}</div>}
    </header>
    <div className="card-body">{children}</div>
  </section>
);
