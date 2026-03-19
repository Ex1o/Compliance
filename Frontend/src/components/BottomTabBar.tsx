import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, CheckSquare, Shield, Settings } from 'lucide-react';
import { useDashboard } from '@/hooks/useDeadlines';

const tabs = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, showBadge: true },
  { to: '/calendar', label: 'Calendar', icon: Calendar, showBadge: false },
  { to: '/deadlines', label: 'Deadlines', icon: CheckSquare, showBadge: false },
  { to: '/health-score', label: 'Score', icon: Shield, showBadge: false },
  { to: '/settings', label: 'Settings', icon: Settings, showBadge: false },
];

const BottomTabBar = () => {
  const location = useLocation();
  const { data } = useDashboard();
  const overdueCount = data?.data?.summary?.overdue || 0;

  return (
    <nav className="bottom-tab-bar" aria-label="Mobile navigation">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.to;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] min-h-[44px] justify-center rounded-md transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className="relative">
              <tab.icon size={20} />
              {tab.showBadge && overdueCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center px-1 text-[9px] font-mono font-bold bg-destructive text-white rounded-full animate-pulse-badge">
                  {overdueCount > 9 ? '9+' : overdueCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-body font-medium">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
