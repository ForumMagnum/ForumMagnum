import React, { createContext, PropsWithChildren, useContext, useState } from 'react';

export type ReviewWinnerImageInfo = {
  postId: string,
  _id: string,
  splashArtImageUrl: string,
  splashArtImagePrompt: string | null,
}

const ImageContext = createContext<{
  selectedImageInfo: ReviewWinnerImageInfo | undefined;
  setImageInfo: React.Dispatch<React.SetStateAction<ReviewWinnerImageInfo>>;
} | undefined>(undefined);

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within a ImageProvider');
  }
  return context;
};

export const ImageProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [selectedImageInfo, setImageInfo] = useState<ReviewWinnerImageInfo | undefined>(undefined);
  
  return (
    <ImageContext.Provider value={{ selectedImageInfo, setImageInfo }}>
      {children}
    </ImageContext.Provider>
  );
};
