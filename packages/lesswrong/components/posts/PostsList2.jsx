import { Components, registerComponent, useMulti, Utils } from 'meteor/vulcan:core';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Posts } from '../../lib/collections/posts';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import classNames from 'classnames';
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

// A list of posts, defined by a query that returns them.
//
// Props:
//  * children: Child elements will be put in a footer section
//  * terms: The search terms used to select the posts that will be shown.
//  * dimWhenLoading: Apply a style that grays out the list while it's in a
//    loading state (default false)
//  * showLoading: Display a loading spinner while loading (default true)
//  * showLoadMore: Show a Load More link in the footer if there are potentially
//    more posts (default true)
//  * showNoResults: Show a placeholder if there are no results (otherwise
//    render only whiteness) (default true)
//  * hideLastUnread: If the initial set of posts ends with N consecutive
//    already-read posts, hide the last N-1 of them. Used for abbreviating
//    read posts from the Recently Curated section on the front page.
const PostsList2 = ({
  children, terms,
  dimWhenLoading = false,
  showLoading = true, showLoadMore = true, showNoResults = true,
  hideLastUnread = false,
  enableTotal=false,
  showNominationCount,
  classes,
  dense,
  defaultToShowUnreadComments
}) => {
  const [haveLoadedMore, setHaveLoadedMore] = useState(false);
  const { results, loading, error, count, totalCount, loadMore, limit } = useMulti({
    terms: terms,
    
    collection: Posts,
    queryName: 'postsListQuery',
    fragmentName: 'PostsList',
    enableTotal: enableTotal,
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
  
  let hidePosts = null;
  if (hideLastUnread && results?.length && !haveLoadedMore) {
    // If the list ends with N sequential read posts, hide N-1 of them.
    let numUnreadAtEnd = 0;
    for (let i=results.length-1; i>=0; i--) {
      // FIXME: This uses the initial-load version of the read-status, and won't
      // update based on the client-side read status cache.
      if (results[i].isRead) numUnreadAtEnd++;
      else break;
    }
    if (numUnreadAtEnd > 1) {
      const numHiddenAtEnd = numUnreadAtEnd - 1;
      hidePosts = [..._.times(results.length-numHiddenAtEnd, i=>false), ..._.times(numHiddenAtEnd, i=>true)];
    }
  }

  orderedResults = results
  if (defaultToShowUnreadComments) {
    orderedResults = _.sortBy(results, (post) => { 
      return post.lastVisitedAt >=  Posts.getLastCommentedAt(post);
    })
  }


  return (
    <div className={classNames({[classes.itemIsLoading]: loading && dimWhenLoading})}>
      {error && <Error error={Utils.decodeIntlError(error)} />}
      {loading && showLoading && dimWhenLoading && <Loading />}
      {results && !results.length && showNoResults && <PostsNoResults />}


      {orderedResults && orderedResults.map((post, i) => {
        const props = { post, index: i, terms, showNominationCount, dense, defaultToShowUnreadComments, showQuestionTag: terms.filter!=="questions" }

        return (hidePosts && hidePosts[i])
          ? <PostsItem2 key={post._id} index={i} {...props} hideOnSmallScreens />
          : <PostsItem2 key={post._id} index={i} {...props} />
      })}
      {(showLoadMore || children?.length>0) && <SectionFooter>
        {(showLoadMore) &&
          <div className={classes.loadMore}>
            <LoadMore
              loadMore={() => {
                loadMore();
                setHaveLoadedMore(true);
              }}
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
  hideLastUnread: PropTypes.bool,
  classes: PropTypes.object.isRequired,
};

registerComponent('PostsList2', PostsList2,
  withStyles(styles, {name:"PostsList2"}));
