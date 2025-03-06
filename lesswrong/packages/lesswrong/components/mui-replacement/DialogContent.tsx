import React from 'react';

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  dividers?: boolean;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI DialogContent component
 */
const DialogContent = ({
  children,
  className = '',
  style = {},
  dividers = false,
  ...rest
}: DialogContentProps) => {
  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    padding: '8px 24px',
    flex: '1 1 auto',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    borderTop: dividers ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
    borderBottom: dividers ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
    ...style
  };

  return (
    <div
      className={`mui-replacement-dialog-content ${className}`}
      style={baseStyle}
      {...rest}
    >
      {children}
    </div>
  );
};

export default DialogContent; 