import { createContext, useContext, useState, ReactNode } from 'react';
import type { CaptionOptions } from '@shared/schema';

interface CaptionOptionsContextType {
  captionOptions: CaptionOptions;
  updateCaptionOption: <K extends keyof CaptionOptions>(
    key: K,
    value: CaptionOptions[K]
  ) => void;
}

const CaptionOptionsContext = createContext<CaptionOptionsContextType | undefined>(undefined);

export function CaptionOptionsProvider({ children }: { children: ReactNode }) {
  const [captionOptions, setCaptionOptions] = useState<CaptionOptions>({
    language: "auto",
    lineColor: "#ffffff",
    wordColor: "#ffffff", 
    outlineColor: "#000000",
    allCaps: false,
    maxWordsPerLine: 3,
    position: "bottom_center",
    alignment: "center",
    fontFamily: "Arial",
    fontSize: 24,
    bold: false,
    italic: false,
    strikeout: false,
    style: "highlight",
    outputType: "burned-in",
    saveAsDefault: false,
  });

  const updateCaptionOption = <K extends keyof CaptionOptions>(
    key: K,
    value: CaptionOptions[K]
  ) => {
    setCaptionOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <CaptionOptionsContext.Provider value={{ captionOptions, updateCaptionOption }}>
      {children}
    </CaptionOptionsContext.Provider>
  );
}

export function useCaptionOptions() {
  const context = useContext(CaptionOptionsContext);
  if (context === undefined) {
    throw new Error('useCaptionOptions must be used within a CaptionOptionsProvider');
  }
  return context;
}