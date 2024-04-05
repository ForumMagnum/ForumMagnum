import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib';
import { FormGroupLayoutProps } from './FormGroupLayout';

const styles = (_theme: ThemeType) => ({
  root: {
    display: 'contents',
    '& .form-component-FormComponentQuickTakesTags': {
      order: 100,
    },
  },
});

const FormGroupQuickTakes = ({
  children,
  classes,
}: FormGroupLayoutProps & {classes: ClassesType<typeof styles>}) => {
  return (
    <div className={classes.root}>
      {children}
    </div>
  );
}

const FormGroupQuickTakesComponent = registerComponent(
  'FormGroupQuickTakes',
  FormGroupQuickTakes,
  {styles},
);

declare global {
  interface ComponentTypes {
    FormGroupQuickTakes: typeof FormGroupQuickTakesComponent
  }
}
