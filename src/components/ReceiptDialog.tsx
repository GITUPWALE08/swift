import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Package, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  tracking_id: string;
  package_type: string;
  package_description: string | null;
  pickup_address: string;
  pickup_contact: string;
  pickup_phone: string;
  delivery_address: string;
  delivery_contact: string;
  delivery_phone: string;
  status: string;
  amount: number;
  created_at: string;
  scheduled_date: string | null;
}

interface Receipt {
  id: string;
  receipt_number: string;
  amount: number;
  issued_at: string;
}

interface ReceiptDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReceiptDialog({ orderId, open, onOpenChange }: ReceiptDialogProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId && open) {
      fetchReceiptData();
    }
  }, [orderId, open]);

  const fetchReceiptData = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      // Fetch order details
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      // Fetch receipt
      const { data: receiptData } = await supabase
        .from('receipts')
        .select('*')
        .eq('order_id', orderId)
        .single();

      setOrder(orderData);
      setReceipt(receiptData);
    } catch (error) {
      console.error('Error fetching receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const packageTypeLabels: Record<string, string> = {
    document: 'Document',
    small: 'Small Package',
    medium: 'Medium Package',
    large: 'Large Package',
  };

  const handleDownload = () => {
    // Create a simple text receipt for download
    if (!order || !receipt) return;

    const receiptText = `
DELIVERY RECEIPT
================

Receipt #: ${receipt.receipt_number}
Date: ${formatDate(receipt.issued_at)}

TRACKING INFO
Tracking ID: ${order.tracking_id}
Status: ${order.status.toUpperCase()}

PACKAGE DETAILS
Type: ${packageTypeLabels[order.package_type] || order.package_type}
Description: ${order.package_description || 'N/A'}

PICKUP LOCATION
Address: ${order.pickup_address}
Contact: ${order.pickup_contact}
Phone: ${order.pickup_phone}

DELIVERY LOCATION
Address: ${order.delivery_address}
Contact: ${order.delivery_contact}
Phone: ${order.delivery_phone}

PAYMENT
Amount: ₦${order.amount.toLocaleString()}

================
Thank you for using our service!
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receipt_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Loading Receipt...</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            Please wait...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order || !receipt) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            Receipt not found
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-secondary" />
            Delivery Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Header */}
          <div className="text-center py-4 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground">Receipt Number</p>
            <p className="text-lg font-bold text-foreground">{receipt.receipt_number}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(receipt.issued_at)}
            </p>
          </div>

          {/* Tracking Info */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
            <div>
              <p className="text-sm text-muted-foreground">Tracking ID</p>
              <p className="font-semibold text-foreground">{order.tracking_id}</p>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full capitalize">
              {order.status}
            </span>
          </div>

          <Separator />

          {/* Package Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">Package Details</span>
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Type:</span>{' '}
                <span className="text-foreground">{packageTypeLabels[order.package_type] || order.package_type}</span>
              </p>
              {order.package_description && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Description:</span>{' '}
                  <span className="text-foreground">{order.package_description}</span>
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Locations */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-sm font-medium text-foreground">Pickup</span>
              </div>
              <div className="pl-5 space-y-1">
                <p className="text-sm text-foreground">{order.pickup_address}</p>
                <p className="text-xs text-muted-foreground">
                  {order.pickup_contact} • {order.pickup_phone}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">Delivery</span>
              </div>
              <div className="pl-5 space-y-1">
                <p className="text-sm text-foreground">{order.delivery_address}</p>
                <p className="text-xs text-muted-foreground">
                  {order.delivery_contact} • {order.delivery_phone}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Amount */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
            <span className="font-medium text-foreground">Total Amount</span>
            <span className="text-2xl font-bold text-primary">
              ₦{order.amount.toLocaleString()}
            </span>
          </div>

          {/* Download Button */}
          <Button onClick={handleDownload} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
