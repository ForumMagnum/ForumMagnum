import { Components, registerComponent, useMulti, Utils } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Posts } from '../../lib/collections/posts';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { withStyles } from '@material-ui/core/styles'

const Error = ({error}) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</div>;

const styles = theme => ({
  itemIsLoading: {
    opacity: .4,
  },
  loading: {
    '&&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  },
  loadMore: {
    flexGrow: 1,
    textAlign: "left",
    '&&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  }
})

const PostsList2 = ({
  children, terms,
  dimWhenLoading = false,
  showLoading = true, showLoadMore = true, showNoResults = true,
  classes,
}) => {
  const currentUser = useCurrentUser();
  const { results, loading, error, count, totalCount, loadMore, limit } = useMulti({
    terms: terms,
    
    collection: Posts,
    queryName: 'postsListQuery',
    fragmentName: 'PostsList',
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
    ssr: true
  });
  
  // TODO-Q: Is there a composable way to check whether this is the second
  //         time that networkStatus === 1, in order to prevent the loading
  //         indicator showing up on initial pageload?
  //
  //         Alternatively, is there a better way of checking that this is
  //         in fact the best way of checking loading status?

  // TODO-A (2019-2-20): For now, solving this with a flag that determines whether
  //                     to dim the list during loading, so that the pages where that
  //                     behavior was more important can work fine. Will probably
  //                     fix this for real when Apollo 2 comes out

  const { Loading, PostsItem2, LoadMore, PostsNoResults, SectionFooter } = Components

  if (!results && loading) return <Loading />

  // We don't actually know if there are more posts here,
  // but if this condition fails to meet we know that there definitely are no more posts
  const maybeMorePosts = !!(results && results.length && (results.length >= limit))

  return (
    <div className={classNames({[classes.itemIsLoading]: loading && dimWhenLoading})}>
      {error && <Error error={Utils.decodeIntlError(error)} />}
      {loading && showLoading && dimWhenLoading && <Loading />}
      {results && !results.length && showNoResults && <PostsNoResults />}

      {results && results.map((post, i) => <PostsItem2 key={post._id} post={post} currentUser={currentUser} showQuestionTag={terms.filter!=="questions"} terms={terms} index={i}/> )}
      {(showLoadMore || children?.length) && <SectionFooter>
        {(showLoadMore) &&
          <div className={classes.loadMore}>
            <LoadMore
              loadMore={loadMore}
              disabled={!maybeMorePosts}
              count={count}
              totalCount={totalCount}
            />
            { !dimWhenLoading && showLoading && loading && <Loading />}
          </div>
        }
        { children }
      </SectionFooter>}
    </div>
  )
}

PostsList2.propTypes = {
  terms: PropTypes.object,
  dimWhenLoading: PropTypes.bool,
  showLoading: PropTypes.bool,
  showLoadMore: PropTypes.bool,
  showNoResults: PropTypes.bool,
  classes: PropTypes.object.isRequired,
};

registerComponent('PostsList2', PostsList2,
  withStyles(styles, {name:"PostsList2"}));
