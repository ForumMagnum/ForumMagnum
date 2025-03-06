import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactElement;
  title: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  arrow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Tooltip component
 */
const Tooltip = ({
  children,
  title,
  placement = 'bottom',
  arrow = false,
  className = '',
  style = {},
  ...rest
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Calculate tooltip position
  const getTooltipPosition = (placement: string) => {
    switch (placement) {
      case 'top':
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' };
      default:
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
    }
  };

  // Basic styling
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    ...style
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1500,
    backgroundColor: 'rgba(97, 97, 97, 0.9)',
    color: '#fff',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    lineHeight: '1.4',
    maxWidth: '300px',
    wordWrap: 'break-word',
    visibility: isVisible ? 'visible' : 'hidden',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s',
    ...getTooltipPosition(placement)
  };

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: '0',
    height: '0',
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderBottom: arrow && placement === 'bottom' ? '5px solid rgba(97, 97, 97, 0.9)' : 'none',
    borderTop: arrow && placement === 'top' ? '5px solid rgba(97, 97, 97, 0.9)' : 'none',
    top: placement === 'bottom' && arrow ? '-5px' : 'auto',
    bottom: placement === 'top' && arrow ? '-5px' : 'auto',
    left: (placement === 'top' || placement === 'bottom') && arrow ? '50%' : 'auto',
    transform: (placement === 'top' || placement === 'bottom') && arrow ? 'translateX(-50%)' : 'none',
  };

  return (
    <div 
      className={`mui-replacement-tooltip-container ${className}`} 
      style={containerStyle}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      {...rest}
    >
      {children}
      {title && (
        <div className="mui-replacement-tooltip" style={tooltipStyle}>
          {arrow && <div style={arrowStyle} />}
          {title}
        </div>
      )}
    </div>
  );
};

export default Tooltip; 