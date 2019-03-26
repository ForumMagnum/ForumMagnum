import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

export const SECTION_WIDTH = 720

const styles = (theme) => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: SECTION_WIDTH,
  }
})

const SingleColumnSection = ({classes, children}) => {

  return (
    <Components.ErrorBoundary>
      <div className={classes.root}>
        { children }
      </div>
    </Components.ErrorBoundary>
  )
};

registerComponent('SingleColumnSection', SingleColumnSection, withStyles(styles, { name: 'SingleColumnSection'}));
