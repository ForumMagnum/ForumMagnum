import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

export const SECTION_WIDTH = 765

const styles = (theme) => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: SECTION_WIDTH,
  }
})

const SingleColumnSection = ({classes, className, children}) => {

  return (
    <Components.ErrorBoundary>
      <div className={classNames(classes.root, className)}>
        { children }
      </div>
    </Components.ErrorBoundary>
  )
};

registerComponent('SingleColumnSection', SingleColumnSection, withStyles(styles, { name: 'SingleColumnSection'}));
