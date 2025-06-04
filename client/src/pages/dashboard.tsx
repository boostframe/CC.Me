import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Video, ChevronDown, Zap, TrendingUp } from "lucide-react";
import { UsageMeters } from "@/components/usage-meters";
import { UploadPanel } from "@/components/upload-panel";
import { JobHistory } from "@/components/job-history";
import { CaptionPreview } from "@/components/caption-preview";
import { UpgradeModal } from "@/components/upgrade-modal";
import { CaptionOptionsProvider } from "@/hooks/useCaptionOptions";
import { useState } from "react";
import boostFrameLogo from "../assets/boostframe-logo.png";

export default function Dashboard() {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

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

  return (
    <div className="min-h-screen" style={{backgroundColor: '#060A0D'}}>
      {/* Navigation Header */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={boostFrameLogo} alt="CC.Me" className="w-8 h-8" />
              <div className="ml-2">
                <span className="text-xl font-bold text-white">CC</span>
                <span className="text-xl font-bold" style={{color: '#04A6F2'}}>.Me</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={user?.planTier === 'Paid' ? 'default' : 'secondary'} 
                     className={user?.planTier === 'Paid' ? 'text-white' : 'bg-slate-700 text-gray-300'}
                     style={user?.planTier === 'Paid' ? {backgroundColor: '#04A6F2'} : {}}>
                {user?.planTier === 'Paid' ? 'Pro Plan' : 'Free Plan'}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-white/10">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.profileImageUrl} alt="User avatar" />
                      <AvatarFallback className="bg-slate-700 text-white">{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block">{getUserDisplayName(user)}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                  <DropdownMenuItem onClick={() => setShowUpgradeModal(true)} className="text-white hover:bg-slate-700">
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-white hover:bg-slate-700">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Welcome back, {getUserDisplayName(user)}
              </h1>
              <p className="mt-1 text-sm text-gray-300">Create engaging captioned videos in minutes</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button onClick={() => setShowUpgradeModal(true)} style={{backgroundColor: '#04A6F2'}} className="hover:opacity-90 text-white">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>

        {/* Usage Meters */}
        <UsageMeters onUpgradeClick={() => setShowUpgradeModal(true)} />

        <CaptionOptionsProvider>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6 mb-6">
            {/* Upload and Caption Options Panel - 2/5 width */}
            <div className="lg:col-span-2 min-h-[720px]">
              <UploadPanel />
            </div>

            {/* Caption Preview - 2/5 width */}
            <div className="lg:col-span-2 min-h-[720px]">
              <CaptionPreview />
            </div>

          {/* Quick Stats and Tips - 1/5 width */}
          <div className="space-y-3 min-h-[720px]">
            {/* Pro Tips Card - Half height */}
            <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30 backdrop-blur-sm h-[calc(50%-6px)] flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="tracking-tight text-white text-[25px] font-semibold">💡 Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                <ul className="space-y-3 text-gray-300 flex-1 text-[15px] font-medium">
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400 mt-1">•</span>
                    <span className="leading-relaxed">Use 9:16 aspect ratio for best results on social media</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400 mt-1">•</span>
                    <span className="leading-relaxed">Clear audio significantly improves caption accuracy</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400 mt-1">•</span>
                    <span className="leading-relaxed">Keep videos under 5 minutes for faster processing times</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400 mt-1">•</span>
                    <span className="leading-relaxed">Preview captions before finalizing your video</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Upgrade Prompt - Half height */}
            <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm h-[calc(50%-6px)] flex flex-col">
              <CardContent className="pt-6 flex-1 flex flex-col justify-between">
                <div className="flex flex-col h-full">
                  <div className="w-full h-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg mb-4 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-white mb-3 text-[22px]">Unlock Unlimited</h3>
                      <p className="text-gray-300 mb-4 text-[16px]">
                        Caption unlimited videos without watermarks. Perfect for content creators, businesses, and professionals who need high-quality captions at scale.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowUpgradeModal(true)} 
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 mt-auto text-[16px]"
                    >
                      Start Free Trial
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </CaptionOptionsProvider>

        {/* Job History Table */}
        <div className="mt-6">
          <JobHistory />
        </div>
      </main>
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
}
