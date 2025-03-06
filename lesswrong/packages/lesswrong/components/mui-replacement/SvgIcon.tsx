import React from 'react';

interface SvgIconProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  color?: 'inherit' | 'primary' | 'secondary' | 'action' | 'disabled' | 'error';
  fontSize?: 'inherit' | 'default' | 'small' | 'large';
  htmlColor?: string;
  titleAccess?: string;
  viewBox?: string;
  [key: string]: any; // For any other props
}

const SvgIcon = ({
  children,
  className = '',
  style = {},
  color = 'inherit',
  fontSize = 'default',
  htmlColor,
  titleAccess,
  viewBox = '0 0 24 24',
  ...rest
}: SvgIconProps) => {
  const getColorStyles = () => {
    const colorMap = {
      inherit: 'inherit',
      primary: '#1976d2',
      secondary: '#dc004e',
      action: 'rgba(0, 0, 0, 0.54)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      error: '#f44336',
    };
    
    return { fill: htmlColor || colorMap[color] || 'currentColor' };
  };

  const getFontSizeStyles = () => {
    const fontSizeMap = {
      inherit: 'inherit',
      default: '1.5rem',
      small: '1.25rem',
      large: '2.1875rem',
    };
    
    return { fontSize: fontSizeMap[fontSize] };
  };

  const svgStyles: React.CSSProperties = {
    userSelect: 'none',
    width: '1em',
    height: '1em',
    display: 'inline-block',
    flexShrink: 0,
    ...getFontSizeStyles(),
    ...getColorStyles(),
    ...style,
  };

  return (
    <svg
      className={`mui-svg-icon ${className}`}
      style={svgStyles}
      viewBox={viewBox}
      aria-hidden={titleAccess ? 'false' : 'true'}
      role={titleAccess ? 'img' : undefined}
      {...rest}
    >
      {titleAccess ? <title>{titleAccess}</title> : null}
      {children}
    </svg>
  );
};

export default SvgIcon; 