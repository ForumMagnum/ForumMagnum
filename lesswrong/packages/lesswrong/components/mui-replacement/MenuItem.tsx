import React from 'react';

interface MenuItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  dense?: boolean;
  disableGutters?: boolean;
  divider?: boolean;
  selected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLLIElement>) => void;
  [key: string]: any; // For any other props
}

const MenuItem = ({
  children,
  className = '',
  style = {},
  disabled = false,
  dense = false,
  disableGutters = false,
  divider = false,
  selected = false,
  onClick,
  ...rest
}: MenuItemProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(event);
    }
  };

  const menuItemStyles: React.CSSProperties = {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem',
    lineHeight: '1.5',
    letterSpacing: '0.00938em',
    padding: dense ? '4px 16px' : '6px 16px',
    position: 'relative',
    cursor: disabled ? 'default' : 'pointer',
    outline: 0,
    userSelect: 'none',
    borderRadius: 0,
    verticalAlign: 'middle',
    justifyContent: 'flex-start',
    textDecoration: 'none',
    backgroundColor: selected 
      ? 'rgba(0, 0, 0, 0.08)' 
      : isHovered && !disabled 
        ? 'rgba(0, 0, 0, 0.04)' 
        : 'transparent',
    color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.87)',
    ...(disableGutters ? { padding: 0 } : {}),
    ...(divider ? { borderBottom: '1px solid rgba(0, 0, 0, 0.12)' } : {}),
    ...style,
  };

  return (
    <li
      className={`mui-menu-item ${className}`}
      style={menuItemStyles}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...rest}
    >
      {children}
    </li>
  );
};

export default MenuItem; 