import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { FormGroupLayoutProps } from './FormGroupLayout';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('FormGroupQuickTakes', (_theme: ThemeType) => ({
  root: {
    display: 'contents',
    '& .input-relevantTagIds': {
      order: 100,
    },
  },
}));

/**
 * For the quick takes entry we need to show the submit button _above_ one of
 * the form entries (the tag picker), so we do that with a little CSS hack in
 * this layout component.
 */
const FormGroupQuickTakes = ({children}: FormGroupLayoutProps) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      {children}
    </div>
  );
}

export default FormGroupQuickTakes;


