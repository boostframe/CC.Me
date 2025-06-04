import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  RefreshCw, 
  FileText, 
  Video, 
  Check, 
  Clock, 
  AlertCircle, 
  X 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { CaptionJob } from "@shared/schema";

export function JobHistory() {
  const { toast } = useToast();
  const { data: jobs, isLoading, refetch } = useQuery<CaptionJob[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 10000, // Refresh every 10 seconds for status updates
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Jobs Refreshed",
      description: "Job list has been updated",
    });
  };

  const handleDownload = (url: string, type: 'caption' | 'video') => {
    if (!url) {
      toast({
        title: "Download Not Available",
        description: "File is not ready for download yet",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, this would handle secure download URLs
    window.open(url, '_blank');
    toast({
      title: "Download Started",
      description: `${type === 'caption' ? 'Caption' : 'Video'} file download initiated`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <Check className="w-3 h-3 text-green-600" />;
      case 'processing':
        return <Clock className="w-3 h-3 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-600" />;
      case 'blocked':
        return <X className="w-3 h-3 text-red-600" />;
      default:
        return <Clock className="w-3 h-3 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'complete':
        return 'default' as const;
      case 'processing':
        return 'secondary' as const;
      case 'failed':
      case 'blocked':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="tracking-tight font-semibold text-white text-[20px]">Job History</CardTitle>
            <p className="text-gray-300 mt-1 text-[16px]">Track your video processing jobs and download results</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="border-slate-600 text-white hover:bg-slate-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!jobs || jobs.length === 0 ? (
          <div className="text-center py-8">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No videos processed yet</h3>
            <p className="text-gray-300">Upload your first video to get started with captioning</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Watermark</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Video className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#e2e4e5]">
                            {job.filename}
                          </div>
                          <div className="text-sm text-gray-500">
                            {job.createdAt && formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {parseFloat(job.videoDuration).toFixed(1)} min
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(job.status)} className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-primary-foreground hover:bg-primary/80 flex items-center w-fit bg-[#2563eb]">
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.watermarked ? "secondary" : "outline"}>
                        {job.watermarked ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.status === 'complete' ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(job.outputCaptionFile || '', 'caption')}
                            disabled={!job.outputCaptionFile}
                            className="h-8 w-8 p-0"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(job.outputVideoFile || '', 'video')}
                            disabled={!job.outputVideoFile}
                            className="h-8 w-8 p-0"
                          >
                            <Video className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : job.status === 'processing' ? (
                        <span className="text-sm text-gray-500">Processing...</span>
                      ) : job.status === 'failed' ? (
                        <span className="text-sm text-red-600">Failed</span>
                      ) : (
                        <span className="text-sm text-gray-500">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
