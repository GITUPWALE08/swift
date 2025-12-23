import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Package, MapPin, FileText, CreditCard, CheckCircle, ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const steps = [
  { id: 1, title: 'Package', icon: Package },
  { id: 2, title: 'Pickup', icon: MapPin },
  { id: 3, title: 'Delivery', icon: MapPin },
  { id: 4, title: 'Review', icon: FileText },
];

export default function SnapPackage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    packageType: '',
    description: '',
    pickupAddress: '',
    pickupContact: '',
    pickupPhone: '',
    deliveryAddress: '',
    deliveryContact: '',
    deliveryPhone: '',
    scheduledDate: '',
  });

  const packageTypes = [
    { id: 'document', label: 'Document', icon: '📄', price: 500 },
    { id: 'small', label: 'Small Package', icon: '📦', price: 1000 },
    { id: 'medium', label: 'Medium Package', icon: '📦', price: 2000 },
    { id: 'large', label: 'Large Package', icon: '🗃️', price: 3500 },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const generateTrackingId = () => {
    const prefix = 'SD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const generateReceiptNumber = () => {
    const prefix = 'RCP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to create an order.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const trackingId = generateTrackingId();
      const selectedPackage = packageTypes.find(p => p.id === formData.packageType);
      const amount = selectedPackage?.price || 0;

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          tracking_id: trackingId,
          package_type: formData.packageType,
          package_description: formData.description,
          pickup_address: formData.pickupAddress,
          pickup_contact: formData.pickupContact,
          pickup_phone: formData.pickupPhone,
          delivery_address: formData.deliveryAddress,
          delivery_contact: formData.deliveryContact,
          delivery_phone: formData.deliveryPhone,
          scheduled_date: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : null,
          status: 'pending',
          amount: amount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create wallet transaction (debit)
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'payment',
          description: `Delivery ${trackingId}`,
          amount: -amount,
          order_id: order.id,
        });

      if (txError) throw txError;

      // Create receipt
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert({
          order_id: order.id,
          user_id: user.id,
          receipt_number: generateReceiptNumber(),
          amount: amount,
        });

      if (receiptError) throw receiptError;

      toast({
        title: "Order Created!",
        description: `Tracking ID: ${trackingId}. Receipt has been generated.`,
      });
      navigate('/tracker');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packageTypes.find(p => p.id === formData.packageType);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Snap Package</h1>
        <p className="text-muted-foreground">Send a package in minutes</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    isCompleted
                      ? "bg-secondary text-secondary-foreground"
                      : isActive
                      ? "gradient-primary text-primary-foreground shadow-card"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-12 h-0.5 mx-2 transition-colors",
                  isCompleted ? "bg-secondary" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card variant="elevated">
        <CardContent className="p-6">
          {/* Step 1: Package Type */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">What are you sending?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {packageTypes.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handleInputChange('packageType', pkg.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all duration-200",
                        formData.packageType === pkg.id
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl block mb-2">{pkg.icon}</span>
                      <span className="font-medium text-foreground block">{pkg.label}</span>
                      <span className="text-sm text-muted-foreground">₦{pkg.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Package Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of contents..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Pickup (Optional)
                </Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground">Leave empty for immediate pickup</p>
              </div>
            </div>
          )}

          {/* Step 2: Pickup Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pickup Location</h3>
              
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Address</Label>
                <Input
                  id="pickupAddress"
                  placeholder="Enter pickup address"
                  value={formData.pickupAddress}
                  onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupContact">Contact Name</Label>
                <Input
                  id="pickupContact"
                  placeholder="Who should we meet?"
                  value={formData.pickupContact}
                  onChange={(e) => handleInputChange('pickupContact', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupPhone">Phone Number</Label>
                <Input
                  id="pickupPhone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={formData.pickupPhone}
                  onChange={(e) => handleInputChange('pickupPhone', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Delivery Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Delivery Location</h3>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Address</Label>
                <Input
                  id="deliveryAddress"
                  placeholder="Enter delivery address"
                  value={formData.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryContact">Recipient Name</Label>
                <Input
                  id="deliveryContact"
                  placeholder="Who receives the package?"
                  value={formData.deliveryContact}
                  onChange={(e) => handleInputChange('deliveryContact', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryPhone">Phone Number</Label>
                <Input
                  id="deliveryPhone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={formData.deliveryPhone}
                  onChange={(e) => handleInputChange('deliveryPhone', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review Your Order</h3>
              
              <div className="space-y-4">
                <Card className="bg-muted/50 border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedPackage?.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{selectedPackage?.label}</p>
                        <p className="text-sm text-muted-foreground">{formData.description || 'No description'}</p>
                      </div>
                    </div>
                    {formData.scheduledDate && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Scheduled: {new Date(formData.scheduledDate).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup</p>
                      <p className="font-medium text-foreground">{formData.pickupAddress}</p>
                      <p className="text-sm text-muted-foreground">{formData.pickupContact} • {formData.pickupPhone}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery</p>
                      <p className="font-medium text-foreground">{formData.deliveryAddress}</p>
                      <p className="text-sm text-muted-foreground">{formData.deliveryContact} • {formData.deliveryPhone}</p>
                    </div>
                  </div>
                </div>

                <Card className="gradient-primary border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="text-primary-foreground font-medium">Total</span>
                    <span className="text-2xl font-bold text-primary-foreground">
                      ₦{selectedPackage?.price.toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1" disabled={loading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {currentStep < 4 ? (
              <Button onClick={handleNext} className="flex-1">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button variant="gradient" onClick={handleSubmit} className="flex-1" disabled={loading}>
                <CreditCard className="w-4 h-4 mr-2" />
                {loading ? 'Processing...' : 'Confirm & Pay'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
