import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    fontSize: 14,
    clear: 'both',
    overflow: 'auto',
    marginTop: 24,
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    color: theme.palette.grey[600]
  }
})

const CommentsListMeta = ({classes, children}) => {
  return <div className={classes.root}>
      { children }
    </div>
}

registerComponent('CommentsListMeta', CommentsListMeta, withStyles(styles, {name:"CommentsListMeta"}));
