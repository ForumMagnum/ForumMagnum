import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    [theme.breakpoints.up('md')]: {
      '& .form-input:first-child': {
        marginTop: 0
      },
      '& .form-input:last-child': {
        marginBottom: 0
      },
      '& .form-submit': {
        display: "flex",
        justifyContent: "flex-end"
      }
    }
  }
});

export const BasicFormStylesInner = ({classes, children}: {
  classes: ClassesType<typeof styles>,
  children: React.ReactNode
}) => {
  return <div className={classes.root}>
    {children}
  </div>;
}

export const BasicFormStyles = registerComponent('BasicFormStyles', BasicFormStylesInner, {styles});



