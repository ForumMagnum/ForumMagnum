import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import classNames from 'classnames';


const BORDER_TOP_WIDTH = 3

const styles = (theme) => ({
  root: {
    marginLeft: "auto",
    marginRight: "auto",
    width:685
  }
})

const SingleColumnSection = ({
  classes,
  children
}) => {

  return (
    <Components.ErrorBoundary>
      <div className={classes.root}>
        { children }
      </div>
    </Components.ErrorBoundary>
  )
};

registerComponent('SingleColumnSection', SingleColumnSection, withStyles(styles, { name: 'SingleColumnSection'}));
