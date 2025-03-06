import React from 'react';

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium';
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI IconButton component
 */
const IconButton = ({
  children,
  onClick,
  disabled = false,
  color = 'default',
  size = 'medium',
  className = '',
  style = {},
  ...rest
}: IconButtonProps) => {
  // Basic styling based on props
  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    outline: 0,
    border: 0,
    margin: 0,
    borderRadius: '50%',
    padding: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    verticalAlign: 'middle',
    textDecoration: 'none',
    color: 
      disabled 
        ? 'rgba(0, 0, 0, 0.26)' 
        : color === 'primary' 
          ? '#2196f3' 
          : color === 'secondary' 
            ? '#f50057' 
            : 'rgba(0, 0, 0, 0.54)',
    width: size === 'small' ? '34px' : '48px',
    height: size === 'small' ? '34px' : '48px',
    opacity: disabled ? 0.5 : 1,
    transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    ...style
  };

  return (
    <button
      className={`mui-replacement-icon-button ${className}`}
      style={buttonStyle}
      disabled={disabled}
      onClick={onClick}
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
};

export default IconButton; 