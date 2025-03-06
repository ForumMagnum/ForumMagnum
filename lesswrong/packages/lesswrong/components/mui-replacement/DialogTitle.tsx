import React from 'react';

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI DialogTitle component
 */
const DialogTitle = ({
  children,
  className = '',
  style = {},
  ...rest
}: DialogTitleProps) => {
  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    padding: '16px 24px',
    margin: 0,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.0075em',
    ...style
  };

  return (
    <div
      className={`mui-replacement-dialog-title ${className}`}
      style={baseStyle}
      {...rest}
    >
      {children}
    </div>
  );
};

export default DialogTitle; 