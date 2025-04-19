import React from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import { TanStackMuiTextField } from './TanStackMuiTextField';
import type { TypedFieldApi } from './BaseAppForm';

export const TanStackSelect = ({ field, options, label }: {
  field: TypedFieldApi<string>;
  options: { label: string; value: string }[];
  label?: string;
}) => {
  const { MenuItem } = Components;

  return <TanStackMuiTextField select field={field} label={label}>
    {options.map((option) => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ))}
  </TanStackMuiTextField>
};
