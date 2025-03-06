import React from 'react';

interface FormControlLabelProps {
  control: React.ReactElement;
  label: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  labelPlacement?: 'end' | 'start' | 'top' | 'bottom';
  value?: any;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI FormControlLabel component
 */
const FormControlLabel = ({
  control,
  label,
  className = '',
  style = {},
  disabled = false,
  labelPlacement = 'end',
  value,
  ...rest
}: FormControlLabelProps) => {
  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: disabled ? 'default' : 'pointer',
    verticalAlign: 'middle',
    WebkitTapHighlightColor: 'transparent',
    marginLeft: -11,
    marginRight: 16,
    ...style
  };

  // Label style
  const labelStyle: React.CSSProperties = {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
    color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.87)',
    padding: labelPlacement === 'top' || labelPlacement === 'bottom' ? '0 0 8px 0' : '0 0 0 8px',
    order: labelPlacement === 'start' || labelPlacement === 'top' ? -1 : 1
  };

  // Container style based on label placement
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 
      labelPlacement === 'top' || labelPlacement === 'bottom' 
        ? 'column' 
        : 'row',
    alignItems: 
      labelPlacement === 'top' || labelPlacement === 'bottom' 
        ? 'center' 
        : 'inherit'
  };

  return (
    <label
      className={`mui-replacement-form-control-label ${className}`}
      style={baseStyle}
      {...rest}
    >
      <div style={containerStyle}>
        {/* Render the control as is, without cloning */}
        {control}
        <span style={labelStyle}>{label}</span>
      </div>
    </label>
  );
};

export default FormControlLabel; 