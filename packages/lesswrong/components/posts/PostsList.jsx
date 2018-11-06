import { Components, registerComponent, withList, Utils } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Posts } from '../../lib/collections/posts';
import { FormattedMessage, intlShape } from 'meteor/vulcan:i18n';
import classNames from 'classnames';
import withUser from '../common/withUser';

const Error = ({error}) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</div>;

const PostsList = ({
  className,
  results,
  loading,
  count,
  totalCount,
  loadMore,
  showHeader = true,
  showLoadMore = true,
  showNoResults = true,
  networkStatus,
  currentUser,
  error,
  terms}) => {

  // TODO-Q: Is there a composable way to check whether this is the second
  //         time that networkStatus === 1, in order to prevent the loading
  //         indicator showing up on initial pageload?
  //
  //         Alternatively, is there a better way of checking that this is
  //         in fact the best way of checking loading status?
  const loadingMore = networkStatus === 2 || networkStatus === 1;
  const renderContent = () => {
    if (results && results.length) {
      return <div>
        <div className="posts-list-wrapper">
          {results.map(post => <Components.ErrorBoundary key={post._id}>
            <Components.PostsItem post={post} currentUser={currentUser} terms={terms} />
          </Components.ErrorBoundary>)}
        </div>
        {showLoadMore ? <Components.PostsLoadMore loading={loadingMore} loadMore={loadMore} count={count} totalCount={totalCount} /> : null}
      </div>
    } else if (loading) {
      return <Components.PostsLoading/>
    } else if (showNoResults) {
      return <Components.PostsNoResults/>
    }
  }
  return (
    <div className={classNames(className, 'posts-list')}>
      {showHeader ? <Components.PostsListHeader/> : null}
      {error ? <Error error={Utils.decodeIntlError(error)} /> : null }
      <div className="posts-list-content">
        { renderContent() }
      </div>
    </div>
  )
};

PostsList.displayName = "PostsList";

PostsList.propTypes = {
  results: PropTypes.array,
  terms: PropTypes.object,
  hasMore: PropTypes.bool,
  loading: PropTypes.bool,
  count: PropTypes.number,
  totalCount: PropTypes.number,
  loadMore: PropTypes.func,
  showHeader: PropTypes.bool,
};

PostsList.contextTypes = {
  intl: intlShape
};

const options = {
  collection: Posts,
  queryName: 'postsListQuery',
  fragmentName: 'PostsList',
  enableTotal: false,
  enableCache: true,
  fetchPolicy: 'cache-and-network',
  ssr: true
};

registerComponent('PostsList', PostsList, withUser, [withList, options]);
