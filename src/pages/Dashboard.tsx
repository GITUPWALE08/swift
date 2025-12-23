import { useAuth } from '@/contexts/AuthContext';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { BusinessDashboard } from '@/components/dashboard/BusinessDashboard';
import { RiderDashboard } from '@/components/dashboard/RiderDashboard';
import { User } from '@/types/user';

export default function Dashboard() {
  const { user, profile } = useAuth();

  if (!user || !profile) return null;

  const role = (profile.role as 'customer' | 'business' | 'rider') || 'customer';

  // Create a User object for RiderDashboard which still needs it
  const dashboardUser: User = {
    id: user.id,
    name: profile.name || 'User',
    email: profile.email || user.email || '',
    role: role,
    phone: profile.phone || undefined,
  };

  return (
    <div className="animate-fade-in">
      {role === 'customer' && <CustomerDashboard />}
      {role === 'business' && <BusinessDashboard />}
      {role === 'rider' && <RiderDashboard user={dashboardUser} />}
    </div>
  );
}