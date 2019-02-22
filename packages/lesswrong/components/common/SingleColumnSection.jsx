import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = (theme) => ({
  root: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth:685,
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
