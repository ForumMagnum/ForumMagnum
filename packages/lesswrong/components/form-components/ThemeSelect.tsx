import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { themeMetadata } from '../../themes/themeNames';

const ThemeSelect = (props: any) => {
  const options = themeMetadata.map(({name, label}) => ({value: name, label}));
  return <Components.FormComponentSelect {...props} options={options} />
}

const ThemeSelectComponent = registerComponent("ThemeSelect", ThemeSelect);

declare global {
  interface ComponentTypes {
    ThemeSelect: typeof ThemeSelectComponent
  }
}
