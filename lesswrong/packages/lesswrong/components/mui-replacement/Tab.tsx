import React from 'react';

interface TabProps {
  children?: React.ReactNode;
  label?: React.ReactNode;
  value?: any;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  selected?: boolean;
  onChange?: (event: React.ChangeEvent<{}>, value: number) => void;
  index?: number;
  textColor?: 'primary' | 'secondary' | 'inherit';
  indicatorColor?: 'primary' | 'secondary';
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Tab component
 */
const Tab = ({
  children,
  label,
  value,
  disabled = false,
  className = '',
  style = {},
  selected = false,
  onChange,
  index = 0,
  textColor = 'inherit',
  indicatorColor = 'primary',
  ...rest
}: TabProps) => {
  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    padding: '12px 16px',
    minWidth: '90px',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: selected ? 500 : 400,
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    color: 
      selected 
        ? textColor === 'primary' 
          ? '#2196f3' 
          : textColor === 'secondary' 
            ? '#f50057' 
            : 'inherit'
        : 'rgba(0, 0, 0, 0.6)',
    position: 'relative',
    ...style
  };

  // Indicator style (the line under the selected tab)
  const indicatorStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '2px',
    backgroundColor: 
      indicatorColor === 'primary' 
        ? '#2196f3' 
        : '#f50057',
    display: selected ? 'block' : 'none'
  };

  // Handle click
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled && onChange) {
      onChange(event as unknown as React.ChangeEvent<{}>, index);
    }
  };

  return (
    <div
      className={`mui-replacement-tab ${className}`}
      style={baseStyle}
      onClick={handleClick}
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      {...rest}
    >
      {label || children}
      <div style={indicatorStyle} />
    </div>
  );
};

export default Tab; 