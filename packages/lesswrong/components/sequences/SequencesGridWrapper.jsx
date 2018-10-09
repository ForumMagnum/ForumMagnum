import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React from 'react';
import Sequences from '../../lib/collections/sequences/collection.js';
import classNames from 'classnames';
import withUser from '../common/withUser';

//TODO: What do the terms do in other list components? Check posts list.
const SequencesGridWrapper = ({
  className,
  loading,
  currentUser,
  terms,
  results,
  count,
  totalCount,
  loadMore,
  loadingMore,
  showLoadMore = false,
  showAuthor = false,
  listMode = false}) => {
  if (results && results.length) {
    // render grid of sequences
    return (<div className={classNames(className, 'sequences-grid-wrapper')}>
      <Components.SequencesGrid sequences={results} showAuthor={showAuthor} listMode={listMode}/>
      { showLoadMore && totalCount > count && <Components.PostsLoadMore loading={loadingMore} loadMore={loadMore} count={count} totalCount={totalCount} />}
    </div>);
  } else if (loading) {
    // TODO: Replace with SequencesLoading
    return (<div className={classNames(className, 'sequences-grid')}>
      <Components.Loading/>
    </div>);
  } else {
    // TODO: Replace with SequencesNoResults
    return (<div className={classNames(className, 'sequences-grid')}>
      <div className="sequences-grid-content">
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


registerComponent('SequencesGridWrapper', SequencesGridWrapper, [withList, options], withUser);
