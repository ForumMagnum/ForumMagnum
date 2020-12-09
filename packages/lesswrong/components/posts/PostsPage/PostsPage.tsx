import { Components, registerComponent } from '../../../lib/vulcan-lib';
import React, { Component } from 'react';
import { withLocation } from '../../../lib/routeUtil';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers'
import { postBodyStyles } from '../../../themes/stylePiping'
import withUser from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import classNames from 'classnames';
import withRecordPostView from '../../common/withRecordPostView';
import withNewEvents from '../../../lib/events/withNewEvents';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { forumTitleSetting } from '../../../lib/instanceSettings';
import { viewNames } from '../../comments/CommentsViews';

const DEFAULT_TOC_MARGIN = 100
const MAX_TOC_WIDTH = 270
const MIN_TOC_WIDTH = 200
export const MAX_COLUMN_WIDTH = 720

// Also used in PostsCompareRevisions
export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    [theme.breakpoints.down('sm')]: {
      paddingTop: 12
    }
  },
  tocActivated: {
    // Check for support for template areas before applying
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateColumns: `
        1fr
        minmax(${MIN_TOC_WIDTH}px, ${MAX_TOC_WIDTH}px)
        minmax(0px, ${DEFAULT_TOC_MARGIN}px)
        minmax(min-content, ${MAX_COLUMN_WIDTH}px)
        minmax(0px, ${DEFAULT_TOC_MARGIN}px)
        1.5fr
      `,
      gridTemplateAreas: `
        "... ... .... title   .... ..."
        "... toc gap1 content gap2 ..."
      `,
    },
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
  },
  title: {
    gridArea: 'title',
    marginBottom: 32,
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing.titleDividerSpacing,
    }
  },
  toc: {
    '@supports (grid-template-areas: "title")': {
      gridArea: 'toc',
      position: 'unset',
      width: 'unset'
    },
    //Fallback styles in case we don't have CSS-Grid support. These don't get applied if we have a grid
    position: 'absolute',
    width: MAX_TOC_WIDTH,
    left: -DEFAULT_TOC_MARGIN,
  },
  content: { gridArea: 'content' },
  gap1: { gridArea: 'gap1'},
  gap2: { gridArea: 'gap2'},
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

interface ExternalProps {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  refetch: any,
}
interface PostsPageProps extends ExternalProps, WithUserProps, WithLocationProps, WithStylesProps {
  closeAllEvents: any,
  recordPostView: any,
}

class PostsPage extends Component<PostsPageProps> {

  getSequenceId() {
    const { post } = this.props;
    const { params } = this.props.location;
    return params.sequenceId || post?.canonicalSequenceId;
  }

  shouldHideAsSpam() {
    const { post, currentUser } = this.props;

    // Logged-out users shouldn't be able to see spam posts
    if (post.authorIsUnreviewed && !currentUser) {
      return true;
    }

    return false;
  }

  getDescription = (post: PostsWithNavigation|PostsWithNavigationAndRevision) => {
    if (post.contents?.plaintextDescription) return post.contents.plaintextDescription
    if (post.shortform) return `A collection of shorter posts ${post.user ? `by ${forumTitleSetting.get()} user ${post.user.displayName}` : ''}`
    return null
  }

  render() {
    const { post, refetch, currentUser, classes, location: { query, params } } = this.props
    const { HeadTags, PostsPagePostHeader, PostsPagePostFooter, PostBodyPrefix,
      PostsCommentsThread, ContentItemBody,
      PostsPageQuestionContent, TableOfContents, CommentPermalink,
      AnalyticsInViewTracker } = Components

    if (this.shouldHideAsSpam()) {
      throw new Error("Logged-out users can't see unreviewed (possibly spam) posts");
    } else {
      const defaultView = commentGetDefaultView(post, currentUser)
      // If the provided view is among the valid ones, spread whole query into terms, otherwise just do the default query
      const commentTerms = Object.keys(viewNames).includes(query.view) ? {...query, limit:500} : {view: defaultView, limit: 500}
      const sequenceId = this.getSequenceId();
      const sectionData = (post as PostsWithNavigationAndRevision).tableOfContentsRevision || (post as PostsWithNavigation).tableOfContents;
      const htmlWithAnchors = sectionData?.html || post.contents?.html;

      const commentId = query.commentId || params.commentId

      const description = this.getDescription(post)
      const ogUrl = postGetPageUrl(post, true) // open graph
      const canonicalUrl = post.canonicalSource || ogUrl
      // For imageless posts this will be an empty string
      const socialPreviewImageUrl = post.socialPreviewImageUrl

      return (
          <AnalyticsContext pageContext="postsPage" postId={post._id}>
            <div className={classNames(classes.root, {[classes.tocActivated]: !!sectionData})}>
              <HeadTags
                ogUrl={ogUrl} canonicalUrl={canonicalUrl} image={socialPreviewImageUrl}
                title={post.title} description={description} noIndex={post.noIndex || !!commentId}
              />
              {/* Header/Title */}
              <AnalyticsContext pageSectionContext="postHeader"><div className={classes.title}>
                <div className={classes.centralColumn}>
                  {commentId && <CommentPermalink documentId={commentId} post={post}/>}
                  <PostsPagePostHeader post={post}/>
                </div>
              </div></AnalyticsContext>
              <div className={classes.toc}>
                <TableOfContents sectionData={sectionData} document={post} />
              </div>
              <div className={classes.gap1}/>
              <div className={classes.content}>
                <div className={classes.centralColumn}>
                  {/* Body */}
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
                    </AnalyticsContext>
                  </div>
                </AnalyticsInViewTracker>
              </div>
              <div className={classes.gap2}/>
            </div>
          </AnalyticsContext>
      );
    }
  }

  async componentDidMount() {
    this.props.recordPostView({
      post: this.props.post,
      extraEventProperties: {
        sequenceId: this.getSequenceId()
      }
    });
  }

  componentDidUpdate(prevProps: PostsPageProps) {
    if (prevProps.post && this.props.post && prevProps.post._id !== this.props.post._id) {
      this.props.closeAllEvents();
      this.props.recordPostView({
        post: this.props.post,
        extraEventProperties: {
          sequenceId: this.getSequenceId(),
        }
      });
    }
  }
}

const PostsPageComponent = registerComponent<ExternalProps>(
  'PostsPage', PostsPage, {
    styles,
    hocs: [
      withUser, withLocation,
      withRecordPostView,
      withNewEvents,
      withErrorBoundary
    ]
  }
);

declare global {
  interface ComponentTypes {
    PostsPage: typeof PostsPageComponent
  }
}
