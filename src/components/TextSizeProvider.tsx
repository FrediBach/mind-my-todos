"use client";

import { createContext, useContext, useEffect, useState } from "react";

type TextSize = "small" | "medium" | "large";

type TextSizeProviderProps = {
  children: React.ReactNode;
  defaultSize?: TextSize;
};

type TextSizeProviderState = {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
};

const initialState: TextSizeProviderState = {
  textSize: "medium",
  setTextSize: () => null,
};

const TextSizeProviderContext = createContext<TextSizeProviderState>(initialState);

export function TextSizeProvider({
  children,
  defaultSize = "medium",
  ...props
}: TextSizeProviderProps) {
  const [textSize, setTextSize] = useState<TextSize>(defaultSize);

  useEffect(() => {
    const savedSize = localStorage.getItem("textSize") as TextSize | null;
    if (savedSize) {
      setTextSize(savedSize);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all text size classes
    root.classList.remove("text-size-small", "text-size-medium", "text-size-large");
    
    // Add the current text size class
    root.classList.add(`text-size-${textSize}`);
    
    // Save to localStorage
    localStorage.setItem("textSize", textSize);
  }, [textSize]);

  const value = {
    textSize,
    setTextSize: (size: TextSize) => {
      setTextSize(size);
    },
  };

  return (
    <TextSizeProviderContext.Provider {...props} value={value}>
      {children}
    </TextSizeProviderContext.Provider>
  );
}

export const useTextSize = () => {
  const context = useContext(TextSizeProviderContext);

  if (context === undefined) {
    throw new Error("useTextSize must be used within a TextSizeProvider");
  }

  return context;
};