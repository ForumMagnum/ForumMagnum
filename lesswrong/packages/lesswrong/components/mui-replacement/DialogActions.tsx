import React from 'react';

interface DialogActionsProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disableSpacing?: boolean;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI DialogActions component
 */
const DialogActions = ({
  children,
  className = '',
  style = {},
  disableSpacing = false,
  ...rest
}: DialogActionsProps) => {
  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: '0 0 auto',
    padding: disableSpacing ? '8px 0' : '8px',
    ...style
  };

  return (
    <div
      className={`mui-replacement-dialog-actions ${className}`}
      style={baseStyle}
      {...rest}
    >
      {/* Apply spacing directly to the container instead of cloning children */}
      <div style={{ display: 'flex', gap: disableSpacing ? 0 : '8px' }}>
        {children}
      </div>
    </div>
  );
};

export default DialogActions; 