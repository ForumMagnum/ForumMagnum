import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { ReactNode } from 'react';

const styles = (theme: ThemeType) => ({
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
})

const CommentsListMetaInner = ({classes, children}: {
  classes: ClassesType<typeof styles>,
  children: ReactNode,
}) => {
  return <div className={classes.root}>
    { children }
  </div>
}

export const CommentsListMeta = registerComponent('CommentsListMeta', CommentsListMetaInner, {styles});

declare global {
  interface ComponentTypes {
    CommentsListMeta: typeof CommentsListMeta,
  }
}
