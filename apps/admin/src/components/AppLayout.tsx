import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => (
  <div className="app-shell">
    <header className="app-header">
      <div>
        <p className="app-eyebrow">GMGN Card</p>
        <h1>Operations Console</h1>
      </div>
      <span className="badge">beta</span>
    </header>
    <main className="app-main">{children}</main>
  </div>
);
