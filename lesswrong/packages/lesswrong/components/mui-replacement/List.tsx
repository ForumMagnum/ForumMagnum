import React from 'react';

interface ListProps {
  children: React.ReactNode;
  dense?: boolean;
  disablePadding?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI List component
 */
const List = ({
  children,
  dense = false,
  disablePadding = false,
  className = '',
  style = {},
  ...rest
}: ListProps) => {
  // Basic styling based on props
  const listStyle: React.CSSProperties = {
    margin: 0,
    padding: disablePadding ? 0 : '8px 0',
    position: 'relative',
    listStyle: 'none',
    ...style
  };

  return (
    <ul 
      className={`mui-replacement-list ${className}`} 
      style={listStyle}
      {...rest}
    >
      {children}
    </ul>
  );
};

export default List; 