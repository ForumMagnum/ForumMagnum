import { Components, registerComponent } from '../../../lib/vulcan-lib';
import React, { Component } from 'react';
import { withLocation, getUrlClass } from '../../../lib/routeUtil';
import { Posts } from '../../../lib/collections/posts';
import { Comments } from '../../../lib/collections/comments'
import { postBodyStyles } from '../../../themes/stylePiping'
import withUser from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import classNames from 'classnames';
import { extractVersionsFromSemver } from '../../../lib/editor/utils'
import withRecordPostView from '../../common/withRecordPostView';
import withNewEvents from '../../../lib/events/withNewEvents';
import { userHasPingbacks } from '../../../lib/betas';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import * as _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { forumTitleSetting, forumTypeSetting } from '../../../lib/instanceSettings';

const HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT = 300
const DEFAULT_TOC_MARGIN = 100
const MAX_TOC_WIDTH = 270
const MIN_TOC_WIDTH = 200
const MAX_COLUMN_WIDTH = 720
const SECONDARY_SPACING = 20

const styles = theme => ({
  root: {
    position: "relative",
    [theme.breakpoints.down('sm')]: {
      marginTop: 12
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
  post: {
    maxWidth: 650 + (theme.spacing.unit*4),
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  recommendations: {
    maxWidth: MAX_COLUMN_WIDTH,
    marginLeft: 'auto',
    marginRight: 'auto',
    // Hack to deal with the PostsItem action items being absolutely positioned
    paddingRight: 18,
    paddingLeft: 18,
    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
      paddingLeft: 0
    }
  },
  header: {
    position: 'relative',
    display:"flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.unit*2
  },
  headerLeft: {
    width:"100%"
  },
  headerVote: {
    textAlign: 'center',
    fontSize: 42,
    position: "relative",
  },
  divider: {
    marginTop: theme.spacing.unit*2,
    marginLeft:0,
    borderTop: "solid 1px rgba(0,0,0,.1)",
    borderLeft: 'transparent'
  },
  eventHeader: {
    marginBottom:0,
  },
  secondaryInfo: {
    fontSize: '1.4rem',
    fontFamily: theme.typography.uiSecondary.fontFamily,
  },
  commentsLink: {
    marginRight: SECONDARY_SPACING,
    color: theme.palette.grey[600],
    whiteSpace: "no-wrap",
    display: "inline-block",
    fontSize: theme.typography.body2.fontSize,
  },
  wordCount: {
    display: 'none',
    marginRight: SECONDARY_SPACING,
    color: theme.palette.grey[600],
    whiteSpace: "no-wrap",
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      display: 'inline-block'
    }
  },
  actions: {
    display: 'inline-block',
    cursor: "pointer",
    color: theme.palette.grey[600],
  },
  postBody: {
    marginBottom: 50,
  },
  postContent: postBodyStyles(theme),
  subtitle: {
    ...theme.typography.subtitle,
  },
  voteBottom: {
    position: 'relative',
    fontSize: 42,
    textAlign: 'center',
    display: 'inline-block',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 40
  },
  draft: {
    color: theme.palette.secondary.light
  },
  bottomNavigation: {
    width: 640,
    margin: 'auto',
    [theme.breakpoints.down('sm')]: {
      width:'100%',
      maxWidth: MAX_COLUMN_WIDTH
    }
  },
  authors: {
    display: 'inline-block',
    marginRight: SECONDARY_SPACING
  },
  contentNotice: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
  feedName: {
    fontSize: theme.typography.body2.fontSize,
    marginRight: SECONDARY_SPACING,
    display: 'inline-block',
    color: theme.palette.grey[600],
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  date: {
    marginRight: SECONDARY_SPACING,
    display: 'inline-block',
  },
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
  footerSection: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.4em'
  },
  bottomDate: {
    color: theme.palette.grey[600]
  },
  postType: {
    marginRight: SECONDARY_SPACING
  },
  reviewInfo: {
    textAlign: "center",
    marginBottom: 32
  },
  reviewLabel: {
    ...theme.typography.postStyle,
    ...theme.typography.contentNotice,
    marginBottom: theme.spacing.unit,
  }
})

const getContentType = (post) => {
  if (forumTypeSetting.get() === 'EAForum') {
    return (post.frontpageDate && 'frontpage') ||
    (post.meta && 'meta') ||
    'personal'
  }
  return post.frontpageDate ? 'frontpage' : 'personal'
}

// On the server, use the 'url' library for parsing hostname out of feed URLs.
// On the client, we instead create an <a> tag, set its href, and extract
// properties from that. (There is a URL class which theoretically would work,
// but it doesn't have the hostname field on IE11 and it's missing entirely on
// Opera Mini.)
const URLClass = getUrlClass()

function getProtocol(url) {
  if (Meteor.isServer)
    return new URLClass(url).protocol;

  // From https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  var parser = document.createElement('a');
  parser.href = url;
  return parser.protocol;
}

function getHostname(url) {
  if (Meteor.isServer)
    return new URLClass(url).hostname;

  // From https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  var parser = document.createElement('a');
  parser.href = url;
  return parser.hostname;
}

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

  getDescription = post => {
    if (post.contents?.plaintextDescription) return post.contents.plaintextDescription
    if (post.shortform) return `A collection of shorter posts by ${forumTitleSetting.get()} user ${post.user.displayName}`
    return null
  }

  render() {
    const { post, refetch, currentUser, classes, location: { query, params } } = this.props
    const { PostsPageTitle, PostsAuthors, HeadTags, PostsVote, ContentType,
      LinkPostMessage, PostsCommentsThread, PostsGroupDetails, BottomNavigation,
      PostsTopSequencesNav, PostsPageActions, PostsPageEventData, ContentItemBody, PostsPageQuestionContent,
      TableOfContents, PostsRevisionMessage, AlignmentCrosspostMessage, PostsPageDate, CommentPermalink,
      PingbacksList, FooterTagList, AnalyticsInViewTracker, LWTooltip } = Components

    if (this.shouldHideAsSpam()) {
      throw new Error("Logged-out users can't see unreviewed (possibly spam) posts");
    } else {
      const { html, wordCount = 0 } = post.contents || {}
      const view = _.clone(query).view || Comments.getDefaultView(post, currentUser)
      const commentTerms = _.isEmpty(query.view) ? {view: view, limit: 500} : {...query, limit:500}
      const sequenceId = this.getSequenceId();
      const sectionData = (post as PostsWithNavigationAndRevision).tableOfContentsRevision || (post as PostsWithNavigation).tableOfContents;
      const htmlWithAnchors = (sectionData && sectionData.html) ? sectionData.html : html
      const feedLinkDescription = post.feed?.url && getHostname(post.feed.url)
      const feedLink = post.feed?.url && `${getProtocol(post.feed.url)}//${getHostname(post.feed.url)}`;
      const { major } = extractVersionsFromSemver(post.version)
      const hasMajorRevision = major > 1
      const contentType = getContentType(post)

      const commentId = query.commentId || params.commentId

      const description = this.getDescription(post)

      return (
          <AnalyticsContext pageContext="postsPage" postId={post._id}>
            <div className={classNames(classes.root, {[classes.tocActivated]: !!sectionData})}>
              <HeadTags
                url={Posts.getPageUrl(post, true)} canonicalUrl={post.canonicalSource}
                title={post.title} description={description} noIndex={post.noIndex || !!commentId}
              />
              {/* Header/Title */}
              <AnalyticsContext pageSectionContext="postHeader"><div className={classes.title}>
                <div className={classes.post}>
                  {commentId && <CommentPermalink documentId={commentId} post={post}/>}
                  {post.groupId && <PostsGroupDetails post={post} documentId={post.groupId} />}
                  <AnalyticsContext pageSectionContext="topSequenceNavigation">
                    <PostsTopSequencesNav post={post} />
                  </AnalyticsContext>
                  <div className={classNames(classes.header, {[classes.eventHeader]:post.isEvent})}>
                    <div className={classes.headerLeft}>
                      <PostsPageTitle post={post} />
                      <div className={classes.secondaryInfo}>
                        <span className={classes.authors}>
                          <PostsAuthors post={post}/>
                        </span>
                        <span className={classes.postType}>
                          <ContentType type={contentType}/>
                        </span>
                        { post.feed && post.feed.user &&
                          <LWTooltip title={`Crossposted from ${feedLinkDescription}`}>
                            <a href={feedLink} className={classes.feedName}>
                              {post.feed.nickname}
                            </a>
                          </LWTooltip>
                        }
                        {!!wordCount && !post.isEvent &&  <LWTooltip title={`${wordCount} words`}>
                            <span className={classes.wordCount}>{Math.floor(wordCount/300) || 1 } min read</span>
                        </LWTooltip>}
                        {!post.isEvent && <span className={classes.date}>
                          <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
                        </span>}
                        {post.types && post.types.length > 0 && <Components.GroupLinks document={post} />}
                        <a className={classes.commentsLink} href={"#comments"}>{ Posts.getCommentCountStr(post)}</a>
                        <span className={classes.actions}>
                          <AnalyticsContext pageElementContext="tripleDotMenu">
                            <PostsPageActions post={post} />
                          </AnalyticsContext>
                        </span>
                      </div>
                    </div>
                    {!post.shortform && <div className={classes.headerVote}>
                      <PostsVote
                        collection={Posts}
                        post={post}
                        />
                    </div>}
                  </div>
                  {!post.shortform && <hr className={classes.divider}/>}
                  {post.isEvent && <PostsPageEventData post={post}/>}
                </div>
              </div></AnalyticsContext>
              <div className={classes.toc}>
                <TableOfContents sectionData={sectionData} document={post} />
              </div>
              <div className={classes.gap1}/>
              <div className={classes.content}>
                <div className={classes.post}>
                  {/* Body */}
                  <div className={classes.postBody}>
                    { post.isEvent && <Components.SmallMapPreview post={post} /> }
                    <div className={classes.postContent}>
                      {/* disabled except during Review */}
                      {/* {(post.nominationCount2018 >= 2) && <div className={classes.reviewInfo}>
                        <div className={classes.reviewLabel}>
                          This post has been nominated for the <HoverPreviewLink href="http://lesswrong.com/posts/qXwmMkEBLL59NkvYR/the-lesswrong-2018-review-posts-need-at-least-2-nominations" innerHTML={"2018 Review"}/>
                        </div>
                        <ReviewPostButton post={post} reviewMessage="Write a Review"/>
                      </div>} */}

                      <AlignmentCrosspostMessage post={post} />
                      { post.authorIsUnreviewed && !post.draft && <div className={classes.contentNotice}>This post is awaiting moderator approval</div>}
                      <LinkPostMessage post={post} />
                      {query.revision && <PostsRevisionMessage post={post} />}
                      <AnalyticsContext pageSectionContext="postBody">
                        { html && <ContentItemBody dangerouslySetInnerHTML={{__html: htmlWithAnchors}} description={`post ${post._id}`}/> }
                      </AnalyticsContext>
                    </div>
                    {!post.shortform && <AnalyticsContext pageSectionContext="tagFooter">
                      <FooterTagList post={post}/>
                    </AnalyticsContext>}
                  </div>
                </div>

                {/* Footer */}

                {!post.shortform && (wordCount > HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT) &&
                  <div className={classes.footerSection}>
                    <div className={classes.voteBottom}>
                      <AnalyticsContext pageSectionContext="lowerVoteButton">
                        <PostsVote
                          collection={Posts}
                          post={post}
                          />
                      </AnalyticsContext>
                    </div>
                  </div>}
                {sequenceId && <div className={classes.bottomNavigation}>
                  <AnalyticsContext pageSectionContext="bottomSequenceNavigation">
                    <BottomNavigation post={post}/>
                  </AnalyticsContext>
                </div>}

                {userHasPingbacks(currentUser) && <div className={classes.post}>
                  <AnalyticsContext pageSectionContext="pingbacks">
                    <PingbacksList postId={post._id}/>
                  </AnalyticsContext>
                </div>}

                <AnalyticsInViewTracker eventProps={{inViewType: "commentsSection"}} >
                  {/* Answers Section */}
                  {post.question && <div className={classes.post}>
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

  componentDidUpdate(prevProps) {
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
