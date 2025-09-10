import React from 'react';
import { themeMetadata, getDefaultThemeOptions } from '../../themes/themeNames';
import { useAbstractThemeOptions } from '../themes/useTheme';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { FormComponentSelect } from '@/components/form-components/FormComponentSelect';

const getValue = (field: TypedFieldApi<ThemeField>): string => {
  if (field.state.value.name) {
    return field.state.value.name;
  }

  if (typeof window !== "undefined" && window.themeOptions?.name) {
    return window.themeOptions.name;
  }

  return getDefaultThemeOptions().name;
}

interface ThemeField {
  name: "default" | "dark" | "auto",
  siteThemeOverride?: AnyBecauseHard | null,
}

interface ThemeSelectProps {
  field: TypedFieldApi<ThemeField>;
}

export const ThemeSelect = ({ field }: ThemeSelectProps) => {
  const themeOptions = useAbstractThemeOptions();
  const options = themeMetadata.map(({name, label}) => ({value: name, label}));

  const updateTheme = (newName: ThemeField['name']) => {
    const newThemeValue = {
      ...themeOptions,
      name: newName,
    };

    field.handleChange(newThemeValue);
  }

  return (
    <FormComponentSelect
      field={{
        name: field.name,
        state: {
          value: getValue(field),
          meta: field.state.meta,
        },
        handleChange: updateTheme,
        handleBlur: field.handleBlur,
      }}
      defaultValue={undefined}
      options={options}
    />
  );
}

