import React, { ReactNode } from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('CommentsListMeta', (theme: ThemeType) => ({
  root: {
    fontSize: 14,
    clear: 'both',
    marginTop: 24,
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'center',
    color: theme.palette.grey[600]
  }
}))

const CommentsListMeta = ({children}: {
  children: ReactNode,
}) => {
  const classes = useStyles(styles);

  return <div className={classes.root}>
    { children }
  </div>
}

export default CommentsListMeta;


