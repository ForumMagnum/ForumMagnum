import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { FormGroupLayoutProps } from './FormGroupLayout';

const styles = (_theme: ThemeType) => ({
  root: {
    display: 'contents',
    '& .form-component-FormComponentQuickTakesTags': {
      order: 100,
    },
  },
});

/**
 * For the quick takes entry we need to show the submit button _above_ one of
 * the form entries (the tag picker), so we do that with a little CSS hack in
 * this layout component.
 */
const FormGroupQuickTakesInner = ({
  children,
  classes,
}: FormGroupLayoutProps & {classes: ClassesType<typeof styles>}) => {
  return (
    <div className={classes.root}>
      {children}
    </div>
  );
}

export const FormGroupQuickTakes = registerComponent(
  'FormGroupQuickTakes',
  FormGroupQuickTakesInner,
  {styles},
);


