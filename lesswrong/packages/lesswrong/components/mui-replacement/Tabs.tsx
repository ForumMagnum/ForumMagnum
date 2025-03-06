import React, { useState, useEffect } from 'react';

interface TabsProps {
  children: React.ReactNode;
  value?: number;
  onChange?: (event: React.ChangeEvent<{}>, value: number) => void;
  indicatorColor?: 'primary' | 'secondary';
  textColor?: 'primary' | 'secondary' | 'inherit';
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  centered?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Tabs component
 */
const Tabs = ({
  children,
  value = 0,
  onChange,
  indicatorColor = 'primary',
  textColor = 'inherit',
  variant = 'standard',
  centered = false,
  className = '',
  style = {},
  ...rest
}: TabsProps) => {
  const [selectedTab, setSelectedTab] = useState(value);

  // Update selected tab when value prop changes
  useEffect(() => {
    setSelectedTab(value);
  }, [value]);

  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    width: '100%',
    justifyContent: centered ? 'center' : 'flex-start',
    overflowX: variant === 'scrollable' ? 'auto' : 'hidden',
    ...style
  };

  // Handle tab change
  const handleTabChange = (event: React.ChangeEvent<{}>, index: number) => {
    setSelectedTab(index);
    if (onChange) {
      onChange(event, index);
    }
  };

  // Clone children (Tab components) with additional props
  const enhancedChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    
    return React.cloneElement(child, {
      selected: index === selectedTab,
      onChange: handleTabChange,
      index,
      textColor,
      indicatorColor
    });
  });

  return (
    <div 
      className={`mui-replacement-tabs ${className}`}
      style={baseStyle}
      {...rest}
    >
      {enhancedChildren}
    </div>
  );
};

export default Tabs; 