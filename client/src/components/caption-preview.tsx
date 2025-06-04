import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";
import { useCaptionOptions } from "@/hooks/useCaptionOptions";
import type { CaptionOptions } from "@shared/schema";

export function CaptionPreview() {
  // Use shared caption options state for real-time updates
  const { captionOptions } = useCaptionOptions();

  // Create different text displays based on caption style
  const words = "This is how your captions will look!".split(" ");
  
  const renderCaptionContent = () => {
    const lines = [];
    for (let i = 0; i < words.length; i += captionOptions.maxWordsPerLine) {
      lines.push(words.slice(i, i + captionOptions.maxWordsPerLine).join(" "));
    }
    
    const baseText = captionOptions.allCaps ? lines.join("\n").toUpperCase() : lines.join("\n");
    
    switch (captionOptions.style) {
      case 'classic':
        // Regular captioning with all text displayed at once
        return <span>{baseText}</span>;
        
      case 'karaoke':
        // Highlights words sequentially in a karaoke style
        return (
          <span>
            {words.map((word, index) => (
              <span 
                key={index}
                className={`${index === 2 ? 'bg-yellow-400 text-black px-1 rounded' : ''}`}
              >
                {captionOptions.allCaps ? word.toUpperCase() : word}
                {index < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        );
        
      case 'highlight':
        // Shows full text but highlights the current word
        return (
          <span>
            {words.map((word, index) => (
              <span 
                key={index}
                className={`${index === 2 ? 'bg-blue-500 text-white px-1 rounded' : ''}`}
              >
                {captionOptions.allCaps ? word.toUpperCase() : word}
                {index < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        );
        
      case 'underline':
        // Shows full text but underlines the current word
        return (
          <span>
            {words.map((word, index) => (
              <span 
                key={index}
                className={`${index === 2 ? 'underline decoration-2 underline-offset-2' : ''}`}
              >
                {captionOptions.allCaps ? word.toUpperCase() : word}
                {index < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        );
        
      case 'word_by_word':
        // Shows one word at a time
        return <span>{captionOptions.allCaps ? words[2].toUpperCase() : words[2]}</span>;
        
      default:
        return <span>{baseText}</span>;
    }
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      padding: '8px 16px',
      borderRadius: '4px',
      maxWidth: '80%',
      zIndex: 10,
      whiteSpace: 'pre-line' as const,
      // Use the alignment option for text justification
      textAlign: captionOptions.alignment as "left" | "center" | "right",
    };

    // Position controls where the caption block is placed
    switch (captionOptions.position) {
      case 'top_left':
        return { 
          ...baseStyles, 
          top: '10%', 
          left: '5px'
        };
      case 'top_center':
        return { 
          ...baseStyles, 
          top: '10%', 
          left: '50%', 
          transform: 'translateX(-50%)'
        };
      case 'top_right':
        return { 
          ...baseStyles, 
          top: '10%', 
          right: '5px'
        };
      case 'middle_left':
        return { 
          ...baseStyles, 
          top: '50%', 
          left: '5px', 
          transform: 'translateY(-50%)'
        };
      case 'middle_center':
        return { 
          ...baseStyles, 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)'
        };
      case 'middle_right':
        return { 
          ...baseStyles, 
          top: '50%', 
          right: '5px', 
          transform: 'translateY(-50%)'
        };
      case 'bottom_left':
        return { 
          ...baseStyles, 
          bottom: '10%', 
          left: '5px'
        };
      case 'bottom_right':
        return { 
          ...baseStyles, 
          bottom: '10%', 
          right: '5px'
        };
      case 'bottom_center':
      default:
        return { 
          ...baseStyles, 
          bottom: '10%', 
          left: '50%', 
          transform: 'translateX(-50%)'
        };
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
    background: captionOptions.style === 'classic' ? 'rgba(0,0,0,0.6)' : 'transparent',
    backdropFilter: captionOptions.style !== 'word_by_word' ? 'blur(2px)' : 'none',
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
            {renderCaptionContent()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}