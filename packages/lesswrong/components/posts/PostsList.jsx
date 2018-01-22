import { Components, replaceComponent, withList, withCurrentUser, Utils } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Posts } from 'meteor/example-forum';
import Alert from 'react-bootstrap/lib/Alert'
import { FormattedMessage, intlShape } from 'meteor/vulcan:i18n';
import classNames from 'classnames';

const Error = ({error}) => <Alert className="flash-message" bsStyle="danger">
<FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</Alert>

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

  const loadingMore = networkStatus === 2;
  const renderContent = () => {
    if (results && results.length) {
      return <div>
        {results.map(post => <Components.PostsItem post={post} key={post._id} currentUser={currentUser} terms={terms} />)}
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
  fragmentName: 'LWPostsList',
  totalResolver: false,
};

replaceComponent('PostsList', PostsList, withCurrentUser, [withList, options]);
