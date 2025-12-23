import { useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type FeedbackType = 'feedback' | 'complaint' | 'suggestion';

export function FeedbackChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<FeedbackType>('feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const feedbackTypes: { id: FeedbackType; label: string; emoji: string }[] = [
    { id: 'feedback', label: 'Feedback', emoji: '💬' },
    { id: 'complaint', label: 'Complaint', emoji: '😔' },
    { id: 'suggestion', label: 'Suggestion', emoji: '💡' },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!user) {
      toast.error('Please sign in to send feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          message: message.trim(),
          type,
        });

      if (error) throw error;

      toast.success('Thank you for your feedback!');
      setMessage('');
      setType('feedback');
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90 transition-all duration-300",
          isOpen && "rotate-90"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 w-80 md:w-96 bg-card border border-border rounded-2xl shadow-xl z-50",
          "transition-all duration-300 transform",
          isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-lg">Send us a message</h3>
          <p className="text-sm text-muted-foreground">We'd love to hear from you!</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Type selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">What type of message?</Label>
            <div className="flex gap-2">
              {feedbackTypes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                    type === item.id
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  <span className="mr-1">{item.emoji}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div className="space-y-2">
            <Label htmlFor="feedback-message" className="text-sm font-medium">
              Your message
            </Label>
            <Textarea
              id="feedback-message"
              placeholder="Tell us what's on your mind..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="w-full"
            variant="gradient"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}