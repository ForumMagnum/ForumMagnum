import React from 'react';

interface TextFieldProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  variant?: 'standard' | 'outlined' | 'filled';
  type?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI TextField component
 */
const TextField = ({
  label,
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  fullWidth = false,
  multiline = false,
  rows = 1,
  variant = 'standard',
  type = 'text',
  className = '',
  style = {},
  name,
  id,
  required = false,
  autoFocus = false,
  ...rest
}: TextFieldProps) => {
  // Basic styling based on props
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
    margin: '8px 0',
    ...style
  };

  const labelStyle: React.CSSProperties = {
    color: error ? '#f44336' : disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
    fontSize: '1rem',
    marginBottom: '4px',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  };

  const inputStyle: React.CSSProperties = {
    padding: variant === 'outlined' ? '14px' : '8px 0',
    border: variant === 'outlined' 
      ? error 
        ? '1px solid #f44336' 
        : '1px solid rgba(0, 0, 0, 0.23)' 
      : variant === 'filled' 
        ? 'none' 
        : error 
          ? '0 0 1px 0 #f44336' 
          : '0 0 1px 0 rgba(0, 0, 0, 0.42)',
    borderRadius: variant === 'outlined' ? '4px' : '0',
    backgroundColor: variant === 'filled' ? 'rgba(0, 0, 0, 0.09)' : 'transparent',
    fontSize: '1rem',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.87)',
    width: '100%',
    outline: 'none',
  };

  const helperTextStyle: React.CSSProperties = {
    color: error ? '#f44336' : 'rgba(0, 0, 0, 0.6)',
    fontSize: '0.75rem',
    marginTop: '3px',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  };

  return (
    <div 
      className={`mui-replacement-textfield ${className}`} 
      style={containerStyle}
    >
      {label && (
        <label 
          htmlFor={id} 
          style={labelStyle}
        >
          {label}{required && ' *'}
        </label>
      )}
      
      {multiline ? (
        <textarea
          id={id}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange as any}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          style={inputStyle}
          required={required}
          autoFocus={autoFocus}
          {...rest}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
          required={required}
          autoFocus={autoFocus}
          {...rest}
        />
      )}
      
      {helperText && (
        <div style={helperTextStyle}>
          {helperText}
        </div>
      )}
    </div>
  );
};

export default TextField; 