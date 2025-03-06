import React from 'react';

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'regular' | 'dense';
  disableGutters?: boolean;
  [key: string]: any; // For any other props
}

const Toolbar = ({
  children,
  className = '',
  style = {},
  variant = 'regular',
  disableGutters = false,
  ...rest
}: ToolbarProps) => {
  const toolbarStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minHeight: variant === 'regular' ? '64px' : '48px',
    padding: disableGutters ? 0 : '0 16px',
    ...style,
  };

  return (
    <div
      className={`mui-toolbar ${className}`}
      style={toolbarStyles}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Toolbar; 