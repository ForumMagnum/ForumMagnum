import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'default';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Button component
 */
const Button = ({
  children,
  variant = 'contained',
  color = 'default',
  disabled = false,
  size = 'medium',
  fullWidth = false,
  onClick,
  className = '',
  style = {},
  type = 'button',
  ...rest
}: ButtonProps) => {
  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    padding: size === 'small' ? '4px 8px' : size === 'large' ? '12px 24px' : '8px 16px',
    width: fullWidth ? '100%' : 'auto',
    border: variant === 'outlined' ? '1px solid' : 'none',
    backgroundColor: 
      variant === 'contained' 
        ? color === 'primary' 
          ? '#2196f3' 
          : color === 'secondary' 
            ? '#f50057' 
            : '#e0e0e0'
        : 'transparent',
    color: 
      variant === 'contained' 
        ? color === 'default' 
          ? 'rgba(0, 0, 0, 0.87)' 
          : '#fff' 
        : color === 'primary' 
          ? '#2196f3' 
          : color === 'secondary' 
            ? '#f50057' 
            : 'rgba(0, 0, 0, 0.87)',
    borderRadius: '4px',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: size === 'small' ? '0.8125rem' : size === 'large' ? '0.9375rem' : '0.875rem',
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase',
    ...style
  };

  return (
    <button
      className={`mui-replacement-button ${className}`}
      style={baseStyle}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button; 