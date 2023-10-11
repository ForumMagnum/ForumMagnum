import React from 'react';

type AllowedInputTypes = 'password' | 'text' | 'number' | 'tel';

type InputProps = Required<
  Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    | 'value'
    | 'onChange'
    | 'onFocus'
    | 'onBlur'
    | 'onKeyDown'
    | 'onPaste'
    | 'aria-label'
    | 'maxLength'
    | 'autoComplete'
    | 'inputMode'
    | 'onInput'
  > & {
    ref: React.RefCallback<HTMLInputElement>;
    placeholder: string | undefined;
    className: string | undefined;
    type: AllowedInputTypes;
  }
>;

interface OTPInputProps {
  /** Value of the OTP input */
  value?: string;
  /** Number of OTP inputs to be rendered */
  numInputs?: number;
  /** Callback to be called when the OTP value changes */
  onChange: (otp: string) => void;
  /** Callback to be called when pasting content into the component */
  onPaste?: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  /** Function to render the input */
  renderInput: (inputProps: InputProps, index: number) => React.ReactNode;
  /** Whether the first input should be auto focused */
  shouldAutoFocus?: boolean;
  /** Placeholder for the inputs */
  placeholder?: string;
  /** Function to render the separator */
  renderSeparator?: ((index: number) => React.ReactNode) | React.ReactNode;
  /** Style for the container */
  containerStyle?: React.CSSProperties | string;
  /** Style for the input */
  inputStyle?: React.CSSProperties | string;
  /** The type that will be passed to the input being rendered */
  inputType?: AllowedInputTypes;
}

const isStyleObject = (obj: unknown) => typeof obj === 'object' && obj !== null;

const OTPInput = ({
  value = '',
  numInputs = 4,
  onChange,
  onPaste,
  renderInput,
  shouldAutoFocus = false,
  inputType = 'text',
  renderSeparator,
  placeholder,
  containerStyle,
  inputStyle,
}: OTPInputProps) => {
  const [activeInput, setActiveInput] = React.useState(0);
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  const getOTPValue = () => (value ? value.toString().split('') : []);

  const isInputNum = inputType === 'number' || inputType === 'tel';

  React.useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, numInputs);
  }, [numInputs]);

  React.useEffect(() => {
    if (shouldAutoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [shouldAutoFocus]);

  const getPlaceholderValue = () => {
    if (typeof placeholder === 'string') {
      if (placeholder.length === numInputs) {
        return placeholder;
      }

      if (placeholder.length > 0) {
        console.error('Length of the placeholder should be equal to the number of inputs.');
      }
    }
    return undefined;
  };

  const isInputValueValid = (value: string) => {
    const isTypeValid = isInputNum ? !isNaN(Number(value)) : typeof value === 'string';
    return isTypeValid && value.trim().length === 1;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    if (isInputValueValid(value)) {
      changeCodeAtFocus(value);
      focusInput(activeInput + 1);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { nativeEvent } = event;
    if (!isInputValueValid(event.target.value)) {
      // @ts-expect-error - This was added previosly to handle and edge case
      // for dealing with keyCode "229 Unidentified" on Android. Check if this is
      // still needed.
      if (nativeEvent.data === null && nativeEvent.inputType === 'deleteContentBackward') {
        event.preventDefault();
        changeCodeAtFocus('');
        focusInput(activeInput - 1);
      }
      // Clear the input if it's not valid value because firefox allows
      // pasting non-numeric characters in a number type input
      event.target.value = '';
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => (index: number) => {
    setActiveInput(index);
    event.target.select();
  };

  const handleBlur = () => {
    setActiveInput(activeInput - 1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const otp = getOTPValue();
    if ([event.code, event.key].includes('Backspace')) {
      event.preventDefault();
      changeCodeAtFocus('');
      focusInput(activeInput - 1);
    } else if (event.code === 'Delete') {
      event.preventDefault();
      changeCodeAtFocus('');
    } else if (event.code === 'ArrowLeft') {
      event.preventDefault();
      focusInput(activeInput - 1);
    } else if (event.code === 'ArrowRight') {
      event.preventDefault();
      focusInput(activeInput + 1);
    }
    // React does not trigger onChange when the same value is entered
    // again. So we need to focus the next input manually in this case.
    else if (event.key === otp[activeInput]) {
      event.preventDefault();
      focusInput(activeInput + 1);
    } else if (
      event.code === 'Spacebar' ||
      event.code === 'Space' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowDown'
    ) {
      event.preventDefault();
    }
  };

  const focusInput = (index: number) => {
    const activeInput = Math.max(Math.min(numInputs - 1, index), 0);

    if (inputRefs.current[activeInput]) {
      inputRefs.current[activeInput]?.focus();
      inputRefs.current[activeInput]?.select();
      setActiveInput(activeInput);
    }
  };

  const changeCodeAtFocus = (value: string) => {
    const otp = getOTPValue();
    otp[activeInput] = value[0];
    handleOTPChange(otp);
  };

  const handleOTPChange = (otp: Array<string>) => {
    const otpValue = otp.join('');
    onChange(otpValue);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const otp = getOTPValue();
    let nextActiveInput = activeInput;

    // Get pastedData in an array of max size (num of inputs - current position)
    const pastedData = event.clipboardData
      .getData('text/plain')
      .slice(0, numInputs - activeInput)
      .split('');

    // Prevent pasting if the clipboard data contains non-numeric values for number inputs
    if (isInputNum && pastedData.some((value) => isNaN(Number(value)))) {
      return;
    }

    // Paste data from focused input onwards
    for (let pos = 0; pos < numInputs; ++pos) {
      if (pos >= activeInput && pastedData.length > 0) {
        otp[pos] = pastedData.shift() ?? '';
        nextActiveInput++;
      }
    }

    focusInput(nextActiveInput);
    handleOTPChange(otp);
  };

  return (
    <div
      style={Object.assign({ display: 'flex', alignItems: 'center' }, isStyleObject(containerStyle) && containerStyle)}
      className={typeof containerStyle === 'string' ? containerStyle : undefined}
      onPaste={onPaste}
    >
      {Array.from({ length: numInputs }, (_, index) => index).map((index) => (
        <React.Fragment key={index}>
          {renderInput(
            {
              value: getOTPValue()[index] ?? '',
              placeholder: getPlaceholderValue()?.[index] ?? undefined,
              ref: (element) => (inputRefs.current[index] = element),
              onChange: handleChange,
              onFocus: (event) => handleFocus(event)(index),
              onBlur: handleBlur,
              onKeyDown: handleKeyDown,
              onPaste: handlePaste,
              autoComplete: 'off',
              maxLength: 1,
              'aria-label': `Please enter OTP character ${index + 1}`,
              className: typeof inputStyle === 'string' ? inputStyle : undefined,
              type: inputType,
              inputMode: isInputNum ? 'numeric' : 'text',
              onInput: handleInputChange,
            },
            index
          )}
          {index < numInputs - 1 && (typeof renderSeparator === 'function' ? renderSeparator(index) : renderSeparator)}
        </React.Fragment>
      ))}
    </div>
  );
};

export type { OTPInputProps, InputProps, AllowedInputTypes };
export default OTPInput;