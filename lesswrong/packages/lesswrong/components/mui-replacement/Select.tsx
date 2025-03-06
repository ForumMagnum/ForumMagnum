import React from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: any;
  defaultValue?: any;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  multiple?: boolean;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
  displayEmpty?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Select component
 */
const Select = ({
  children,
  value,
  defaultValue,
  onChange,
  disabled = false,
  error = false,
  fullWidth = false,
  multiple = false,
  className = '',
  style = {},
  name,
  id,
  required = false,
  autoFocus = false,
  displayEmpty = false,
  variant = 'standard',
  ...rest
}: SelectProps) => {
  // Basic styling based on props
  const selectStyle: React.CSSProperties = {
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
    width: fullWidth ? '100%' : 'auto',
    outline: 'none',
    appearance: 'none',
    paddingRight: '24px', // Space for the dropdown arrow
    ...style
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: fullWidth ? '100%' : 'auto',
  };

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: 'rgba(0, 0, 0, 0.54)',
  };

  return (
    <div style={containerStyle} className={`mui-replacement-select-container ${className}`}>
      <select
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        style={selectStyle}
        required={required}
        autoFocus={autoFocus}
        multiple={multiple}
        className="mui-replacement-select"
        {...rest}
      >
        {displayEmpty && !multiple && (
          <option value="" disabled={!value && !defaultValue}>
            
          </option>
        )}
        {children}
      </select>
      <div style={arrowStyle}>▼</div>
    </div>
  );
};

export default Select; 