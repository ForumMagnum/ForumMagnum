import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    marginLeft: theme.spacing.unit*2,
    marginRight: theme.spacing.unit
  }
})

const SectionContent = ({children, classes, className}) => {
  return <div className={classNames(classes.root, className)}>
    {children}
  </div>
}

registerComponent( 'SectionContent', SectionContent, withStyles(styles, {name: 'SectionContent'}))
