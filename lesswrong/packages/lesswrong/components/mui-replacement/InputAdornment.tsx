import React from 'react';

interface InputAdornmentProps {
  children: React.ReactNode;
  position?: 'start' | 'end';
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI InputAdornment component
 */
const InputAdornment = ({
  children,
  position = 'start',
  className = '',
  style = {},
  ...rest
}: InputAdornmentProps) => {
  // Basic styling based on props
  const adornmentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '0.01em',
    maxHeight: '2em',
    whiteSpace: 'nowrap',
    margin: position === 'start' ? '0 8px 0 0' : '0 0 0 8px',
    color: 'rgba(0, 0, 0, 0.54)',
    ...style
  };

  return (
    <div 
      className={`mui-replacement-input-adornment mui-replacement-input-adornment-${position} ${className}`} 
      style={adornmentStyle}
      {...rest}
    >
      {children}
    </div>
  );
};

export default InputAdornment; 