import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, CreditCard, History, ArrowRight, Clock, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ReceiptDialog from '@/components/ReceiptDialog';

interface Order {
  id: string;
  tracking_id: string;
  package_type: string;
  delivery_address: string;
  status: string;
  amount: number;
  created_at: string;
  scheduled_date: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  'in-transit': 'bg-primary/10 text-primary',
  delivered: 'bg-secondary/10 text-secondary',
  cancelled: 'bg-destructive/10 text-destructive',
};

export function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Snap Package',
      description: 'Send a package in minutes',
      icon: '📦',
      bgIcon: Package,
      path: '/snap-package',
    },
    {
      title: 'Track Order',
      description: 'Live tracking',
      icon: '📍',
      bgIcon: MapPin,
      path: '/tracker',
    },
    {
      title: 'Payment',
      description: 'View & manage payments',
      icon: '💳',
      bgIcon: CreditCard,
      path: '/payment',
    },
    {
      title: 'History',
      description: 'Past deliveries',
      icon: '📋',
      bgIcon: History,
      path: '/history',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          What would you like to do today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Card
            key={action.path}
            variant="interactive"
            className={`group opacity-0 animate-slide-up stagger-${index + 1}`}
            onClick={() => navigate(action.path)}
          >
            <CardContent className="p-5 text-center">
              <div className="text-4xl mb-3">{action.icon}</div>
              <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
              <p className="text-xs text-muted-foreground">{action.description}</p>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 mx-auto text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
          {orders.length > 0 && (
            <button 
              onClick={() => navigate('/history')}
              className="text-sm text-primary hover:underline"
            >
              View All
            </button>
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No orders yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by sending your first package!
                </p>
                <button
                  onClick={() => navigate('/snap-package')}
                  className="text-primary hover:underline text-sm"
                >
                  Send a Package →
                </button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="hover:shadow-card transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-xl">
                        📦
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{order.tracking_id}</p>
                          {order.scheduled_date && new Date(order.scheduled_date) > new Date() && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Scheduled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {order.delivery_address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[order.status] || statusColors.pending}>
                        {order.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderId(order.id);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Receipt Dialog */}
      <ReceiptDialog 
        orderId={selectedOrderId} 
        open={!!selectedOrderId} 
        onOpenChange={(open) => !open && setSelectedOrderId(null)} 
      />
    </div>
  );
}
