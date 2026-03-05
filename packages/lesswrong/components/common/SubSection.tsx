import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: 20
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

export default registerComponent('SubSection', SubSection, {styles});


