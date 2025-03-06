import React, { useContext, useEffect, useState } from 'react';

interface RadioProps {
  checked?: boolean;
  defaultChecked?: boolean;
  value?: any;
  name?: string;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium';
  className?: string;
  style?: React.CSSProperties;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Radio component
 */
const Radio = ({
  checked,
  defaultChecked = false,
  value,
  name,
  disabled = false,
  color = 'primary',
  size = 'medium',
  className = '',
  style = {},
  onChange,
  ...rest
}: RadioProps) => {
  // State for controlled/uncontrolled component
  const [isChecked, setIsChecked] = useState(checked !== undefined ? checked : defaultChecked);

  // Update checked state when checked prop changes
  useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  // Check if inside a RadioGroup
  const findRadioGroup = (element: HTMLElement | null): HTMLElement | null => {
    if (!element) return null;
    if (element.hasAttribute('data-radio-group-handler')) return element;
    return findRadioGroup(element.parentElement);
  };

  // Handle change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    
    // Only update internal state if it's uncontrolled
    if (checked === undefined) {
      setIsChecked(newChecked);
    }
    
    if (onChange) {
      onChange(event);
    }

    // Find RadioGroup parent and trigger its onChange
    const radioGroupElement = findRadioGroup(event.target.parentElement);
    if (radioGroupElement && radioGroupElement.hasAttribute('data-radio-group-handler')) {
      const radioGroupOnChange = (radioGroupElement as any).onChange;
      if (radioGroupOnChange && typeof radioGroupOnChange === 'function') {
        radioGroupOnChange(event);
      }
    }
  };

  // Get name from RadioGroup if not provided
  const getNameFromRadioGroup = (element: HTMLElement | null): string | undefined => {
    if (!element) return undefined;
    if (element.hasAttribute('data-radio-group-name')) {
      return element.getAttribute('data-radio-group-name') || undefined;
    }
    return getNameFromRadioGroup(element.parentElement);
  };

  // Check if this radio should be checked based on RadioGroup value
  const shouldBeCheckedFromRadioGroup = (element: HTMLElement | null): boolean => {
    if (!element) return false;
    if (element.hasAttribute('data-radio-group-value')) {
      const groupValue = element.getAttribute('data-radio-group-value');
      return groupValue === value;
    }
    return shouldBeCheckedFromRadioGroup(element.parentElement);
  };

  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    position: 'relative',
    padding: size === 'small' ? '4px' : '9px',
    cursor: disabled ? 'default' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style
  };

  // Radio button style
  const radioStyle: React.CSSProperties = {
    appearance: 'none',
    width: size === 'small' ? '16px' : '20px',
    height: size === 'small' ? '16px' : '20px',
    borderRadius: '50%',
    border: '2px solid',
    borderColor: 
      disabled 
        ? 'rgba(0, 0, 0, 0.26)' 
        : isChecked 
          ? color === 'primary' 
            ? '#2196f3' 
            : color === 'secondary' 
              ? '#f50057' 
              : '#2196f3'
          : 'rgba(0, 0, 0, 0.54)',
    position: 'relative',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    padding: 0,
    margin: 0
  };

  // Inner dot style
  const innerDotStyle: React.CSSProperties = {
    position: 'absolute',
    width: size === 'small' ? '8px' : '10px',
    height: size === 'small' ? '8px' : '10px',
    borderRadius: '50%',
    backgroundColor: 
      disabled 
        ? 'rgba(0, 0, 0, 0.26)' 
        : color === 'primary' 
          ? '#2196f3' 
          : color === 'secondary' 
            ? '#f50057' 
            : '#2196f3',
    transform: isChecked ? 'scale(1)' : 'scale(0)',
    transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    top: '50%',
    left: '50%',
    marginTop: size === 'small' ? '-4px' : '-5px',
    marginLeft: size === 'small' ? '-4px' : '-5px'
  };

  return (
    <div
      className={`mui-replacement-radio ${className}`}
      style={baseStyle}
      {...rest}
    >
      <input
        type="radio"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        value={value}
        name={name}
        style={radioStyle}
      />
      <div style={innerDotStyle} />
    </div>
  );
};

export default Radio; 