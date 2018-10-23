import { Components, registerComponent, withList, Utils } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import React from 'react';
import PropTypes from 'prop-types';
import { Posts } from '../../lib/collections/posts';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import classNames from 'classnames';

const Error = ({error}) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</div>;

const UsersPostsList = ({className, results, loading, count, totalCount, loadMore,
  showHeader = true, showLoadMore = true, networkStatus, currentUser, error,
  terms}) => {

  const loadingMore = networkStatus === 2;

  const renderContent = () => {
    if (results && results.length) {
      return <div>
          {results.map(post => <Components.PostsItem post={post} key={post._id} currentUser={currentUser} terms={terms} />)}
          {showLoadMore ? <Components.PostsLoadMore loading={loadingMore} loadMore={loadMore} count={count} totalCount={totalCount} /> : null}
      </div>
    } else if (loading) {
      return <Components.PostsLoading/>
    } else {
      return <Components.PostsNoResults/>
    }
  }

  return (
    <div className={classNames(className, 'posts-list', 'users-posts-list')}>
      {showHeader ? <Components.PostsListHeader/> : null}
      {error ? <Error error={Utils.decodeIntlError(error)} /> : null }
      <div className="posts-list-content users-posts-list-content">
        { renderContent() }
      </div>
    </div>
  )
};

UsersPostsList.displayName = "UsersPostsList";

UsersPostsList.propTypes = {
  results: PropTypes.array,
  terms: PropTypes.object,
  hasMore: PropTypes.bool,
  loading: PropTypes.bool,
  count: PropTypes.number,
  totalCount: PropTypes.number,
  loadMore: PropTypes.func,
  showHeader: PropTypes.bool,
};

const options = {
  collection: Posts,
  queryName: 'usersPostsListQuery',
  fragmentName: 'PostsList',
  enableTotal: true,
  enableCache: true
};

registerComponent('UsersPostsList', UsersPostsList, withUser, [withList, options]);
