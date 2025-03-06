import React, { useState } from 'react';

interface OutlinedInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  rowsMax?: number;
  name?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI OutlinedInput component
 */
const OutlinedInput = ({
  value,
  defaultValue = '',
  placeholder = '',
  disabled = false,
  error = false,
  fullWidth = false,
  multiline = false,
  rows = 1,
  rowsMax,
  name,
  id,
  className = '',
  style = {},
  onChange,
  onFocus,
  onBlur,
  startAdornment,
  endAdornment,
  ...rest
}: OutlinedInputProps) => {
  const [focused, setFocused] = useState(false);

  // Handle focus
  const handleFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFocused(true);
    if (onFocus) {
      onFocus(event);
    }
  };

  // Handle blur
  const handleBlur = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFocused(false);
    if (onBlur) {
      onBlur(event);
    }
  };

  // Basic styling based on props
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  // Input style
  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '4px',
    border: `1px solid ${
      error 
        ? '#f44336' 
        : focused 
          ? '#2196f3' 
          : 'rgba(0, 0, 0, 0.23)'
    }`,
    backgroundColor: disabled ? 'rgba(0, 0, 0, 0.12)' : 'transparent',
    color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.87)',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem',
    lineHeight: '1.1875em',
    width: '100%',
    outline: 'none',
    transition: 'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    paddingLeft: startAdornment ? '36px' : '14px',
    paddingRight: endAdornment ? '36px' : '14px',
    resize: multiline ? 'vertical' : 'none'
  };

  // Adornment styles
  const startAdornmentStyle: React.CSSProperties = {
    position: 'absolute',
    left: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none'
  };

  const endAdornmentStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none'
  };

  // Render input or textarea based on multiline prop
  const renderInput = () => {
    const inputProps = {
      value,
      defaultValue,
      placeholder,
      disabled,
      name,
      id,
      onChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      style: inputStyle,
      ...rest
    };

    if (multiline) {
      return (
        <textarea 
          rows={rows}
          {...inputProps as any}
        />
      );
    } else {
      return (
        <input 
          type="text"
          {...inputProps}
        />
      );
    }
  };

  return (
    <div
      className={`mui-replacement-outlined-input ${className}`}
      style={containerStyle}
    >
      {startAdornment && (
        <div style={startAdornmentStyle}>
          {startAdornment}
        </div>
      )}
      {renderInput()}
      {endAdornment && (
        <div style={endAdornmentStyle}>
          {endAdornment}
        </div>
      )}
    </div>
  );
};

export default OutlinedInput; 