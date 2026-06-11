import type { ReactNode } from 'react';
import OverviewPage from './pages/OverviewPage';
import RealTimePage from './pages/RealTimePage';
import PagesPage from './pages/PagesPage';
import GeographyPage from './pages/GeographyPage';
import DevicesPage from './pages/DevicesPage';
import SourcesPage from './pages/SourcesPage';
import CampaignsPage from './pages/CampaignsPage';
import TrackerPage from './pages/TrackerPage';
import DashboardLayout from './components/layouts/DashboardLayout';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

function withLayout(element: ReactNode) {
  return <DashboardLayout>{element}</DashboardLayout>;
}

export const routes: RouteConfig[] = [
  { name: 'Overview',        path: '/',           element: withLayout(<OverviewPage />),   public: true },
  { name: 'Real-Time',       path: '/realtime',   element: withLayout(<RealTimePage />),   public: true },
  { name: 'Pages',           path: '/pages',      element: withLayout(<PagesPage />),      public: true },
  { name: 'Geography',       path: '/geography',  element: withLayout(<GeographyPage />),  public: true },
  { name: 'Devices',         path: '/devices',    element: withLayout(<DevicesPage />),    public: true },
  { name: 'Traffic Sources', path: '/sources',    element: withLayout(<SourcesPage />),    public: true },
  { name: 'Campaigns',       path: '/campaigns',  element: withLayout(<CampaignsPage />),  public: true },
  { name: 'Tracking Setup',  path: '/tracker',    element: withLayout(<TrackerPage />),    public: true },
];
