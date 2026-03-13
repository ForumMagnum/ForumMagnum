import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('BasicFormStyles', (theme: ThemeType) => ({
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
}));

export const BasicFormStyles = ({children}: {
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);

  return <div className={classes.root}>
    {children}
  </div>;
}

export default registerComponent('BasicFormStyles', BasicFormStyles, {styles});



