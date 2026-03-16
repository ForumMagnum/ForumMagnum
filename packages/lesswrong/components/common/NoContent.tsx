import React from 'react';
import { Typography } from "./Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('NoContent', (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[600],
    margin: 16
  },
}))

const NoContent = ({children}: {
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);

  return <Typography variant='body2' className={classes.root}>
    {children}
  </Typography>
}

export default NoContent;


