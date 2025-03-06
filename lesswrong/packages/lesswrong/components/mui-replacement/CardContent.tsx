import React from 'react';

interface CardContentProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI CardContent component
 */
const CardContent = ({
  children,
  className = '',
  style = {},
  ...rest
}: CardContentProps) => {
  // Basic styling
  const contentStyle: React.CSSProperties = {
    padding: '16px',
    ...style
  };

  return (
    <div 
      className={`mui-replacement-card-content ${className}`} 
      style={contentStyle}
      {...rest}
    >
      {children}
    </div>
  );
};

export default CardContent; 