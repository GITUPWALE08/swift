import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Package, Users, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ReceiptDialog from '@/components/ReceiptDialog';

interface Order {
  id: string;
  tracking_id: string;
  delivery_address: string;
  delivery_contact: string;
  status: string;
  amount: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'in-transit': 'bg-primary/10 text-primary border-primary/20',
  delivered: 'bg-secondary/10 text-secondary border-secondary/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function BusinessDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    delivered: 0,
    successRate: '-',
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allOrders = data || [];
      setOrders(allOrders.slice(0, 5));

      const delivered = allOrders.filter(o => o.status === 'delivered').length;
      const revenue = allOrders.reduce((sum, o) => sum + o.amount, 0);
      const successRate = allOrders.length > 0 
        ? Math.round((delivered / allOrders.length) * 100) + '%'
        : '-';

      setStats({
        totalOrders: allOrders.length,
        revenue,
        delivered,
        successRate,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders.toString(), change: '-', icon: Package },
    { label: 'Revenue', value: `₦${stats.revenue.toLocaleString()}`, change: '-', icon: TrendingUp },
    { label: 'Delivered', value: stats.delivered.toString(), change: '-', icon: CheckCircle },
    { label: 'Success Rate', value: stats.successRate, change: '-', icon: Users },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Business Dashboard</h1>
        <p className="text-muted-foreground">Overview of your logistics operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`opacity-0 animate-slide-up stagger-${index + 1}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Shipments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Shipments</CardTitle>
            {orders.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                View All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No shipments yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your recent shipments will appear here
              </p>
              <Button onClick={() => navigate('/snap-package')}>
                Create First Shipment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 font-medium text-foreground">{order.tracking_id}</td>
                      <td className="py-3 px-4 text-muted-foreground">{order.delivery_contact}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={statusColors[order.status] || statusColors.pending}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-foreground">₦{order.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      <ReceiptDialog 
        orderId={selectedOrderId} 
        open={!!selectedOrderId} 
        onOpenChange={(open) => !open && setSelectedOrderId(null)} 
      />
    </div>
  );
}
