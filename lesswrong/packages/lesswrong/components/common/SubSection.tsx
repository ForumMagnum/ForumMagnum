import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames'

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: theme.spacing.unit*2.5
  }
})

const SubSection = ({children, classes, className}: {
  children?: React.ReactNode,
  classes: ClassesType<typeof styles>,
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
