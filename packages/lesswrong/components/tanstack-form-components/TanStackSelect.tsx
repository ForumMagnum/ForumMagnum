import React from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import { TanStackMuiTextField } from './TanStackMuiTextField';
import type { TypedFieldApi } from './BaseAppForm';
import { ClearInput } from '../form-components/ClearInput';

interface SelectOption {
  label: string;
  value: string | number;
}

export const TanStackSelect = ({ field, options, label, hideClear }: {
  field: TypedFieldApi<string | null>;
  options: SelectOption[] | readonly SelectOption[];
  label?: string;
  hideClear?: boolean;
}) => {
  const { MenuItem } = Components;

  return (<>
    <TanStackMuiTextField select field={field} label={label}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TanStackMuiTextField>
    {!hideClear && <ClearInput clearField={() => field.handleChange(null)} />}
  </>)
};
