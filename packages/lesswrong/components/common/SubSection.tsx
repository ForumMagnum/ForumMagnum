import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    marginLeft: theme.spacing.unit*2.5
  }
})

const SubSection = ({children, classes, className}: {
  children?: any,
  classes: any,
  className?: string,
}) => {
  return <div className={classNames(classes.root, className)}>
    {children}
  </div>
}

const SubSectionComponent = registerComponent('SubSection', SubSection, {styles});

declare global {
  interface ComponentTypes {
    SubSection: typeof SubSectionComponent
  }
}
