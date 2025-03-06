import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  elevation?: number;
  variant?: 'elevation' | 'outlined';
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Card component
 */
const Card = ({
  children,
  elevation = 1,
  variant = 'elevation',
  className = '',
  style = {},
  ...rest
}: CardProps) => {
  // Calculate shadow based on elevation
  const getShadow = (elevation: number) => {
    if (elevation === 0) return 'none';
    if (elevation === 1) return '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)';
    if (elevation === 2) return '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)';
    if (elevation === 3) return '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)';
    if (elevation >= 4) return '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)';
    return 'none';
  };

  // Basic styling based on props
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    color: 'rgba(0, 0, 0, 0.87)',
    borderRadius: '4px',
    boxShadow: variant === 'outlined' ? 'none' : getShadow(elevation),
    border: variant === 'outlined' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
    overflow: 'hidden',
    ...style
  };

  return (
    <div 
      className={`mui-replacement-card ${className}`} 
      style={cardStyle}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card; 