import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    position:"relative",
    borderTop: theme.palette.border.faint,
    paddingTop: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
  },
  content: {
    ...theme.typography.postStyle,
    overflow: "hidden",
    lineHeight: "1.2rem",
    fontFamily: theme.isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
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



