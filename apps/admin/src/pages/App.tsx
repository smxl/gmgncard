import { AppLayout } from '../components/AppLayout';
import { HealthCard } from '../components/HealthCard';
import { UsersPanel } from '../components/UsersPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { AuthPanel } from '../components/AuthPanel';
import { LinksPanel } from '../components/LinksPanel';
import { ReportsPanel } from '../components/ReportsPanel';

const App = () => (
  <AppLayout>
    <div className="grid">
      <AuthPanel />
      <HealthCard />
      <SettingsPanel />
    </div>
    <UsersPanel />
    <LinksPanel />
    <ReportsPanel />
  </AppLayout>
);

export default App;
