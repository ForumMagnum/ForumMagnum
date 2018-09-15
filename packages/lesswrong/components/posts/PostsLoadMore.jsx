import { Components } from 'meteor/vulcan:core';
import React from 'react';
import classNames from 'classnames';
import muiThemeable from 'material-ui/styles/muiThemeable';
import defineComponent from '../../lib/defineComponent';

const styles = theme => ({
  link: {
    color: theme.palette.secondary.main,
  }
})

const PostsLoadMore = ({loading, loadMore, count, totalCount, muiTheme, classes}) => {
  return (
    <div className={classNames('posts-load-more', {'posts-load-more-loading': loading})}>
      <a className={classNames("posts-load-more-link", classes.link)}
        href="#"
        onClick={e => {e.preventDefault(); loadMore();}}>
        Load More...
        &nbsp;
        {totalCount ? <span className="load-more-count">{`(${count}/${totalCount})`}</span> : null}
      </a>
      {loading ? <div className="posts-load-more-loader"><Components.Loading/></div> : null}
    </div>
  )
}

export default defineComponent({
  name: 'PostsLoadMore',
  component: PostsLoadMore,
  styles: styles,
  hocs: [ muiThemeable() ]
});

