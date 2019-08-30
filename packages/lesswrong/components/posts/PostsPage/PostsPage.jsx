import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withLocation, getUrlClass } from '../../../lib/routeUtil';
import { Posts } from '../../../lib/collections/posts';
import { Comments } from '../../../lib/collections/comments'
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import { postBodyStyles } from '../../../themes/stylePiping'
import withUser from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import classNames from 'classnames';
import { extractVersionsFromSemver } from '../../../lib/editor/utils'
import withRecordPostView from '../../common/withRecordPostView';
import withNewEvents from '../../../lib/events/withNewEvents.jsx';

const HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT = 300
const DEFAULT_TOC_MARGIN = 100
const MAX_TOC_WIDTH = 270
const MIN_TOC_WIDTH = 200
const MAX_COLUMN_WIDTH = 720

const styles = theme => ({
  root: {
    position: "relative",
    [theme.breakpoints.down('sm')]: {
      marginTop: 20
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
    marginBottom: 32
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
    marginBottom: theme.spacing.unit*2,
    marginLeft:0,
    borderTop: "solid 1px rgba(0,0,0,.1)",
    borderLeft: 'transparent'
  },
  eventHeader: {
    marginBottom:0,
  },
  secondaryInfo: {
    fontSize: '1.4rem',
  },
  commentsLink: {
    marginLeft: 20,
    color: theme.palette.grey[600],
    whiteSpace: "no-wrap",
    fontSize: theme.typography.body1.fontSize,
  },
  actions: {
    display: 'inline-block',
    marginLeft: 15,
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
  inline: {
    display: 'inline-block'
  },
  unreviewed: {
    fontStyle: "italic",
    color: theme.palette.grey[600],
    marginBottom: theme.spacing.unit*2,
    fontSize:".9em",
    maxWidth: "100%",
    overflowX: "hidden",
    textOverflow: "ellipsis",
    ...theme.typography.postStyle,
  },
  feedName: {
    fontSize: theme.typography.body1.fontSize,
    marginLeft: 20,
    display: 'inline-block',
    color: theme.palette.grey[600],
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
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
    marginLeft: 20
  }
})

const getContentType = (post) => {
  if (getSetting('forumType') === 'EAForum') {
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

class PostsPage extends Component {

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

  render() {
    const { post, refetch, currentUser, classes, location: { query: { commentId }} } = this.props
    const { PostsPageTitle, PostsAuthors, HeadTags, PostsVote, SmallMapPreviewWrapper, ContentType,
      LinkPostMessage, PostsCommentsThread, PostsGroupDetails, BottomNavigation,
      PostsTopSequencesNav, PostsPageActions, PostsPageEventData, ContentItemBody, PostsPageQuestionContent,
      TableOfContents, PostsRevisionMessage, AlignmentCrosspostMessage, PostsPageDate, CommentPermalink } = Components

    if (this.shouldHideAsSpam()) {
      throw new Error("Logged-out users can't see unreviewed (possibly spam) posts");
    } else {
      const { html, plaintextDescription, markdown, wordCount = 0 } = post.contents || {}
      const { query } = this.props.location;
      const view = _.clone(query).view || Comments.getDefaultView(post, currentUser)
      const description = plaintextDescription ? plaintextDescription : (markdown && markdown.substring(0, 300))
      const commentTerms = _.isEmpty(query.view) ? {view: view, limit: 500} : {...query, limit:500}
      const sequenceId = this.getSequenceId();
      const sectionData = post.tableOfContents;
      const htmlWithAnchors = (sectionData && sectionData.html) ? sectionData.html : html
      const feedLinkDescription = post.feed?.url && getHostname(post.feed.url)
      const feedLink = post.feed?.url && `${getProtocol(post.feed.url)}//${getHostname(post.feed.url)}`;
      const { major } = extractVersionsFromSemver(post.version)
      const hasMajorRevision = major > 1
      const contentType = getContentType(post)

      return (
        <div className={classNames(classes.root, {[classes.tocActivated]: !!sectionData})}>
          <HeadTags url={Posts.getPageUrl(post, true)} canonicalUrl={post.canonicalSource} title={post.title} description={description}/>
          {/* Header/Title */}
          <div className={classes.title}>
            <div className={classes.post}>
              <CommentPermalink documentId={commentId} post={post}/>
              {post.groupId && <PostsGroupDetails post={post} documentId={post.groupId} />}
              <PostsTopSequencesNav post={post} sequenceId={sequenceId} />
              <div className={classNames(classes.header, {[classes.eventHeader]:post.isEvent})}>
                <div className={classes.headerLeft}>
                  <PostsPageTitle post={post} />
                  <div className={classes.secondaryInfo}>
                    <span className={classes.inline}>
                      <PostsAuthors post={post}/>
                    </span>
                    <span className={classes.postType}>
                      <ContentType type={contentType}/>
                    </span>
                    { post.feed && post.feed.user &&
                      <Tooltip title={`Crossposted from ${feedLinkDescription}`}>
                        <a href={feedLink} className={classes.feedName}>
                          {post.feed.nickname}
                        </a>
                      </Tooltip>
                    }
                    {!post.isEvent && <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />}
                    {post.types && post.types.length > 0 && <Components.GroupLinks document={post} />}
                    <a className={classes.commentsLink} href={"#comments"}>{ Posts.getCommentCountStr(post)}</a>
                    <span className={classes.actions}>
                        <PostsPageActions post={post} />
                    </span>
                  </div>
                </div>
                <div className={classes.headerVote}>
                  <PostsVote
                    collection={Posts}
                    post={post}
                    currentUser={currentUser}
                    />
                </div>
              </div>
              <hr className={classes.divider}/>
              {post.isEvent && <PostsPageEventData post={post}/>}
            </div>
          </div>
          <div className={classes.toc}>
            <TableOfContents sectionData={sectionData} document={post} />
          </div>
          <div className={classes.gap1}/>
          <div className={classes.content}>
            <div className={classes.post}>
              {/* Body */}
              <div className={classes.postBody}>
                { post.isEvent && <SmallMapPreviewWrapper post={post} /> }
                <div className={classes.postContent}>
                  <AlignmentCrosspostMessage post={post} />
                  { post.authorIsUnreviewed && <div className={classes.unreviewed}>This post is awaiting moderator approval</div>}
                  <LinkPostMessage post={post} />
                  {query.revision && <PostsRevisionMessage post={post} />}
                  { html && <ContentItemBody dangerouslySetInnerHTML={{__html: htmlWithAnchors}}/> }
                </div>
              </div>
            </div>

            {/* Footer */}
            {(wordCount > HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT) &&
              <div className={classes.footerSection}>
                <div className={classes.voteBottom}>
                  <PostsVote
                    collection={Posts}
                    post={post}
                    currentUser={currentUser}
                    />
                </div>
              </div>}
            {sequenceId && <div className={classes.bottomNavigation}>
              <BottomNavigation post={post}/>
            </div>}

            {/* Answers Section */}
            {post.question && <div className={classes.post}>
              <div id="answers"/>
              <PostsPageQuestionContent terms={{...commentTerms, postId: post._id}} post={post} refetch={refetch}/>
            </div>}
            {/* Comments Section */}
            <div className={classes.commentsSection}>
              <PostsCommentsThread terms={{...commentTerms, postId: post._id}} post={post} newForm={!post.question} guidelines={!post.question}/>
            </div>
          </div>
          <div className={classes.gap2}/>
        </div>
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

registerComponent(
  'PostsPage', PostsPage,
  withUser, withLocation,
  withStyles(styles, { name: "PostsPage" }),
  withRecordPostView,
  withNewEvents,
  withErrorBoundary,
);
