import React, { useState, useEffect } from 'react';

interface RadioGroupProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  value?: any;
  defaultValue?: any;
  name?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  row?: boolean;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI RadioGroup component
 */
const RadioGroup = ({
  children,
  className = '',
  style = {},
  value,
  defaultValue,
  name,
  onChange,
  row = false,
  ...rest
}: RadioGroupProps) => {
  // State for controlled/uncontrolled component
  const [selectedValue, setSelectedValue] = useState(value !== undefined ? value : defaultValue);

  // Update selected value when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Handle change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Only update internal state if it's uncontrolled
    if (value === undefined) {
      setSelectedValue(newValue);
    }
    
    if (onChange) {
      onChange(event, newValue);
    }
  };

  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: row ? 'row' : 'column',
    ...style
  };

  return (
    <div
      className={`mui-replacement-radio-group ${className}`}
      style={baseStyle}
      role="radiogroup"
      {...rest}
    >
      {/* Pass the context through data attributes instead of cloning */}
      <div 
        data-radio-group-name={name}
        data-radio-group-value={selectedValue}
        data-radio-group-handler="true"
        onChange={handleChange as any}
      >
        {children}
      </div>
    </div>
  );
};

export default RadioGroup; 