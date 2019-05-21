import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React from 'react';
import Sequences from '../../lib/collections/sequences/collection.js';
import classNames from 'classnames';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';

// Share styles with SequencesGrid
import { styles } from './SequencesGrid';

//TODO: What do the terms do in other list components? Check posts list.
const SequencesGridWrapper = ({
  className,
  loading,
  results,
  count,
  totalCount,
  loadMore,
  loadingMore,
  classes,
  showLoadMore = false,
  showAuthor = false,
  listMode = false}) => {
  if (results && results.length) {

    return (<div className={classNames(className, classes.gridWrapper)}>
      <Components.SequencesGrid sequences={results} showAuthor={showAuthor} listMode={listMode}/>
      { showLoadMore && totalCount > count && <div className={classes.loadMore}>
          <Components.LoadMore loading={loadingMore} loadMore={loadMore} count={count} totalCount={totalCount} />
        </div>
      }
    </div>);
  } else if (loading) {
    return (<div className={classNames(className, classes.grid)}>
      <Components.Loading/>
    </div>);
  } else {
    // TODO: Replace with SequencesNoResults
    return (<div className={classNames(className, classes.grid)}>
      <div className={classes.gridContent}>
        <Components.PostsNoResults/>
      </div>
    </div>);
  }
};

const options = {
  collection: Sequences,
  queryName: "SequencesGridWrapperQuery",
  fragmentName: 'SequencesPageFragment',
  enableTotal: true,
  ssr: true
}


registerComponent('SequencesGridWrapper', SequencesGridWrapper,
  [withList, options], withUser,
  withStyles(styles, {name: "SequencesGridWrapper"}));
