import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";
import type { CaptionOptions } from "@shared/schema";

interface CaptionPreviewProps {
  captionOptions: CaptionOptions;
}

export function CaptionPreview({ captionOptions }: CaptionPreviewProps) {
  // Split text based on maxWordsPerLine setting
  const words = "This is how your captions will look!".split(" ");
  const lines = [];
  for (let i = 0; i < words.length; i += captionOptions.maxWordsPerLine) {
    lines.push(words.slice(i, i + captionOptions.maxWordsPerLine).join(" "));
  }
  const displayText = captionOptions.allCaps ? lines.join("\n").toUpperCase() : lines.join("\n");

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      padding: '8px 16px',
      borderRadius: '4px',
      maxWidth: '80%',
      zIndex: 10,
      whiteSpace: 'pre-line' as const,
    };

    // Handle alignment
    const alignmentStyles = {
      textAlign: captionOptions.alignment as "left" | "center" | "right",
      left: captionOptions.alignment === 'left' ? '10%' : 
            captionOptions.alignment === 'right' ? 'auto' : '50%',
      right: captionOptions.alignment === 'right' ? '10%' : 'auto',
      transform: captionOptions.alignment === 'center' ? 'translateX(-50%)' : 'none',
    };

    // Handle position
    switch (captionOptions.position) {
      case 'top':
        return { ...baseStyles, ...alignmentStyles, top: '10%' };
      case 'center':
        return { 
          ...baseStyles, 
          ...alignmentStyles, 
          top: '50%', 
          transform: captionOptions.alignment === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)'
        };
      case 'bottom':
      default:
        return { ...baseStyles, ...alignmentStyles, bottom: '10%' };
    }
  };

  const getFontFamily = (fontFamily: string) => {
    const fontMap: Record<string, string> = {
      'Comic Neue': "'Comic Neue', sans-serif",
      'Fredericka the Great': "'Fredericka the Great', cursive",
      'Libre Baskerville': "'Libre Baskerville', serif",
      'Luckiest Guy': "'Luckiest Guy', cursive",
      'Nunito': "'Nunito', sans-serif",
      'Pacifico': "'Pacifico', cursive",
      'Permanent Marker': "'Permanent Marker', cursive",
      'Oswald': "'Oswald', sans-serif",
      'Arial': 'Arial, sans-serif',
      'Arial Black': 'Arial Black, sans-serif',
      'Roboto': 'Roboto, sans-serif'
    };
    return fontMap[fontFamily] || fontFamily;
  };

  const captionStyle = {
    ...getPositionStyles(),
    fontSize: `${captionOptions.fontSize}px`,
    fontFamily: getFontFamily(captionOptions.fontFamily),
    color: captionOptions.wordColor,
    fontWeight: captionOptions.bold ? 'bold' : 'normal',
    fontStyle: captionOptions.italic ? 'italic' : 'normal',
    textDecoration: captionOptions.strikeout ? 'line-through' : 'none',
    background: captionOptions.style === 'highlight' ? 'rgba(0,0,0,0.8)' : 
               captionOptions.style === 'overlay' ? 'rgba(255,255,255,0.2)' : 'transparent',
    backdropFilter: captionOptions.style !== 'none' ? 'blur(4px)' : 'none',
    border: `2px solid ${captionOptions.outlineColor}`,
    WebkitTextStroke: `1px ${captionOptions.outlineColor}`,
    textShadow: `2px 2px 4px ${captionOptions.outlineColor}`,
  };

  return (
    <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Caption Preview</CardTitle>
        <p className="text-sm text-gray-300">See how your captions will look</p>
      </CardHeader>
      
      <CardContent className="h-[calc(100%-120px)]">
        <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
          {/* Sample video frame background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm opacity-70">Sample Video Frame</p>
            </div>
          </div>
          
          {/* Caption overlay */}
          <div style={captionStyle}>
            {displayText}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}