import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCaptionOptions } from "@/hooks/useCaptionOptions";
import { Upload, Folder, Play } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CaptionOptions } from "@shared/schema";

export function UploadPanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use shared caption options state
  const { captionOptions, updateCaptionOption } = useCaptionOptions();

  // Get usage data to check limits
  const { data: usage } = useQuery({
    queryKey: ["/api/usage"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; options: CaptionOptions; duration: number }) => {
      const formData = new FormData();
      formData.append('video', data.file);
      formData.append('captionOptions', JSON.stringify(data.options));
      formData.append('videoDuration', data.duration.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Job #${data.jobId} created. Estimated processing time: ${data.estimatedWaitTime}`,
      });
      
      if (data.watermarked) {
        toast({
          title: "Watermark Applied",
          description: "This video will include a BoostFrame.io watermark. Upgrade to remove watermarks.",
          variant: "default",
        });
      }

      // Reset form
      setSelectedFile(null);
      setVideoDuration(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh usage and jobs data
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateVideoFile = (file: File): Promise<{ valid: boolean; duration: number; aspectRatio: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = function() {
        const aspectRatio = this.videoWidth / this.videoHeight;
        const duration = this.duration / 60; // Convert to minutes
        const isPortrait = aspectRatio <= 0.75; // Allow some tolerance for portrait
        
        resolve({
          valid: isPortrait,
          duration,
          aspectRatio
        });
        
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = function() {
        resolve({ valid: false, duration: 0, aspectRatio: 0 });
        URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid video file (MP4, MOV)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be under 100MB",
        variant: "destructive",
      });
      return;
    }

    // Validate video properties
    const validation = await validateVideoFile(file);
    
    if (!validation.valid) {
      toast({
        title: "Invalid Video Format",
        description: "Please upload a portrait video (9:16 aspect ratio or similar)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setVideoDuration(validation.duration);
    
    toast({
      title: "File Selected",
      description: `${file.name} (${validation.duration.toFixed(1)} minutes)`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const mockEvent = { target: { files: [files[0]] } } as any;
      await handleFileSelect(mockEvent);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a video file first",
        variant: "destructive",
      });
      return;
    }

    // Check if user would exceed limits
    if (usage?.isOverLimit && !usage?.isPaid) {
      toast({
        title: "Usage Limit Reached",
        description: "Please upgrade to continue captioning videos",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      options: captionOptions,
      duration: videoDuration,
    });
  };

  

  return (
    <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Upload & Customize</CardTitle>
          <p className="text-sm text-gray-300">Upload your portrait video and customize captions</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Upload Zone */}
          <div
            className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-white/50 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
          <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center mb-4" style={{backgroundColor: '#04A6F2'}}>
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Upload Portrait Video</h3>
          {selectedFile ? (
            <div style={{color: '#04A6F2'}}>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm">Duration: {videoDuration.toFixed(1)} minutes</p>
            </div>
          ) : (
            <>
              <p className="text-gray-300 mb-4">Drag and drop your video here, or click to browse</p>
              <p className="text-xs text-gray-400 mb-4">MP4, MOV up to 100MB • Portrait orientation only (9:16 ratio)</p>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Folder className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/mov"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Caption Options Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language */}
          <div>
            <Label htmlFor="language" className="text-white">Language</Label>
            <Select value={captionOptions.language} onValueChange={(value) => updateCaptionOption('language', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto Detect</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Style */}
          <div>
            <Label htmlFor="style" className="text-white">Caption Style</Label>
            <Select value={captionOptions.style} onValueChange={(value) => updateCaptionOption('style', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="karaoke">Karaoke</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
                <SelectItem value="underline">Underline</SelectItem>
                <SelectItem value="word_by_word">Word by Word</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Line Color */}
          <div>
            <Label htmlFor="lineColor" className="text-white">Line Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={captionOptions.lineColor}
                onChange={(e) => updateCaptionOption('lineColor', e.target.value)}
                className="w-12 h-10 p-1 border border-white/20 rounded bg-white/10"
              />
              <Input
                type="text"
                value={captionOptions.lineColor}
                onChange={(e) => updateCaptionOption('lineColor', e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Word Color */}
          <div>
            <Label htmlFor="wordColor" className="text-white">Word Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={captionOptions.wordColor}
                onChange={(e) => updateCaptionOption('wordColor', e.target.value)}
                className="w-12 h-10 p-1 border border-white/20 rounded bg-white/10"
              />
              <Input
                type="text"
                value={captionOptions.wordColor}
                onChange={(e) => updateCaptionOption('wordColor', e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Outline Color */}
          <div>
            <Label htmlFor="outlineColor" className="text-white">Outline Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={captionOptions.outlineColor}
                onChange={(e) => updateCaptionOption('outlineColor', e.target.value)}
                className="w-12 h-10 p-1 border border-white/20 rounded bg-white/10"
              />
              <Input
                type="text"
                value={captionOptions.outlineColor}
                onChange={(e) => updateCaptionOption('outlineColor', e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <Label htmlFor="fontFamily" className="text-white">Font Family</Label>
            <Select value={captionOptions.fontFamily} onValueChange={(value) => updateCaptionOption('fontFamily', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial" style={{ fontFamily: 'Arial, sans-serif' }}>Arial</SelectItem>
                <SelectItem value="Arial Black" style={{ fontFamily: 'Arial Black, sans-serif' }}>Arial Black</SelectItem>
                <SelectItem value="Comic Neue" style={{ fontFamily: "'Comic Neue', sans-serif", fontWeight: 400 }}>Comic Neue</SelectItem>
                <SelectItem value="Fredericka the Great" style={{ fontFamily: "'Fredericka the Great', cursive", fontWeight: 400 }}>Fredericka the Great</SelectItem>
                <SelectItem value="Libre Baskerville" style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 400 }}>Libre Baskerville</SelectItem>
                <SelectItem value="Luckiest Guy" style={{ fontFamily: "'Luckiest Guy', cursive", fontWeight: 400 }}>Luckiest Guy</SelectItem>
                <SelectItem value="Nunito" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 400 }}>Nunito</SelectItem>
                <SelectItem value="Oswald" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 400 }}>Oswald</SelectItem>
                <SelectItem value="Pacifico" style={{ fontFamily: "'Pacifico', cursive", fontWeight: 400 }}>Pacifico</SelectItem>
                <SelectItem value="Permanent Marker" style={{ fontFamily: "'Permanent Marker', cursive", fontWeight: 400 }}>Permanent Marker</SelectItem>
                <SelectItem value="Roboto" style={{ fontFamily: 'Roboto, sans-serif' }}>Roboto</SelectItem>
              </SelectContent>
            </Select>
            {/* Font preloader to ensure fonts are loaded */}
            <div className="font-preloader">
              <span style={{ fontFamily: "'Comic Neue', sans-serif" }}>Test</span>
              <span style={{ fontFamily: "'Fredericka the Great', cursive" }}>Test</span>
              <span style={{ fontFamily: "'Libre Baskerville', serif" }}>Test</span>
              <span style={{ fontFamily: "'Luckiest Guy', cursive" }}>Test</span>
              <span style={{ fontFamily: "'Nunito', sans-serif" }}>Test</span>
              <span style={{ fontFamily: "'Pacifico', cursive" }}>Test</span>
              <span style={{ fontFamily: "'Permanent Marker', cursive" }}>Test</span>
            </div>
          </div>

          {/* Font Size */}
          <div>
            <Label htmlFor="fontSize" className="text-white">Font Size</Label>
            <Select value={captionOptions.fontSize.toString()} onValueChange={(value) => updateCaptionOption('fontSize', parseInt(value))}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12px</SelectItem>
                <SelectItem value="14">14px</SelectItem>
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="18">18px</SelectItem>
                <SelectItem value="20">20px</SelectItem>
                <SelectItem value="24">24px</SelectItem>
                <SelectItem value="28">28px</SelectItem>
                <SelectItem value="32">32px</SelectItem>
                <SelectItem value="36">36px</SelectItem>
                <SelectItem value="40">40px</SelectItem>
                <SelectItem value="48">48px</SelectItem>
                <SelectItem value="56">56px</SelectItem>
                <SelectItem value="64">64px</SelectItem>
                <SelectItem value="72">72px</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Words Per Line */}
          <div>
            <Label htmlFor="maxWordsPerLine" className="text-white">Max Words Per Line</Label>
            <Select value={captionOptions.maxWordsPerLine.toString()} onValueChange={(value) => updateCaptionOption('maxWordsPerLine', parseInt(value))}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 word</SelectItem>
                <SelectItem value="2">2 words</SelectItem>
                <SelectItem value="3">3 words</SelectItem>
                <SelectItem value="4">4 words</SelectItem>
                <SelectItem value="5">5 words</SelectItem>
                <SelectItem value="6">6 words</SelectItem>
                <SelectItem value="7">7 words</SelectItem>
                <SelectItem value="8">8 words</SelectItem>
                <SelectItem value="9">9 words</SelectItem>
                <SelectItem value="10">10 words</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div>
            <Label htmlFor="position" className="text-white">Position</Label>
            <Select value={captionOptions.position} onValueChange={(value) => updateCaptionOption('position', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom_left">Bottom Left</SelectItem>
                <SelectItem value="bottom_center">Bottom Center</SelectItem>
                <SelectItem value="bottom_right">Bottom Right</SelectItem>
                <SelectItem value="middle_left">Middle Left</SelectItem>
                <SelectItem value="middle_center">Middle Center</SelectItem>
                <SelectItem value="middle_right">Middle Right</SelectItem>
                <SelectItem value="top_left">Top Left</SelectItem>
                <SelectItem value="top_center">Top Center</SelectItem>
                <SelectItem value="top_right">Top Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alignment */}
          <div>
            <Label htmlFor="alignment" className="text-white">Alignment</Label>
            <Select value={captionOptions.alignment} onValueChange={(value) => updateCaptionOption('alignment', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Style Options Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allCaps"
              checked={captionOptions.allCaps}
              onCheckedChange={(checked) => updateCaptionOption('allCaps', !!checked)}
            />
            <Label htmlFor="allCaps" className="text-sm text-white">All Caps</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="bold"
              checked={captionOptions.bold}
              onCheckedChange={(checked) => updateCaptionOption('bold', !!checked)}
            />
            <Label htmlFor="bold" className="text-sm text-white">Bold</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="italic"
              checked={captionOptions.italic}
              onCheckedChange={(checked) => updateCaptionOption('italic', !!checked)}
            />
            <Label htmlFor="italic" className="text-sm text-white">Italic</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="strikeout"
              checked={captionOptions.strikeout}
              onCheckedChange={(checked) => updateCaptionOption('strikeout', !!checked)}
            />
            <Label htmlFor="strikeout" className="text-sm text-white">Strikeout</Label>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="saveAsDefault"
              checked={captionOptions.saveAsDefault}
              onCheckedChange={(checked) => updateCaptionOption('saveAsDefault', !!checked)}
            />
            <Label htmlFor="saveAsDefault" className="text-sm text-gray-300">
              Save as default settings
            </Label>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || uploadMutation.isPending || (usage?.isOverLimit && !usage?.isPaid)}
            className="text-white hover:opacity-90"
            style={{backgroundColor: '#04A6F2'}}
          >
            <Play className="w-4 h-4 mr-2" />
            {uploadMutation.isPending ? 'Processing...' : 'Process Video'}
          </Button>
        </div>
        </CardContent>
    </Card>
  );
}
