import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { decodeIntlError } from '../../lib/vulcan-lib/utils';
import { useMulti } from '../../lib/crud/withMulti';
import React, { useState } from 'react';
import { postGetLastCommentedAt } from '../../lib/collections/posts/helpers';
import { FormattedMessage } from '../../lib/vulcan-i18n';
import classNames from 'classnames';
import { useOnMountTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { useHideRepeatedPosts } from '../posts/HideRepeatedPostsContext';
import * as _ from 'underscore';
import { PopperPlacementType } from '@material-ui/core/Popper';

const Error = ({error}) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</div>;

const styles = (theme: ThemeType): JssStyles => ({
  itemIsLoading: {
    opacity: .4,
  },
  posts: {
    boxShadow: theme.palette.boxShadow.default,
  }
})

// A list of posts, defined by a query that returns them.
//
// Props:
//  * children: Child elements will be put in a footer section
//  * terms: The search terms used to select the posts that will be shown.
//  * dimWhenLoading: Apply a style that grays out the list while it's in a
//    loading state (default false)
//  * topLoading: show the loading state at the top of the list in addition to the bottom
//  * showLoading: Display a loading spinner while loading (default true)
//  * showLoadMore: Show a Load More link in the footer if there are potentially
//    more posts (default true)
//  * showNoResults: Show a placeholder if there are no results (otherwise
//    render only whiteness) (default true)
//  * hideLastUnread: If the list ends with N sequential read posts, 
//    hide them, except for the first post in the list
//  * isRecommendations: If set, use an alternate resolver which logs entries
//    as issued recommendations, then pass recommendation IDs to PostsItem2.
const PostsList2 = ({
  children, terms,
  dimWhenLoading = false,
  topLoading = false,
  showLoading = true,
  showLoadMore = true,
  alwaysShowLoadMore = false,
  showNoResults = true,
  hideLastUnread = false,
  showPostedAt = true,
  enableTotal=false,
  showNominationCount,
  showReviewCount,
  showDraftTag=true,
  tagId,
  dense,
  defaultToShowUnreadComments,
  itemsPerPage=25,
  hideAuthor=false,
  hideTrailingButtons=false,
  tooltipPlacement="bottom-end",
  boxShadow=true,
  curatedIconLeft=false,
  showFinalBottomBorder=false,
  hideHiddenFrontPagePosts=false,
  isRecommendations=false,
  classes,
}: {
  children?: React.ReactNode,
  terms?: any,
  dimWhenLoading?: boolean,
  topLoading?: boolean,
  showLoading?: boolean,
  showLoadMore?: boolean,
  alwaysShowLoadMore?: boolean,
  showNoResults?: boolean,
  hideLastUnread?: boolean,
  showPostedAt?: boolean,
  enableTotal?: boolean,
  showNominationCount?: boolean,
  showReviewCount?: boolean,
  showDraftTag?: boolean,
  tagId?: string,
  dense?: boolean,
  defaultToShowUnreadComments?: boolean,
  itemsPerPage?: number,
  hideAuthor?: boolean,
  hideTrailingButtons?: boolean,
  tooltipPlacement?: PopperPlacementType,
  boxShadow?: boolean
  curatedIconLeft?: boolean,
  showFinalBottomBorder?: boolean,
  hideHiddenFrontPagePosts?: boolean
  isRecommendations?: boolean,
  classes: ClassesType,
}) => {
  const {isPostRepeated, addPost} = useHideRepeatedPosts();

  const [haveLoadedMore, setHaveLoadedMore] = useState(false);

  const tagVariables = tagId ? {
    extraVariables: {
      tagId: "String"
    },
    extraVariablesValues: { tagId }
  } : {}
  const { results, loading, error, loadMore, loadMoreProps, limit } = useMulti({
    terms: terms,
    collectionName: "Posts",
    fragmentName: !!tagId ? 'PostsListTag' : 'PostsList',
    enableTotal: enableTotal,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    itemsPerPage: itemsPerPage,
    alwaysShowLoadMore,
    resolverName: isRecommendations ? "recommendationsMulti" : undefined,
    ...tagVariables
  });

  // Map from post._id to whether to hide it. Used for client side post filtering like e.g. hiding read posts
  const hiddenPosts: {[key: string]: boolean} = {}

  const currentUser = useCurrentUser();
  if (results?.length) {
    if (hideLastUnread && !haveLoadedMore) {
      // If the list ends with N sequential read posts, hide them, except for the first post in the list
      for (let i=results.length-1; i>=0; i--) {
        // FIXME: This uses the initial-load version of the read-status, and won't
        // update based on the client-side read status cache.
        if (results[i].isRead && i > 0) {
          hiddenPosts[results[i]._id] = true;
        }
        else break;
      }
    }

    if (currentUser && hideHiddenFrontPagePosts) {
      // Hide any posts that a user has explicitly hidden
      // 
      // FIXME: this has an unfortunate edge case, where if a user hides enough posts they'll end up with
      // no frontpage! We're assuming this is very unlikely, but consider moving this to server side
      for (const metadata of currentUser.hiddenPostsMetadata || []) {
        hiddenPosts[metadata.postId] = true;
      }
    }
  }
  
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


  // We don't actually know if there are more posts here,
  // but if this condition fails to meet we know that there definitely are no more posts
  const maybeMorePosts = !!(results?.length && (results.length >= limit)) || alwaysShowLoadMore;

  let orderedResults = results
  if (defaultToShowUnreadComments && results) {
    orderedResults = _.sortBy(results, (post) => {
      return !post.lastVisitedAt || (post.lastVisitedAt >=  postGetLastCommentedAt(post));
    })
  }

  //Analytics Tracking
  const postIds = (orderedResults||[]).map((post) => post._id)
  useOnMountTracking({eventType: "postList", eventProps: {postIds, postVisibility: hiddenPosts}, captureOnMount: eventProps => eventProps.postIds.length, skip: !postIds.length||loading})

  if (!orderedResults && loading) return <Loading />
  if (results && !results.length && !showNoResults) return null

  return (
    <div className={classNames({[classes.itemIsLoading]: loading && dimWhenLoading})}>
      {error && <Error error={decodeIntlError(error)} />}
      {loading && showLoading && (topLoading || dimWhenLoading) && <Loading />}
      {results && !results.length && <PostsNoResults />}

      <div className={boxShadow ? classes.posts : null}>
        {orderedResults && orderedResults.map((post, i) => {
          if (isPostRepeated(post._id)) {
            return null;
          }
          addPost(post._id);

          const props = {
            post,
            index: i,
            terms, showNominationCount, showReviewCount, showDraftTag, dense, hideAuthor, hideTrailingButtons,
            curatedIconLeft: curatedIconLeft,
            tagRel: tagId ? (post as PostsListTag).tagRel : undefined,
            defaultToShowUnreadComments, showPostedAt,
            showQuestionTag: terms?.filter !== "questions",
            // I don't know why TS is not narrowing orderedResults away from
            // undefined given the truthy check above
            showBottomBorder: showFinalBottomBorder || ((orderedResults!.length > 1) && i < (orderedResults!.length - 1)),
            tooltipPlacement,
          };

          if (!(post._id in hiddenPosts)) {
            return <PostsItem2 key={post._id} {...props} />
          }
        })}
      </div>
      {showLoadMore && <SectionFooter>
        <LoadMore
          {...loadMoreProps}
          loading={loading}
          loadMore={() => {
            loadMore();
            setHaveLoadedMore(true);
          }}
          hideLoading={dimWhenLoading || !showLoading}
          // It's important to use hidden here rather than not rendering the component,
          // because LoadMore has an "isFirstRender" check that prevents it from showing loading dots
          // on the first render. Not rendering resets this
          hidden={!maybeMorePosts && !loading}
          sectionFooterStyles
        />
        { children }
      </SectionFooter>}
    </div>
  )
}

const PostsList2Component = registerComponent('PostsList2', PostsList2, {
  styles,
  areEqual: {
    terms: "deep",
  },
});

declare global {
  interface ComponentTypes {
    PostsList2: typeof PostsList2Component
  }
}
