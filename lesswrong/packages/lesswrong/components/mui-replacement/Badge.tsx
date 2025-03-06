import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  badgeContent?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'default' | 'error';
  invisible?: boolean;
  max?: number;
  showZero?: boolean;
  variant?: 'standard' | 'dot';
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Badge component
 */
const Badge = ({
  children,
  badgeContent,
  color = 'default',
  invisible = false,
  max = 99,
  showZero = false,
  variant = 'standard',
  className = '',
  style = {},
  ...rest
}: BadgeProps) => {
  // Determine if badge should be visible
  const shouldShowBadge = () => {
    if (invisible) return false;
    if (variant === 'dot') return true;
    if (badgeContent === 0) return showZero;
    return !!badgeContent;
  };

  // Format badge content
  const formattedContent = () => {
    if (variant === 'dot') return null;
    if (typeof badgeContent === 'number' && badgeContent > max) {
      return `${max}+`;
    }
    return badgeContent;
  };

  // Get badge color
  const getBadgeColor = () => {
    switch (color) {
      case 'primary':
        return '#2196f3';
      case 'secondary':
        return '#f50057';
      case 'error':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  // Basic styling
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    verticalAlign: 'middle',
    ...style
  };

  const badgeStyle: React.CSSProperties = {
    display: shouldShowBadge() ? 'flex' : 'none',
    position: 'absolute',
    top: 0,
    right: 0,
    transform: 'translate(50%, -50%)',
    transformOrigin: '100% 0%',
    zIndex: 1,
    backgroundColor: getBadgeColor(),
    color: '#fff',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: '0.75rem',
    minWidth: variant === 'dot' ? '8px' : '20px',
    height: variant === 'dot' ? '8px' : '20px',
    borderRadius: '10px',
    padding: variant === 'dot' ? 0 : '0 6px',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div 
      className={`mui-replacement-badge-container ${className}`} 
      style={containerStyle}
      {...rest}
    >
      {children}
      <div className="mui-replacement-badge" style={badgeStyle}>
        {formattedContent()}
      </div>
    </div>
  );
};

export default Badge; 