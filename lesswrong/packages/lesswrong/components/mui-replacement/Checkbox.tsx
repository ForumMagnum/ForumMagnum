import React from 'react';

interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'default';
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  id?: string;
  required?: boolean;
  value?: string;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Checkbox component
 */
const Checkbox = ({
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  color = 'primary',
  className = '',
  style = {},
  name,
  id,
  required = false,
  value,
  ...rest
}: CheckboxProps) => {
  // Basic styling based on props
  const checkboxStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    accentColor: color === 'primary' ? '#2196f3' : color === 'secondary' ? '#f50057' : undefined,
    ...style
  };

  return (
    <input
      type="checkbox"
      id={id}
      name={name}
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={onChange}
      disabled={disabled}
      style={checkboxStyle}
      className={`mui-replacement-checkbox ${className}`}
      required={required}
      value={value}
      {...rest}
    />
  );
};

export default Checkbox; 