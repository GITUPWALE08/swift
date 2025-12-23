import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, MapPin, CheckCircle, Truck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockTrackingData = {
  code: 'SD12345',
  status: 'in_transit',
  estimatedTime: '25 mins',
  rider: {
    name: 'Michael O.',
    phone: '+234 801 234 5678',
    vehicle: 'Motorcycle',
    rating: 4.8,
  },
  timeline: [
    { status: 'Order Placed', time: '10:00 AM', completed: true },
    { status: 'Rider Assigned', time: '10:05 AM', completed: true },
    { status: 'Package Picked Up', time: '10:20 AM', completed: true },
    { status: 'In Transit', time: '10:25 AM', completed: true, current: true },
    { status: 'Delivered', time: 'Est. 10:50 AM', completed: false },
  ],
  pickup: '123 Main Street, Ikeja, Lagos',
  delivery: '456 Victoria Island, Lagos',
};

export default function Tracker() {
  const [trackingCode, setTrackingCode] = useState('');
  const [tracking, setTracking] = useState(mockTrackingData);

  const handleSearch = () => {
    // In real app, fetch tracking data
    setTracking(mockTrackingData);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Live Tracker</h1>
        <p className="text-muted-foreground">Track your package in real-time</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter tracking code (e.g., SD12345)"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Track</Button>
          </div>
        </CardContent>
      </Card>

      {tracking && (
        <div className="space-y-4">
          {/* Status Card */}
          <Card variant="gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-primary-foreground/80 text-sm">Tracking Code</p>
                  <p className="text-2xl font-bold text-primary-foreground">{tracking.code}</p>
                </div>
                <div className="w-16 h-16 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
                  <Truck className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-foreground/80" />
                <span className="text-primary-foreground">
                  Arriving in <strong>{tracking.estimatedTime}</strong>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card className="overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-accent to-muted flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
                <p className="text-muted-foreground">Live map view</p>
              </div>
            </div>
          </Card>

          {/* Rider Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Rider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold">
                  {tracking.rider.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{tracking.rider.name}</p>
                  <p className="text-sm text-muted-foreground">{tracking.rider.vehicle}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-amber-500">★</span>
                    <span className="text-sm font-medium text-foreground">{tracking.rider.rating}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">Call</Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {tracking.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        item.completed
                          ? item.current
                            ? "gradient-primary text-primary-foreground shadow-card"
                            : "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {item.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      {index < tracking.timeline.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-10",
                          item.completed ? "bg-secondary" : "bg-border"
                        )} />
                      )}
                    </div>
                    <div className="pb-8">
                      <p className={cn(
                        "font-medium",
                        item.current ? "text-primary" : item.completed ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.status}
                      </p>
                      <p className="text-sm text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Pickup</p>
                  <p className="font-medium text-foreground">{tracking.pickup}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Delivery</p>
                  <p className="font-medium text-foreground">{tracking.delivery}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
