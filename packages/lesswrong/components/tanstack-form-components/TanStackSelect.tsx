import React from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import { TanStackMuiTextField } from './TanStackMuiTextField';
import type { TypedFieldApi } from './BaseAppForm';
import { ClearInput } from '../form-components/ClearInput';

export const TanStackSelect = ({ field, options, label }: {
  field: TypedFieldApi<string | null>;
  options: { label: string; value: string | number }[];
  label?: string;
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
    <ClearInput clearField={() => field.handleChange(null)} />
  </>)
};
