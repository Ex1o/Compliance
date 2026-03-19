import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import BottomTabBar from './BottomTabBar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => (
  <div className="flex min-h-screen w-full">
    <AppSidebar />
    <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
      {children}
    </main>
    <BottomTabBar />
  </div>
);

export default AppLayout;
