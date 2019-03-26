import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
  },
  disabled: {
    color: theme.palette.grey[400],
    cursor: 'default',
    '&:hover': {
      opacity: 1
    }
  }
})


const LoadMore = ({ loadMore, count, totalCount, classes, disabled=false }) => {
  const handleClickLoadMore = event => {
    event.preventDefault();
    loadMore();
  }

  return (
    <a className={classNames(classes.root, {[classes.disabled]: disabled})}
      href="#"
      onClick={handleClickLoadMore}>
      Load More {totalCount && <span> ({count}/{totalCount})</span>}
    </a>
  )
}

LoadMore.displayName = "LoadMore";

registerComponent('LoadMore', LoadMore,
  withStyles(styles, { name: "LoadMore" })
);
