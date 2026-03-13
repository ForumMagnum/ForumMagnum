import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    position:"relative",
    borderTop: theme.palette.border.faint,
    paddingTop: 8,
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 8,
  },
  content: {
    ...theme.typography.postStyle,
    overflow: "hidden",
    lineHeight: "1.2rem"
  },
  hover: {
    backgroundColor: theme.palette.grey[50]
  }
})

const SunshineListItem = ({children, classes, hover=false}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
  hover?: boolean,
}) => {
  return <div className={classNames(classes.root, {[classes.hover]:hover})}>
    <div className={classes.content}>
      { children }
    </div>
  </div>
};

export default registerComponent('SunshineListItem', SunshineListItem, {styles});



