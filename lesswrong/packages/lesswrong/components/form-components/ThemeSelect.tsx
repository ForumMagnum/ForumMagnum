import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { themeMetadata, getDefaultThemeOptions } from '../../themes/themeNames';
import { useThemeOptions } from '../themes/useTheme';
import FormComponentSelect from "@/components/form-components/FormComponentSelect";

const getValue = (props: any) => {
  if (props.value?.name) {
    return props.value.name;
  }

  if (typeof window !== "undefined" && window.themeOptions?.name) {
    return window.themeOptions.name;
  }

  return getDefaultThemeOptions().name;
}

const ThemeSelect = (props: any) => {
  const themeOptions = useThemeOptions();
  const options = themeMetadata.map(({name, label}) => ({value: name, label}));

  const updateCurrentValues = ({theme, ...rest}: AnyBecauseTodo) => {
    props.updateCurrentValues({
      ...rest,
      theme: {...themeOptions, name: theme},
    });
  }

  return (
    <FormComponentSelect
      {...props}
      defaultValue={undefined}
      value={getValue(props)}
      updateCurrentValues={updateCurrentValues}
      options={options}
    />
  );
}

const ThemeSelectComponent = registerComponent("ThemeSelect", ThemeSelect);

declare global {
  interface ComponentTypes {
    ThemeSelect: typeof ThemeSelectComponent
  }
}

export default ThemeSelectComponent;
