import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    height: 150,
  }
});

const FooterInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root} />
  )
}

export const Footer = registerComponent('Footer', FooterInner, {styles});


