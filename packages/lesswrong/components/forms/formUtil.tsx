import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

export interface LWForm<T> {
  currentValue: T,
  setCurrentValue: (newValue: T)=>void,
  onChange: ((change: Partial<T>)=>void) | null,
}

export function Form<T>({form, children}: {form: LWForm<T>, children: React.ReactNode}) {
  return <form>{children}</form>
}

export function useForm<N extends FragmentName, T=FragmentTypes[N]>({initialValue, fragmentName, onChange}: {
  initialValue: T,
  fragmentName: N,
  onChange?: (change: Partial<T>)=>void,
}): LWForm<T> 
{
  const [currentValue, setCurrentValue] = useState(initialValue);
  return {
    currentValue,
    setCurrentValue: (newValue: T)=>setCurrentValue(newValue),
    onChange: onChange||null,
  };
}

export function useFormComponentContext<FieldType,FormFragment>(form: LWForm<FormFragment>, fieldName: keyof FormFragment): {
  value: FieldType,
  setValue: (newValue: FieldType)=>void
} {
  return {
    value: form.currentValue[fieldName] as unknown as FieldType,
    setValue: (newValue: FieldType) => {
      const change = {[fieldName]: newValue} as unknown as Partial<FormFragment>;
      if (form.onChange) {
        form.onChange(change);
      }
      form.setCurrentValue({...form.currentValue, ...change});
    },
  };
}
