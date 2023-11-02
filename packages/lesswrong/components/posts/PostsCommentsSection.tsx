import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import {forumTypeSetting, isEAForum, isLWorAF} from '../../lib/instanceSettings';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import type { EagerPostComments } from './PostsPage/PostsPage';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import isEqual from 'lodash/isEqual';
import { CommentTreeNode, unflattenComments } from '../../lib/utils/unflatten';
import { ToCSection } from '../../lib/tableOfContents';

export const postsCommentsThreadMultiOptions = {
  collectionName: "Comments" as const,
  fragmentName: 'CommentsList' as const,
  fetchPolicy: 'cache-and-network' as const,
  enableTotal: true,
}

const styles = (theme: ThemeType): JssStyles => ({
})

const PostsCommentsSection = ({post, commentTerms, eagerPostComments, answersAndReplies, refetch, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  commentTerms: CommentsViewTerms,
  eagerPostComments?: EagerPostComments,
  answersAndReplies: CommentsList[]|null,
  refetch: ()=>void,
  classes: ClassesType,
}) => {
  const { ToCColumn, AnalyticsInViewTracker, AFUnreviewedCommentCount, CommentsTableOfContents, PostsPageQuestionContent } = Components;
  const isAF = (forumTypeSetting.get() === 'AlignmentForum');
  const currentUser = useCurrentUser();

  // check for deep equality between terms and eagerPostComments.terms
  const useEagerResults = eagerPostComments && isEqual(commentTerms, eagerPostComments?.terms);

  const lazyResults = useMulti({
    terms: {...commentTerms, postId: post._id},
    skip: useEagerResults,
    ...postsCommentsThreadMultiOptions,
  });

  const { loading, results, loadMore, loadingMore, totalCount } = useEagerResults ? eagerPostComments.queryResponse : lazyResults;
  
  if (loading && !results) {
    return <Components.Loading />;
  } else if (!results) {
    return null;
  }

  const commentCount = results?.length ?? 0;
  const commentTree = unflattenComments(results);
  const answersTree = unflattenComments(answersAndReplies ?? []);
  
  // JB: mainColumn is extracted into a variable here to support the forum-gating below. See
  // also the forum-gating in PostsPage, which must be removed at the same time.
  const mainColumn =
    <AnalyticsInViewTracker eventProps={{inViewType: "commentsSection"}} >
      {/* Answers Section */}
      {post.question && <div className={classes.centralColumn}>
        <div id="answers"/>
        <AnalyticsContext pageSectionContext="answersSection">
          <PostsPageQuestionContent post={post} answersTree={answersTree ?? []} refetch={refetch}/>
        </AnalyticsContext>
      </div>}
      {/* Comments Section */}
      <div className={classes.commentsSection}>
        <AnalyticsContext pageSectionContext="commentsSection">
          <Components.CommentsListSection
            comments={results}
            loadMoreComments={loadMore}
            totalComments={totalCount as number}
            commentCount={commentCount}
            loadingMoreComments={loadingMore}
            post={post}
            newForm={!post.question && (!post.shortform || post.userId===currentUser?._id)}
          />
          {isAF && <AFUnreviewedCommentCount post={post}/>}
        </AnalyticsContext>
        {isEAForum && post.commentCount < 1 &&
          <div className={classes.noCommentsPlaceholder}>
            <div>No comments on this post yet.</div>
            <div>Be the first to respond.</div>
          </div>
        }
      </div>
    </AnalyticsInViewTracker>
  
  if (isLWorAF) {
    return <ToCColumn
      tableOfContents={<CommentsTableOfContents
        commentTree={commentTree}
        answersTree={answersTree}
        post={post}
      />}
    >
      {mainColumn}
    </ToCColumn>
  } else {
    return mainColumn;
  }
}


function commentTreeToToCSections (commentTree: CommentTreeNode<CommentsList>[], level: number): ToCSection[] {
  let result: ToCSection[] = [];
  for (let comment of commentTree) {
    result.push({
      anchor: comment.item._id,
      level,
    });
    if (comment.children) {
      result = [...result, ...commentTreeToToCSections(comment.children, level+1)];
    }
  }
  return result;
}

const PostsCommentsSectionComponent = registerComponent('PostsCommentsSection', PostsCommentsSection, {styles});

declare global {
  interface ComponentTypes {
    PostsCommentsSection: typeof PostsCommentsSectionComponent
  }
}

