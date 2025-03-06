import React from 'react';

interface ListItemIconProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI ListItemIcon component
 */
const ListItemIcon = ({
  children,
  className = '',
  style = {},
  ...rest
}: ListItemIconProps) => {
  // Basic styling
  const iconStyle: React.CSSProperties = {
    minWidth: '56px',
    color: 'rgba(0, 0, 0, 0.54)',
    display: 'inline-flex',
    flexShrink: 0,
    ...style
  };

  return (
    <div 
      className={`mui-replacement-list-item-icon ${className}`} 
      style={iconStyle}
      {...rest}
    >
      {children}
    </div>
  );
};

export default ListItemIcon; 