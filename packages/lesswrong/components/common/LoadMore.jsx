import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.secondary.main,
  }
})


const LoadMore = ({ loadMore, count, totalCount, classes}) => {
  const handleClickLoadMore = event => {
    event.preventDefault();
    loadMore();
  }

  return (
    <a className={classes.root}
      href="#"
      onClick={handleClickLoadMore}>
      Load More&nbsp;
      {totalCount ? <span>{`(${count}/${totalCount})`}</span> : null}
    </a>
  )
}

LoadMore.displayName = "LoadMore";

registerComponent('LoadMore', LoadMore,
  withStyles(styles, { name: "LoadMore" })
);
