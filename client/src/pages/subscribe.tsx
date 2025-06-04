import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Video, Check, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import boostFrameLogo from "@assets/BoostFrame Logo.png";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to CC.Me Pro! You now have unlimited access.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {isLoading ? 'Processing...' : 'Complete Subscription'}
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        Your subscription will begin immediately after payment confirmation.
        You can cancel anytime from your account settings.
      </p>
    </form>
  );
};

export default function Subscribe() {
  const { user, isLoading: authLoading } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const { toast } = useToast();

  // Get plan from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan') || 'monthly';
    setSelectedPlan(plan);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    const createSubscription = async () => {
      setIsCreating(true);
      try {
        // Get plan from URL params, default to monthly
        const urlParams = new URLSearchParams(window.location.search);
        const plan = urlParams.get('plan') || 'monthly';
        console.log('Creating subscription with plan from URL:', plan);
        
        const response = await apiRequest("POST", "/api/create-subscription", { plan });
        const data = await response.json();
        console.log('Subscription response:', data);
        
        if (!data.clientSecret) {
          if (data.message === 'Subscription already active') {
            toast({
              title: "Already Subscribed",
              description: "You already have an active subscription. Please contact support if you need to change plans.",
              variant: "default",
            });
            return;
          }
          throw new Error('No client secret received from server');
        }
        
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create subscription",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    };

    createSubscription();
  }, [user, authLoading, toast]);

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#060A0D'}}>
      {/* Navigation Header */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="mr-4 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <img src={boostFrameLogo} alt="BoostFrame" className="w-8 h-8" />
              <span className="ml-2 text-xl font-bold text-white">BoostFrame</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={(user as any)?.planTier === 'paid' ? 'default' : 'secondary'} 
                     className={(user as any)?.planTier === 'paid' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300'}>
                {(user as any)?.planTier === 'paid' ? 'Pro Plan' : 'Free Plan'}
              </Badge>
              <Avatar className="w-8 h-8">
                <AvatarImage src={(user as any)?.profileImageUrl || ''} alt="User avatar" />
                <AvatarFallback className="bg-slate-700 text-white">{getUserInitials(user)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-white">{getUserDisplayName(user)}</span>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Plan Details */}
          <div>
            <h1 className="text-3xl font-bold mb-4 text-[#eff6ff]">
              Upgrade to BoostFrame Pro
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Unlock unlimited video captioning and remove watermarks from all your content.
            </p>

            {/* Plan Features */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pro {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ${selectedPlan === 'yearly' ? '99.90' : '9.99'}
                    </div>
                    <div className="text-sm text-gray-500">
                      per {selectedPlan === 'yearly' ? 'year' : 'month'}
                    </div>
                    {selectedPlan === 'yearly' && (
                      <div className="text-sm text-green-600 font-medium">
                        Save $19.98 per year
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited video captioning</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>No watermarks on output videos</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Priority processing queue</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Advanced caption customization</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Cancel anytime</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Free Trial Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🎉 7-Day Free Trial</h3>
              <p className="text-sm text-blue-800">
                Try BoostFrame Pro free for 7 days. No commitment required. 
                You can cancel before your trial ends without being charged.
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <p className="text-sm text-gray-600">
                  Secure payment powered by Stripe. Your information is encrypted and protected.
                </p>
              </CardHeader>
              <CardContent>
                {isCreating ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-gray-600">Setting up your subscription...</p>
                    </div>
                  </div>
                ) : !clientSecret ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <p className="text-gray-600">Unable to load payment form.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => window.location.reload()}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#2563eb',
                        }
                      }
                    }}
                  >
                    <SubscribeForm />
                  </Elements>
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                🔒 Your payment information is secure and encrypted. 
                We use Stripe for payment processing and never store your card details.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
