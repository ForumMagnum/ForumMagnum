import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  link: {
    color: theme.palette.secondary.main,
  }
})


const PostsLoadMore = ({loading, loadMore, count, totalCount, classes, showLoading=true}) => {
  const handleClickLoadMore = event => {
    event.preventDefault();
    loadMore();
  }
  return (
    <div className={classNames('posts-load-more', {'posts-load-more-loading': loading})}>
      {!loading && <Typography variant="body2">
        <a className={classNames("posts-load-more-link", classes.link)}
          href="#"
          onClick={handleClickLoadMore}>
          Load More...
          &nbsp;
          {totalCount ? <span className="load-more-count">{`(${count}/${totalCount})`}</span> : null}
        </a>
      </Typography>}
      {(loading && showLoading) ? <div className="posts-load-more-loader"><Components.Loading/></div> : null}
    </div>
  )
}

PostsLoadMore.displayName = "PostsLoadMore";

registerComponent('PostsLoadMore', PostsLoadMore,
  withStyles(styles, { name: "PostsLoadMore" })
);
