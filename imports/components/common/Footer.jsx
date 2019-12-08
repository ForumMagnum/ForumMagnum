import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    height: 150,
  }
});

const Footer = ({classes}) => {
  return (
    <div className={classes.root} />
  )
}

registerComponent('Footer', Footer, withStyles(styles, { name: "Footer" }));
