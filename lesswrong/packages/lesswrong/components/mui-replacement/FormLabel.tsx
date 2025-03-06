import React from 'react';

interface FormLabelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  error?: boolean;
  focused?: boolean;
  required?: boolean;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI FormLabel component
 */
const FormLabel = ({
  children,
  className = '',
  style = {},
  disabled = false,
  error = false,
  focused = false,
  required = false,
  ...rest
}: FormLabelProps) => {
  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
    color: disabled ? 'rgba(0, 0, 0, 0.38)' : error ? '#f44336' : focused ? '#2196f3' : 'rgba(0, 0, 0, 0.54)',
    padding: 0,
    ...style
  };

  return (
    <label
      className={`mui-replacement-form-label ${className}`}
      style={baseStyle}
      {...rest}
    >
      {children}
      {required && <span style={{ color: error ? '#f44336' : '#f44336', marginLeft: '4px' }}>*</span>}
    </label>
  );
};

export default FormLabel; 