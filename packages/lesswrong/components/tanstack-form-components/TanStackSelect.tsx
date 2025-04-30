import React from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import { TanStackMuiTextField } from './TanStackMuiTextField';
import type { TypedFieldApi } from './BaseAppForm';
import { ClearInput } from '../form-components/ClearInput';

interface SelectOption {
  label: string;
  value: string | number;
}

export const TanStackSelect = ({ field, defaultValue, options, label, hideClear }: {
  field: {
    name: TypedFieldApi<string | null>['name'];
    state: Pick<TypedFieldApi<string | null>['state'], 'value' | 'meta'>;
    handleChange: TypedFieldApi<string | null>['handleChange'];
    handleBlur: TypedFieldApi<string | null>['handleBlur'];
  };
  defaultValue?: string | number;
  options: SelectOption[] | readonly SelectOption[];
  label?: string;
  hideClear?: boolean;
}) => {
  const { MenuItem } = Components;

  return (<>
    <TanStackMuiTextField select field={field} label={label} defaultValue={defaultValue}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TanStackMuiTextField>
    {!hideClear && <ClearInput clearField={() => field.handleChange(null)} />}
  </>)
};
