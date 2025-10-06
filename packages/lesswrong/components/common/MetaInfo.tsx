import React from 'react';
import classNames from 'classnames'
import { Typography } from "./Typography";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

export const metaInfoRootStyles = (theme: ThemeType) => ({
  display: "inline",
  color: theme.palette.grey[600],
  marginRight: theme.spacing.unit,
  fontSize: "1rem",
  
  ...(theme.isFriendlyUI && {
    fontFamily: theme.palette.fonts.sansSerifStack
  }),
});

const styles = defineStyles("MetaInfo", (theme: ThemeType) => ({
  root: {
    ...metaInfoRootStyles(theme),
  },
  button: {
    cursor: "pointer",
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[400],
    },
  }
}))

const MetaInfo = ({children, button, className}: {
  children: React.ReactNode,
  button?: boolean,
  className?: string
  title?: string,
}) => {
  const classes = useStyles(styles);
  return <Typography
    component='span'
    className={classNames(classes.root, button && classes.button, className)}
    variant='body2'>
      {children}
  </Typography>
}

export default MetaInfo;


