import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    marginLeft: theme.spacing.unit*2.5
  }
})

const SubSection = ({children, classes, className}) => {
  return <div className={classNames(classes.root, className)}>
    {children}
  </div>
}

registerComponent( 'SubSection', SubSection, withStyles(styles, {name: 'SubSection'}))
