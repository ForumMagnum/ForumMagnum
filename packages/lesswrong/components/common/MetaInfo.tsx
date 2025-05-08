import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { isFriendlyUI } from '@/themes/forumTheme';
import { Typography } from "./Typography";

export const styles = (theme: ThemeType) => ({
  root: {
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: theme.spacing.unit,
    fontSize: "1rem",
    
    ...(isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack
    }),
  },
  button: {
    cursor: "pointer",
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[400],
    },
  }
})

const MetaInfoInner = ({children, classes, button, className}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
  button?: boolean,
  className?: string
  title?: string,
}) => {
  return <Typography
    component='span'
    className={classNames(classes.root, button && classes.button, className)}
    variant='body2'>
      {children}
  </Typography>
}

export const MetaInfo = registerComponent('MetaInfo', MetaInfoInner, {styles});

declare global {
  interface ComponentTypes {
    MetaInfo: typeof MetaInfo
  }
}
