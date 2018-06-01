import { Components, replaceComponent } from 'meteor/vulcan:core';
import React from 'react';
import classNames from 'classnames';
import muiThemeable from 'material-ui/styles/muiThemeable';

const PostsLoadMore = ({loading, loadMore, count, totalCount, muiTheme}) => {
  return (
    <div className={classNames('posts-load-more', {'posts-load-more-loading': loading})}>
      <a className="posts-load-more-link"
        href="#"
        style={{color:muiTheme.palette.accent2Color}}
        onClick={e => {e.preventDefault(); loadMore();}}>
        Load More...
        &nbsp;
        {totalCount ? <span className="load-more-count">{`(${count}/${totalCount})`}</span> : null}
      </a>
      {loading ? <div className="posts-load-more-loader"><Components.Loading/></div> : null}
    </div>
  )
}

PostsLoadMore.displayName = "PostsLoadMore";

replaceComponent('PostsLoadMore', PostsLoadMore, muiThemeable());
