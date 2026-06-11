import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  FileText,
  Globe,
  Monitor,
  Share2,
  Menu,
  BarChart3,
  ChevronRight,
  Code,
  Tag,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSite } from '@/context/SiteContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Overview',        path: '/',           icon: LayoutDashboard },
  { label: 'Real-Time',       path: '/realtime',   icon: Radio },
  { label: 'Pages',           path: '/pages',      icon: FileText },
  { label: 'Geography',       path: '/geography',  icon: Globe },
  { label: 'Devices',         path: '/devices',    icon: Monitor },
  { label: 'Traffic Sources', path: '/sources',    icon: Share2 },
  { label: 'Campaigns',       path: '/campaigns',  icon: Tag },
  { label: 'Tracking Setup',  path: '/tracker',    icon: Code },
];

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-sidebar-primary-foreground/10">
          <BarChart3 className="w-5 h-5 text-sidebar-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-primary leading-none">Analytics</p>
          <p className="text-xs text-sidebar-foreground/60 mt-0.5">Self-Hosted</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNav}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors duration-150',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 text-center">
          Custom Analytics v1.0
        </p>
      </div>
    </div>
  );
}

// ── Site selector dropdown in header ─────────────────────────────────────────
function SiteSelector() {
  const { sites, activeSite, setActiveSite } = useSite();

  // Only render if we have more than one tracked site (or at least one known site)
  if (sites.length === 0) return null;

  const label = activeSite || 'All Sites';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors max-w-[160px]">
          <Building2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
          <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuLabel className="text-xs">Filter by website</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setActiveSite('')}
          className={cn('text-xs', !activeSite && 'font-semibold text-primary')}
        >
          All Sites
        </DropdownMenuItem>
        {sites.map((site) => (
          <DropdownMenuItem
            key={site}
            onClick={() => setActiveSite(site)}
            className={cn('text-xs', activeSite === site && 'font-semibold text-primary')}
          >
            {site}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentNav = navItems.find((n) =>
    n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60 bg-sidebar border-r border-sidebar-border">
          <SidebarContent onNav={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 md:px-6 border-b border-border bg-card">
          <button
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {currentNav && (
              <>
                <currentNav.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <h1 className="text-sm font-semibold text-foreground truncate">
                  {currentNav.label}
                </h1>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Site filter */}
            <SiteSelector />
            <span className="text-xs text-muted-foreground hidden md:block">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
