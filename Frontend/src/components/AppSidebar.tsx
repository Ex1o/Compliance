import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, CheckSquare, AlertTriangle, Shield, Settings, LogOut
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDeadlines';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'My Calendar', icon: Calendar },
  { to: '/deadlines', label: 'Deadlines', icon: CheckSquare },
  { to: '/penalties', label: 'Penalty Tracker', icon: AlertTriangle },
  { to: '/health-score', label: 'Health Score', icon: Shield },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();
  const { data } = useDashboard();
  const { user, logout } = useAuthStore();
  const overdueCount = data?.data?.summary?.overdue || 0;

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-card border-r border-border shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <RouterNavLink to="/" className="font-display text-xl text-foreground">
          Compliance<span className="text-primary">Wala</span>
        </RouterNavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1" role="navigation" aria-label="Main navigation">
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body font-medium transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.to === '/penalties' && overdueCount > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 rounded-full">{overdueCount}</span>
              )}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-body font-semibold text-primary">R</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-foreground truncate">{user?.id || 'User'}</p>
            <p className="text-xs font-body text-muted-foreground">Free Plan</p>
          </div>
        </div>
        <button onClick={() => void logout()} className="w-full px-3 py-2 text-xs font-body font-medium rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[44px] inline-flex items-center justify-center gap-2">
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
