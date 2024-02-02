// ImageContext.tsx
import React, { createContext, useContext, useState } from 'react';

const ImageContext = createContext<{
  imageURL: string;
  setImageURL: React.Dispatch<React.SetStateAction<string>>;
} | undefined>(undefined);

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within a ImageProvider');
  }
  return context;
};

export const ImageProvider: React.FC = ({ children }) => {
  const [imageURL, setImageURL] = useState<string>('');
  console.log('imageURL set: ', imageURL)
  return (
    <ImageContext.Provider value={{ imageURL, setImageURL }}>
      {children}
    </ImageContext.Provider>
  );
};
