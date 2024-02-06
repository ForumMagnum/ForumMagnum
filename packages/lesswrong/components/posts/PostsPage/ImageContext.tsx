// ImageContext.tsx
import React, { createContext, useContext, useState } from 'react';

export type ReviewWinnerImageInfo = {
  postId: string,
  imageId: string | null,
  splashArtImageUrl: string,
  splashArtImagePrompt: string | null,
}

const ImageContext = createContext<{
  imageInfo: ReviewWinnerImageInfo | undefined;
  setImageInfo: React.Dispatch<React.SetStateAction<ReviewWinnerImageInfo>>;
} | undefined>(undefined);

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within a ImageProvider');
  }
  return context;
};

export const ImageProvider: React.FC = ({ children }) => {
  const [imageInfo, setImageInfo] = useState<ReviewWinnerImageInfo | undefined>(undefined);
  
  return (
    <ImageContext.Provider value={{ imageInfo, setImageInfo }}>
      {children}
    </ImageContext.Provider>
  );
};
