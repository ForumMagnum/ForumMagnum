import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { themeMetadata, getDefaultThemeOptions } from '../../themes/themeNames';
import { useThemeOptions } from '../themes/useTheme';

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
    <Components.FormComponentSelect
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
