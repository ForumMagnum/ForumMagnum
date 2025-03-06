import React from 'react';

interface InputLabelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  shrink?: boolean;
  focused?: boolean;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  htmlFor?: string;
  [key: string]: any; // For any other props
}

const InputLabel = ({
  children,
  className = '',
  style = {},
  shrink = false,
  focused = false,
  error = false,
  required = false,
  disabled = false,
  htmlFor,
  ...rest
}: InputLabelProps) => {
  const labelStyles: React.CSSProperties = {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem',
    lineHeight: '1.4375em',
    letterSpacing: '0.00938em',
    padding: 0,
    position: 'relative',
    display: 'block',
    transformOrigin: 'top left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    transition: 'color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms, transform 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms',
    transform: shrink ? 'translate(0, -1.5px) scale(0.75)' : 'translate(0, 0) scale(1)',
    color: focused 
      ? '#1976d2' 
      : error 
        ? '#d32f2f' 
        : disabled 
          ? 'rgba(0, 0, 0, 0.38)' 
          : 'rgba(0, 0, 0, 0.6)',
    ...style,
  };

  return (
    <label
      className={`mui-input-label ${className}`}
      style={labelStyles}
      htmlFor={htmlFor}
      {...rest}
    >
      {children}
      {required && <span style={{ color: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.6)', marginLeft: '4px' }}>*</span>}
    </label>
  );
};

export default InputLabel; 