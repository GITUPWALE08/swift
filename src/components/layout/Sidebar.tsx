import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  History, 
  CreditCard, 
  LogOut,
  Truck,
  X,
  Settings
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['customer', 'business', 'rider'],
    },
    {
      label: 'Snap Package',
      icon: Package,
      path: '/snap-package',
      roles: ['customer', 'business'],
    },
    {
      label: 'Live Tracker',
      icon: MapPin,
      path: '/tracker',
      roles: ['customer', 'business', 'rider'],
    },
    {
      label: 'Order History',
      icon: History,
      path: '/history',
      roles: ['customer', 'business', 'rider'],
    },
    {
      label: 'Payment',
      icon: CreditCard,
      path: '/payment',
      roles: ['customer', 'business'],
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['customer', 'business', 'rider'],
    },
  ];

  const filteredItems = menuItems.filter(item => 
    profile && item.roles.includes(profile.role || 'customer')
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border shadow-elevated transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="gradient-primary p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-primary-foreground">SwiftDispatch</h2>
                <span className="text-xs text-primary-foreground/80 uppercase tracking-wider">
                  {profile?.role || 'customer'}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-primary-foreground/10 text-primary-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="mb-4 p-4 bg-muted rounded-xl">
            <p className="text-sm font-medium text-foreground">{profile?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{profile?.email || ''}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}