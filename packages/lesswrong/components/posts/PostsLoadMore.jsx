import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  link: {
    color: theme.palette.secondary.main,
  }
})


const PostsLoadMore = ({loading, loadMore, count, totalCount, classes}) => {
  const handleClickLoadMore = event => {
    event.preventDefault();
    loadMore();
  }

  return (
    <a className={classNames("posts-load-more-link", classes.link)}
      href="#"
      onClick={handleClickLoadMore}>
      Load More&nbsp;
      {totalCount ? <span className="load-more-count">{`(${count}/${totalCount})`}</span> : null}
    </a>
  )
}

PostsLoadMore.displayName = "PostsLoadMore";

registerComponent('PostsLoadMore', PostsLoadMore,
  withStyles(styles, { name: "PostsLoadMore" })
);
