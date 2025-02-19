import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    height: 150,
  }
});

const Footer = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root} />
  )
}

const FooterComponent = registerComponent('Footer', Footer, {styles});

declare global {
  interface ComponentTypes {
    Footer: typeof FooterComponent
  }
}
