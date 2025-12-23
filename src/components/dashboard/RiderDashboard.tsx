import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from '@/types/user';
import { MapPin, Navigation } from 'lucide-react';

interface RiderDashboardProps {
  user: User;
}

const mockAssignments = [
  { id: '1', address: '123 Main St, Ikeja', time: '10:00 AM', type: 'Pickup', status: 'upcoming' },
  { id: '2', address: '456 Oak Ave, Victoria Island', time: '11:30 AM', type: 'Delivery', status: 'next' },
  { id: '3', address: '789 Pine Rd, Lekki', time: '2:00 PM', type: 'Pickup', status: 'later' },
];

export function RiderDashboard({ user }: RiderDashboardProps) {
  const getStatusDot = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-amber-500';
      case 'next':
        return 'bg-primary animate-pulse-soft';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rider Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.name.split(' ')[0]}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Assignments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Today's Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAssignments.map((assignment, index) => (
                <Card 
                  key={assignment.id} 
                  className={`bg-muted/50 border-0 opacity-0 animate-slide-up stagger-${index + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusDot(assignment.status)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-foreground">{assignment.type}</span>
                          <span className="text-sm text-muted-foreground">{assignment.time}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{assignment.address}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Earnings */}
        <div className="space-y-4">
          <Card variant="gradient">
            <CardContent className="p-6 text-center">
              <p className="text-primary-foreground/80 text-sm mb-2">Today's Earnings</p>
              <p className="text-4xl font-bold text-primary-foreground mb-1">₦8,450</p>
              <p className="text-primary-foreground/70 text-sm">from 12 deliveries</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <Button variant="success" size="lg" className="w-full">
                Go Online
              </Button>
              <Button variant="outline" size="lg" className="w-full">
                View Route Map
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">3</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
