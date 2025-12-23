import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Plus, Wallet, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentMethod {
  id: string;
  card_last4: string;
  card_brand: string;
  card_expiry: string;
  is_default: boolean;
}

interface WalletTransaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  created_at: string;
}

export default function Payment() {
  const { user } = useAuth();
  const [showAddCard, setShowAddCard] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    if (user) {
      fetchPaymentData();
    }
  }, [user]);

  const fetchPaymentData = async () => {
    if (!user) return;
    
    try {
      // Fetch payment methods
      const { data: cardsData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch ALL wallet transactions for balance calculation
      const { data: allTxData } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', user.id);

      // Fetch recent transactions for display
      const { data: recentTxData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setCards(cardsData || []);
      setTransactions(recentTxData || []);

      // Calculate wallet balance from ALL transactions
      const balance = (allTxData || []).reduce((sum, tx) => sum + tx.amount, 0);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!user) return;
    
    // Basic validation
    if (cardForm.cardNumber.length < 16 || !cardForm.expiry || cardForm.cvv.length < 3) {
      toast({
        title: "Invalid Card",
        description: "Please enter valid card details.",
        variant: "destructive",
      });
      return;
    }

    const last4 = cardForm.cardNumber.slice(-4);
    const brand = cardForm.cardNumber.startsWith('4') ? 'Visa' : 
                  cardForm.cardNumber.startsWith('5') ? 'Mastercard' : 'Card';

    const { error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        card_last4: last4,
        card_brand: brand,
        card_expiry: cardForm.expiry,
        is_default: cards.length === 0,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add card. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Card Added",
      description: "Your new card has been saved successfully.",
    });
    setShowAddCard(false);
    setCardForm({ cardNumber: '', expiry: '', cvv: '' });
    fetchPaymentData();
  };

  const handleDeleteCard = async (cardId: string) => {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', cardId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete card.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Card Removed",
      description: "Your card has been removed.",
    });
    fetchPaymentData();
  };

  const handleTopUp = async () => {
    if (!user) return;

    const amount = parseInt(topUpAmount);
    if (!amount || amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least ₦100.",
        variant: "destructive",
      });
      return;
    }

    if (cards.length === 0) {
      toast({
        title: "No Payment Method",
        description: "Please add a card first to top up your wallet.",
        variant: "destructive",
      });
      return;
    }

    setTopUpLoading(true);

    const { error } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'topup',
        description: 'Wallet Top-up',
        amount: amount,
      });

    setTopUpLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Top-up failed. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Top-up Successful",
      description: `₦${amount.toLocaleString()} added to your wallet.`,
    });
    setTopUpAmount('');
    setShowTopUp(false);
    fetchPaymentData();
  };

  const quickTopUpAmounts = [1000, 2000, 5000, 10000];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Payment</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Payment</h1>
        <p className="text-muted-foreground">Manage your payment methods & wallet</p>
      </div>

      {/* Wallet Balance */}
      <Card variant="gradient" className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Wallet Balance
              </p>
              <p className="text-4xl font-bold text-primary-foreground mt-2">
                ₦{walletBalance.toLocaleString()}
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => setShowTopUp(!showTopUp)}
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Top Up
            </Button>
          </div>
          
          {showTopUp && (
            <div className="mt-4 p-4 bg-primary-foreground/10 rounded-xl space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {quickTopUpAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="ghost"
                    size="sm"
                    onClick={() => setTopUpAmount(amount.toString())}
                    className={cn(
                      "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground",
                      topUpAmount === amount.toString() && "ring-2 ring-primary-foreground"
                    )}
                  >
                    ₦{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="bg-primary-foreground/20 border-0 text-primary-foreground placeholder:text-primary-foreground/60"
                />
                <Button
                  onClick={handleTopUp}
                  disabled={topUpLoading || !topUpAmount}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  {topUpLoading ? 'Processing...' : 'Add Funds'}
                </Button>
              </div>
              {cards.length === 0 && (
                <p className="text-sm text-primary-foreground/70">
                  Add a card below to enable top-ups
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Payment Methods</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAddCard(!showAddCard)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {cards.length === 0 && !showAddCard && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No payment methods added yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setShowAddCard(true)}
              >
                Add Your First Card
              </Button>
            </div>
          )}

          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-colors",
                card.is_default ? "border-primary bg-accent" : "border-border"
              )}
            >
              <div className="w-12 h-8 bg-gradient-to-br from-foreground/80 to-foreground rounded-md flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-background" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {card.card_brand} •••• {card.card_last4}
                </p>
                <p className="text-sm text-muted-foreground">Expires {card.card_expiry}</p>
              </div>
              {card.is_default && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Default
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleDeleteCard(card.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {showAddCard && (
            <Card className="bg-muted/50 border-0 mt-4">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input 
                    id="cardNumber" 
                    placeholder="1234 5678 9012 3456"
                    value={cardForm.cardNumber}
                    onChange={(e) => setCardForm(prev => ({ ...prev, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input 
                      id="expiry" 
                      placeholder="MM/YY"
                      value={cardForm.expiry}
                      onChange={(e) => setCardForm(prev => ({ ...prev, expiry: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input 
                      id="cvv" 
                      placeholder="123" 
                      type="password"
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCard} className="flex-1">Save Card</Button>
                  <Button variant="outline" onClick={() => setShowAddCard(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className={`flex items-center gap-4 py-3 border-b border-border last:border-0 opacity-0 animate-slide-up`}
                  style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    tx.amount > 0 ? "bg-secondary/10" : "bg-primary/10"
                  )}>
                    {tx.amount > 0 ? (
                      <ArrowDownLeft className="w-5 h-5 text-secondary" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</p>
                  </div>
                  <span className={cn(
                    "font-semibold",
                    tx.amount > 0 ? "text-secondary" : "text-foreground"
                  )}>
                    {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
