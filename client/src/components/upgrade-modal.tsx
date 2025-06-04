import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePlanSelect = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setIsLoading(true);

    // Use a simple redirect without try-catch to avoid errors
    window.location.href = `/subscribe?plan=${plan}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-[#d0d2d5]">
              Upgrade to Pro
            </DialogTitle>
            <Button variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-sm text-[#d1d3d6]">
            Choose your plan to unlock unlimited video captioning and advanced features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Monthly Plan */}
          <Card className="border-2 border-blue-600 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Most Popular
            </div>
            <CardContent className="pt-6">
              <h4 className="text-xl font-bold mb-2 text-[#d1d3d6]">Pro Monthly</h4>
              <p className="text-3xl font-bold text-blue-600 mb-4">
                $9.99<span className="text-lg text-gray-600">/month</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Unlimited video captioning</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>No watermarks</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Priority processing</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Advanced customization</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
              <Button 
                onClick={() => handlePlanSelect('monthly')} 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading && selectedPlan === 'monthly' ? 'Loading...' : 'Start Free Trial'}
              </Button>
            </CardContent>
          </Card>
          
          {/* Yearly Plan */}
          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <h4 className="text-xl font-bold mb-2 text-[#c5c8cb]">Pro Yearly</h4>
              <p className="text-3xl font-bold text-blue-600 mb-4">
                $99.90<span className="text-lg text-gray-600">/year</span>
              </p>
              <p className="text-sm text-green-600 mb-4 font-medium">
                Save $19.98 per year (17% off)
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Everything in Pro Monthly</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>2 months free</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Early access to features</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Annual usage reports</span>
                </li>
              </ul>
              <Button 
                onClick={() => handlePlanSelect('yearly')} 
                disabled={isLoading}
                variant="outline" 
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                {isLoading && selectedPlan === 'yearly' ? 'Loading...' : 'Start Free Trial'}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-6 pb-4">
          <p className="text-sm text-gray-600">
            7-day free trial • Cancel anytime • No setup fees
          </p>
          <p className="text-xs text-gray-500 mt-2">
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
