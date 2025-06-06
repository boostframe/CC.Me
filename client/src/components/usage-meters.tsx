import { useQuery } from "@tanstack/react-query";
import type { Usage } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gift, ShieldAlert, Activity } from "lucide-react";

interface UsageMetersProps {
  onUpgradeClick: () => void;
}

export function UsageMeters({ onUpgradeClick }: UsageMetersProps) {
  const { data: usage, isLoading } = useQuery<Usage>({
    queryKey: ["/api/usage"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-8 bg-white/20 rounded mb-4"></div>
                <div className="h-2 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/20 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const freeUsed = 5 - (usage?.freeRemaining || 0);
  const freeProgress = (freeUsed / 5) * 100;
  
  const watermarkUsed = Math.max(0, (usage?.totalMinutes || 0) - 5);
  const watermarkProgress = (watermarkUsed / 5) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Free Minutes */}
      <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-300">Free Minutes</p>
              <p className="text-2xl font-bold text-white">
                {freeUsed.toFixed(1)} / 5.0
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#04A6F2'}}>
              <Gift className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={freeProgress} className="h-2 [&>div]:bg-blue-600 bg-gray-300" />
            <p className="text-xs text-gray-400">No watermark • High quality</p>
          </div>
        </CardContent>
      </Card>

      {/* Watermarked Minutes */}
      <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-300">Watermarked Minutes</p>
              <p className="text-2xl font-bold text-white">
                {watermarkUsed.toFixed(1)} / 5.0
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={watermarkProgress} className="h-2 [&>div]:bg-amber-500 bg-gray-300" />
            <p className="text-xs text-gray-400">Free with BoostFrame watermark</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Usage This Month */}
      <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-300">This Month</p>
              <p className="text-2xl font-bold text-white">
                {(usage?.totalMinutes || 0).toFixed(1)} min
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#1F1FCA'}}>
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            {usage?.isPaid ? (
              <div className="flex items-center text-sm" style={{color: '#04A6F2'}}>
                <Gift className="w-4 h-4 mr-1" />
                <span>Unlimited usage enabled</span>
              </div>
            ) : usage?.isOverLimit ? (
              <div className="space-y-2">
                <div className="text-sm text-red-400 font-medium">
                  Limit reached
                </div>
                <button
                  onClick={onUpgradeClick}
                  className="text-xs hover:opacity-80 underline"
                  style={{color: '#04A6F2'}}
                >
                  Upgrade to continue
                </button>
              </div>
            ) : (
              <div className="flex items-center text-sm" style={{color: '#04A6F2'}}>
                <Activity className="w-4 h-4 mr-1" />
                <span>Within free limits</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
