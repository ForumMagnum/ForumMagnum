import React from 'react';

interface InputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  type?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
  endAdornment?: React.ReactNode;
  startAdornment?: React.ReactNode;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Input component
 */
const Input = ({
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  fullWidth = false,
  multiline = false,
  rows = 1,
  type = 'text',
  className = '',
  style = {},
  name,
  id,
  required = false,
  autoFocus = false,
  endAdornment,
  startAdornment,
  ...rest
}: InputProps) => {
  // Basic styling based on props
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 0',
    border: error ? '0 0 1px 0 #f44336' : '0 0 1px 0 rgba(0, 0, 0, 0.42)',
    borderRadius: '0',
    backgroundColor: 'transparent',
    fontSize: '1rem',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.87)',
    width: '100%',
    outline: 'none',
  };

  return (
    <div 
      className={`mui-replacement-input ${className}`} 
      style={containerStyle}
    >
      {startAdornment && (
        <div className="mui-replacement-input-start-adornment">
          {startAdornment}
        </div>
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
      
      {endAdornment && (
        <div className="mui-replacement-input-end-adornment">
          {endAdornment}
        </div>
      )}
    </div>
  );
};

export default Input; 