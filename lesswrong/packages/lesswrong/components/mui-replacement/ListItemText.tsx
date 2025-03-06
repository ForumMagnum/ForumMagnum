import React from 'react';

interface ListItemTextProps {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  inset?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI ListItemText component
 */
const ListItemText = ({
  primary,
  secondary,
  inset = false,
  className = '',
  style = {},
  ...rest
}: ListItemTextProps) => {
  // Basic styling
  const textStyle: React.CSSProperties = {
    flex: '1 1 auto',
    minWidth: 0,
    marginTop: '4px',
    marginBottom: '4px',
    paddingLeft: inset ? '56px' : '0',
    ...style
  };

  const primaryStyle: React.CSSProperties = {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem',
    lineHeight: '1.5',
    letterSpacing: '0.00938em',
    margin: 0,
    display: 'block',
  };

  const secondaryStyle: React.CSSProperties = {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.875rem',
    lineHeight: '1.43',
    letterSpacing: '0.01071em',
    color: 'rgba(0, 0, 0, 0.6)',
    margin: 0,
    display: 'block',
  };

  return (
    <div 
      className={`mui-replacement-list-item-text ${className}`} 
      style={textStyle}
      {...rest}
    >
      {primary && (
        <span className="mui-replacement-list-item-text-primary" style={primaryStyle}>
          {primary}
        </span>
      )}
      {secondary && (
        <span className="mui-replacement-list-item-text-secondary" style={secondaryStyle}>
          {secondary}
        </span>
      )}
    </div>
  );
};

export default ListItemText; 