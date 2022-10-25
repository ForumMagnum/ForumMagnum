import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { themeMetadata, defaultThemeOptions } from '../../themes/themeNames';
import { useThemeOptions } from '../themes/useTheme';

const ThemeSelect = (props: any) => {
  const themeOptions = useThemeOptions();
  const options = themeMetadata.map(({name, label}) => ({value: name, label}));

  const updateCurrentValues = ({theme, ...rest}) => {
    props.updateCurrentValues({
      ...rest,
      theme: {...themeOptions, name: theme},
    });
  }

  return (
    <Components.FormComponentSelect
      {...props}
      defaultValue={undefined}
      value={props.value?.name ?? defaultThemeOptions.name}
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
