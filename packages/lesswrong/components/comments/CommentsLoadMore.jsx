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

const CommentsLoadMore = ({loading, loadMore, count, totalCount, classes}) => {
  return (
    <div className={classNames('comments-load-more', {'comments-load-more-loading': loading})}>
    <Typography variant="body2">
      <a 
        className={classes.link}
        href="#"
        onClick={e => {e.preventDefault(); loadMore();}}
      >
        Load More...
        &nbsp;
        {totalCount ? <span className="comments-more-count">{`(${count}/${totalCount})`}</span> : null}
      </a>
    </Typography>
    {loading ? <div className="comments-load-more-loader"><Components.Loading/></div> : null}
    </div>
  )
}

CommentsLoadMore.displayName = "CommentsLoadMore";

registerComponent('CommentsLoadMore', CommentsLoadMore,
  withStyles(styles, { name: "CommentsLoadMore" })
);
