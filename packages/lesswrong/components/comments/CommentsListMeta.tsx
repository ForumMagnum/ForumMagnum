import { registerComponent } from '../../lib/vulcan-lib';
import React, { ReactNode } from 'react';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontSize: 14,
    clear: 'both',
    overflow: 'auto',
    marginTop: 24,
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'center',
    color: theme.palette.grey[600]
  }
})

const CommentsListMeta = ({classes, children}: {
  classes: ClassesType,
  children: ReactNode,
}) => {
  return <div className={classes.root}>
    { children }
  </div>
}

const CommentsListMetaComponent = registerComponent('CommentsListMeta', CommentsListMeta, {styles});

declare global {
  interface ComponentTypes {
    CommentsListMeta: typeof CommentsListMetaComponent,
  }
}
