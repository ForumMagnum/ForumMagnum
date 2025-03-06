import React from 'react';

interface DividerProps {
  className?: string;
  style?: React.CSSProperties;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'fullWidth' | 'inset' | 'middle';
  light?: boolean;
  [key: string]: any; // For any other props
}

const Divider = ({
  className = '',
  style = {},
  orientation = 'horizontal',
  variant = 'fullWidth',
  light = false,
  ...rest
}: DividerProps) => {
  const dividerStyles: React.CSSProperties = {
    margin: 0,
    flexShrink: 0,
    borderWidth: 0,
    borderStyle: 'solid',
    borderBottomWidth: orientation === 'horizontal' ? 'thin' : 0,
    borderRightWidth: orientation === 'vertical' ? 'thin' : 0,
    borderColor: light ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.12)',
    width: orientation === 'vertical' ? 1 : '100%',
    height: orientation === 'vertical' ? 'auto' : 1,
    ...(variant === 'inset' && { marginLeft: 72 }),
    ...(variant === 'middle' && {
      marginLeft: 16,
      marginRight: 16,
      width: 'calc(100% - 32px)',
    }),
    ...style,
  };

  return (
    <hr
      className={`mui-divider ${className}`}
      style={dividerStyles}
      {...rest}
    />
  );
};

export default Divider; 