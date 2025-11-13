import { AppLayout } from '../components/AppLayout';
import { HealthCard } from '../components/HealthCard';
import { UsersPanel } from '../components/UsersPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { AuthPanel } from '../components/AuthPanel';
import { LinksPanel } from '../components/LinksPanel';
import { ReportsPanel } from '../components/ReportsPanel';
import { SelfLinksPanel } from '../components/SelfLinksPanel';
import { useAuth } from '../stores/auth';

const App = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <AppLayout>
      <div className="grid">
        <AuthPanel />
        <HealthCard />
        {isAdmin && <SettingsPanel />}
      </div>
      {isAdmin ? (
        <>
          <UsersPanel />
          <LinksPanel />
          <ReportsPanel />
        </>
      ) : (
        <SelfLinksPanel />
      )}
    </AppLayout>
  );
};

export default App;
