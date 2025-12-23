import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, ChevronRight, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ReceiptDialog from '@/components/ReceiptDialog';

interface Order {
  id: string;
  tracking_id: string;
  package_type: string;
  pickup_address: string;
  delivery_address: string;
  status: string;
  amount: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  'in-transit': 'bg-primary/10 text-primary',
  delivered: 'bg-secondary/10 text-secondary',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function History() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'delivered' | 'pending' | 'cancelled'>('all');
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || order.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return '📄';
      case 'small':
      case 'medium':
      case 'large':
        return '📦';
      default:
        return '📦';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Order History</h1>
        <p className="text-muted-foreground">View your past deliveries</p>
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by tracking code or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'delivered', 'cancelled'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {orders.length === 0 ? 'No orders yet' : 'No orders match your search'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order, index) => {
            const { date, time } = formatDate(order.created_at);
            return (
              <Card 
                key={order.id} 
                variant="interactive"
                className={`opacity-0 animate-slide-up`}
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-2xl flex-shrink-0">
                      {getTypeIcon(order.package_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{order.tracking_id}</span>
                          <Badge className={statusColors[order.status] || statusColors.pending}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">₦{order.amount.toLocaleString()}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>{date} at {time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground truncate">{order.pickup_address}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground truncate">{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary */}
      {orders.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  ₦{orders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt Dialog */}
      <ReceiptDialog 
        orderId={selectedOrderId} 
        open={!!selectedOrderId} 
        onOpenChange={(open) => !open && setSelectedOrderId(null)} 
      />
    </div>
  );
}
