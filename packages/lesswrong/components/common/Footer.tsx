import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { createStyles } from '@material-ui/core/styles';

const styles = createStyles(theme => ({
  root: {
    height: 150,
  }
}));

const Footer = ({classes}) => {
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
