import React from 'react';

interface ListItemProps {
  children: React.ReactNode;
  button?: boolean;
  dense?: boolean;
  disabled?: boolean;
  divider?: boolean;
  selected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLLIElement | HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI ListItem component
 */
const ListItem = ({
  children,
  button = false,
  dense = false,
  disabled = false,
  divider = false,
  selected = false,
  onClick,
  className = '',
  style = {},
  ...rest
}: ListItemProps) => {
  // Basic styling based on props
  const listItemStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    position: 'relative',
    boxSizing: 'border-box',
    textAlign: 'left',
    alignItems: 'center',
    paddingTop: dense ? '4px' : '8px',
    paddingBottom: dense ? '4px' : '8px',
    paddingLeft: '16px',
    paddingRight: '16px',
    cursor: button && !disabled ? 'pointer' : 'default',
    backgroundColor: selected ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
    borderBottom: divider ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
    opacity: disabled ? 0.5 : 1,
    ...style
  };

  const Component = button ? 'div' : 'li';

  return (
    <Component 
      className={`mui-replacement-list-item ${className}`} 
      style={listItemStyle}
      onClick={!disabled ? onClick : undefined}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default ListItem; 