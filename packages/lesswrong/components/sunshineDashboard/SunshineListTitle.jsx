import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    borderTop: "solid 1px rgba(0,0,0,.2)",
    padding: theme.spacing.unit*1.5,
    fontWeight: 600,
  }
})

const SunshineListTitle = ({children, classes}) => {
  return <Typography variant="body2" className={classes.root}>
        { children }
      </Typography>
};

SunshineListTitle.displayName = "SunshineSidebarTitle";

registerComponent('SunshineListTitle', SunshineListTitle, withStyles(styles, { name: 'SunshineListTitle'}));
