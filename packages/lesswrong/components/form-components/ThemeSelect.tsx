import React, { ChangeEventHandler } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { themeMetadata, isValidUserThemeSetting } from '../../themes/themeNames';
import { useThemeOptions, useSetTheme } from '../themes/useTheme';

const ThemeSelect = (props: any) => {
  const currentThemeOptions = useThemeOptions();
  const setTheme = useSetTheme();

  const options = themeMetadata.map(({name, label}) => ({value: name, label}));

  const onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (event) => {
    const name = event?.target?.value;
    if (name && isValidUserThemeSetting(name)) {
      setTheme({...currentThemeOptions, name});
    }
  }

  return <Components.FormComponentSelect {...props} options={options} onChange={onChange} />
}

const ThemeSelectComponent = registerComponent("ThemeSelect", ThemeSelect);

declare global {
  interface ComponentTypes {
    ThemeSelect: typeof ThemeSelectComponent
  }
}
