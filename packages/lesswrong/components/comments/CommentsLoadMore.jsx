import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  link: {
    color: theme.palette.secondary.main,
  }
})

const CommentsLoadMore = ({loading, loadMore, count, totalCount, classes}) => {
  return (
    <div className={classNames('comments-load-more', {'comments-load-more-loading': loading})}>
      <a className={classNames("comments-load-more-link"), classes.link}
         href="#"
         onClick={e => {e.preventDefault(); loadMore();}}>
        Load More...
        &nbsp;
        {totalCount ? <span className="comments-more-count">{`(${count}/${totalCount})`}</span> : null}
      </a>
      {loading ? <div className="comments-load-more-loader"><Components.Loading/></div> : null}
    </div>
  )
}

CommentsLoadMore.displayName = "CommentsLoadMore";

registerComponent('CommentsLoadMore', CommentsLoadMore,
  withStyles(styles, { name: "CommentsLoadMore" })
);
