// ImageContext.tsx
import React, { createContext, useContext, useState } from 'react';

const ImageContext = createContext<{
  imageURL: string | undefined;
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
  const [imageURL, setImageURL] = useState<string | undefined>(undefined);
    // tslint:disable-next-line:no-console
  console.log('imageURL set: ', imageURL)
  
  return (
    <ImageContext.Provider value={{ imageURL, setImageURL }}>
      {children}
    </ImageContext.Provider>
  );
};
