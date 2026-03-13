import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SunshineListItem', (theme: ThemeType) => ({
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
    lineHeight: "1.2rem",
    fontFamily: theme.isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  hover: {
    backgroundColor: theme.palette.grey[50]
  }
}))

const SunshineListItem = ({children, hover=false}: {
  children: React.ReactNode,
  hover?: boolean,
}) => {
  const classes = useStyles(styles);

  return <div className={classNames(classes.root, {[classes.hover]:hover})}>
    <div className={classes.content}>
      { children }
    </div>
  </div>
};

export default SunshineListItem;



