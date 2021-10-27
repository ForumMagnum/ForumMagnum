import React, { useEffect } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useLocation } from '../../../lib/routeUtil';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers'
import { postBodyStyles } from '../../../themes/stylePiping'
import { useCurrentUser } from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import { useRecordPostView } from '../../common/withRecordPostView';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import {forumTitleSetting, forumTypeSetting} from '../../../lib/instanceSettings';
import { viewNames } from '../../comments/CommentsViews';

export const MAX_COLUMN_WIDTH = 720

// Also used in PostsCompareRevisions
export const styles = (theme: ThemeType): JssStyles => ({
  title: {
    marginBottom: 32,
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing.titleDividerSpacing,
    }
  },
  centralColumn: {
    maxWidth: 650 + (theme.spacing.unit*4),
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: theme.spacing.unit *3
  },
  postContent: postBodyStyles(theme),
  commentsSection: {
    minHeight: 'calc(70vh - 100px)',
    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
      marginLeft: 0
    },
    // TODO: This is to prevent the Table of Contents from overlapping with the comments section. Could probably fine-tune the breakpoints and spacing to avoid needing this.
    background: "white",
    position: "relative"
  },
})

const PostsPage = ({post, refetch, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  refetch: ()=>void,
  classes: ClassesType,
}) => {
  const location = useLocation();
  const currentUser = useCurrentUser();
  const { recordPostView } = useRecordPostView(post);
  
  const getSequenceId = () => {
    const { params } = location;
    return params.sequenceId || post?.canonicalSequenceId;
  }

  const shouldHideAsSpam = () => {
    // Logged-out users shouldn't be able to see spam posts
    if (post.authorIsUnreviewed && !currentUser) {
      return true;
    }

    return false;
  }

  const getPostDescription = (post: PostsWithNavigation|PostsWithNavigationAndRevision) => {
    if (post.contents?.plaintextDescription) return post.contents.plaintextDescription
    if (post.shortform) return `A collection of shorter posts ${post.user ? `by ${forumTitleSetting.get()} user ${post.user.displayName}` : ''}`
    return null
  }

  const { query, params } = location;
  const { HeadTags, PostsPagePostHeader, PostsPagePostFooter, PostBodyPrefix,
    PostsCommentsThread, ContentItemBody, PostsPageQuestionContent,
    CommentPermalink, AnalyticsInViewTracker, ToCColumn, TableOfContents, RSVPs, 
    AFUnreviewedCommentCount } = Components

  useEffect(() => {
    recordPostView({
      post: post,
      extraEventProperties: {
        sequenceId: getSequenceId()
      }
    });
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post._id]);
  
  if (shouldHideAsSpam()) {
    throw new Error("Logged-out users can't see unreviewed (possibly spam) posts");
  }
  
  const defaultView = commentGetDefaultView(post, currentUser)
  // If the provided view is among the valid ones, spread whole query into terms, otherwise just do the default query
  const commentTerms: CommentsViewTerms = Object.keys(viewNames).includes(query.view)
    ? {...(query as CommentsViewTerms), limit:1000}
    : {view: defaultView, limit: 1000}
  const sequenceId = getSequenceId();
  const sectionData = (post as PostsWithNavigationAndRevision).tableOfContentsRevision || (post as PostsWithNavigation).tableOfContents;
  const htmlWithAnchors = sectionData?.html || post.contents?.html;

  const commentId = query.commentId || params.commentId

  const description = getPostDescription(post)
  const ogUrl = postGetPageUrl(post, true) // open graph
  const canonicalUrl = post.canonicalSource || ogUrl
  // For imageless posts this will be an empty string
  const socialPreviewImageUrl = post.socialPreviewImageUrl

  return (<AnalyticsContext pageContext="postsPage" postId={post._id}>
    <ToCColumn
      tableOfContents={
        sectionData
          ? <TableOfContents sectionData={sectionData} title={post.title} />
          : null
      }
      header={<>
        {!commentId && <HeadTags
          ogUrl={ogUrl} canonicalUrl={canonicalUrl} image={socialPreviewImageUrl}
          title={post.title} description={description} noIndex={post.noIndex}
        />}
        {/* Header/Title */}
        <AnalyticsContext pageSectionContext="postHeader"><div className={classes.title}>
          <div className={classes.centralColumn}>
            {commentId && <CommentPermalink documentId={commentId} post={post} />}
            <PostsPagePostHeader post={post}/>
          </div>
        </div></AnalyticsContext>
      </>}
    >
      <div className={classes.centralColumn}>
        {/* Body */}
        { post.isEvent && post.activateRSVPs &&  <RSVPs post={post} /> }
        { post.isEvent && !post.onlineEvent && <Components.SmallMapPreview post={post} /> }
        <div className={classes.postContent}>
          <PostBodyPrefix post={post} query={query}/>
          <AnalyticsContext pageSectionContext="postBody">
            { htmlWithAnchors && <ContentItemBody dangerouslySetInnerHTML={{__html: htmlWithAnchors}} description={`post ${post._id}`}/> }
          </AnalyticsContext>
        </div>

        <PostsPagePostFooter post={post} sequenceId={sequenceId} />
      </div>

      <AnalyticsInViewTracker eventProps={{inViewType: "commentsSection"}} >
        {/* Answers Section */}
        {post.question && <div className={classes.centralColumn}>
          <div id="answers"/>
          <AnalyticsContext pageSectionContext="answersSection">
            <PostsPageQuestionContent post={post} refetch={refetch}/>
          </AnalyticsContext>
        </div>}
        {/* Comments Section */}
        <div className={classes.commentsSection}>
          <AnalyticsContext pageSectionContext="commentsSection">
            <PostsCommentsThread terms={{...commentTerms, postId: post._id}} post={post} newForm={!post.question}/>
            {(forumTypeSetting.get()=='AlignmentForum') && <AFUnreviewedCommentCount post={post}/>}
          </AnalyticsContext>
        </div>
      </AnalyticsInViewTracker>
    </ToCColumn>
  </AnalyticsContext>);
}

const PostsPageComponent = registerComponent('PostsPage', PostsPage, {
  styles, hocs: [withErrorBoundary],
  areEqual: "auto",
});
declare global {
  interface ComponentTypes {
    PostsPage: typeof PostsPageComponent
  }
}
