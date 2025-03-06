import React from 'react';

interface ChipProps {
  label: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  color?: 'primary' | 'secondary' | 'default';
  disabled?: boolean;
  size?: 'small' | 'medium';
  variant?: 'default' | 'outlined';
  avatar?: React.ReactElement;
  icon?: React.ReactElement;
  deleteIcon?: React.ReactElement;
  onDelete?: (event: React.MouseEvent<HTMLElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Chip component
 */
const Chip = ({
  label,
  className = '',
  style = {},
  color = 'default',
  disabled = false,
  size = 'medium',
  variant = 'default',
  avatar,
  icon,
  deleteIcon,
  onDelete,
  onClick,
  ...rest
}: ChipProps) => {
  // Handle click
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (onClick) {
      onClick(event);
    }
  };

  // Handle delete
  const handleDelete = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (disabled) return;
    if (onDelete) {
      onDelete(event);
    }
  };

  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: size === 'small' ? '24px' : '32px',
    borderRadius: '16px',
    padding: size === 'small' ? '0 8px' : '0 12px',
    fontSize: size === 'small' ? '0.75rem' : '0.8125rem',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00714em',
    backgroundColor: 
      variant === 'outlined' 
        ? 'transparent' 
        : disabled 
          ? 'rgba(0, 0, 0, 0.12)' 
          : color === 'primary' 
            ? 'rgba(33, 150, 243, 0.12)' 
            : color === 'secondary' 
              ? 'rgba(245, 0, 87, 0.12)' 
              : 'rgba(0, 0, 0, 0.08)',
    color: 
      disabled 
        ? 'rgba(0, 0, 0, 0.38)' 
        : color === 'primary' 
          ? '#2196f3' 
          : color === 'secondary' 
            ? '#f50057' 
            : 'rgba(0, 0, 0, 0.87)',
    border: 
      variant === 'outlined' 
        ? `1px solid ${
            disabled 
              ? 'rgba(0, 0, 0, 0.12)' 
              : color === 'primary' 
                ? '#2196f3' 
                : color === 'secondary' 
                  ? '#f50057' 
                  : 'rgba(0, 0, 0, 0.23)'
          }` 
        : 'none',
    cursor: onClick && !disabled ? 'pointer' : 'default',
    userSelect: 'none',
    transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    ...style
  };

  // Avatar/icon style
  const avatarStyle: React.CSSProperties = {
    display: 'flex',
    marginLeft: '-8px',
    marginRight: '4px',
    width: size === 'small' ? '18px' : '24px',
    height: size === 'small' ? '18px' : '24px',
    color: 'inherit',
    fontSize: size === 'small' ? '0.75rem' : '1rem'
  };

  // Delete icon style
  const deleteIconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '-6px',
    marginLeft: '4px',
    width: size === 'small' ? '16px' : '22px',
    height: size === 'small' ? '16px' : '22px',
    color: 'inherit',
    opacity: 0.7,
    cursor: 'pointer'
  };

  // Default delete icon
  const defaultDeleteIcon = (
    <div 
      style={deleteIconStyle} 
      onClick={handleDelete}
      onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
    >
      ✕
    </div>
  );

  return (
    <div
      className={`mui-replacement-chip ${className}`}
      style={baseStyle}
      onClick={onClick ? handleClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      {...rest}
    >
      {avatar && <div style={avatarStyle}>{avatar}</div>}
      {icon && !avatar && <div style={avatarStyle}>{icon}</div>}
      <span>{label}</span>
      {onDelete && (deleteIcon || defaultDeleteIcon)}
    </div>
  );
};

export default Chip; 