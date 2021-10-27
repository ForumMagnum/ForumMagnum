import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils'
import { getUrlClass } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { isServer } from '../../../lib/executionEnvironment';

const SECONDARY_SPACING = 20

const styles = (theme: ThemeType): JssStyles => ({
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
    color: theme.palette.grey[600],
  },
  authors: {
    display: 'inline-block',
    marginRight: SECONDARY_SPACING
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
  divider: {
    marginTop: theme.spacing.unit*2,
    marginLeft:0,
    borderTop: "solid 1px rgba(0,0,0,.1)",
    borderLeft: 'transparent'
  },
});

// On the server, use the 'url' library for parsing hostname out of feed URLs.
// On the client, we instead create an <a> tag, set its href, and extract
// properties from that. (There is a URL class which theoretically would work,
// but it doesn't have the hostname field on IE11 and it's missing entirely on
// Opera Mini.)
const URLClass = getUrlClass()

function getProtocol(url: string): string {
  if (isServer)
    return new URLClass(url).protocol;

  // From https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  var parser = document.createElement('a');
  parser.href = url;
  return parser.protocol;
}

function getHostname(url: string): string {
  if (isServer)
    return new URLClass(url).hostname;

  // From https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  var parser = document.createElement('a');
  parser.href = url;
  return parser.hostname;
}

/// PostsPagePostHeader: The metadata block at the top of a post page, with
/// title, author, voting, an actions menu, etc.
const PostsPagePostHeader = ({post, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType,
}) => {
  const {PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate,
    PostsPageActions, PostsVote, PostsGroupDetails, PostsTopSequencesNav,
    PostsPageEventData, FooterTagList} = Components;
  
  const feedLinkDescription = post.feed?.url && getHostname(post.feed.url)
  const feedLink = post.feed?.url && `${getProtocol(post.feed.url)}//${getHostname(post.feed.url)}`;
  const { major } = extractVersionsFromSemver(post.version)
  const hasMajorRevision = major > 1
  const wordCount = post.contents?.wordCount || 0
  
  return <>
    {post.group && <PostsGroupDetails post={post} documentId={post.group._id} />}
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
          { post.feed && post.feed.user &&
            <LWTooltip title={`Crossposted from ${feedLinkDescription}`}>
              <a href={feedLink} className={classes.feedName}>
                {post.feed.nickname}
              </a>
            </LWTooltip>
          }
          {/* NB: Currently display:none'd */}
          {!!wordCount && !post.isEvent && <LWTooltip title={`${wordCount} words`}>
            <span className={classes.wordCount}>{Math.floor(wordCount/200) || 1 } min read</span>
          </LWTooltip>}
          {!post.isEvent && <span className={classes.date}>
            <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
          </span>}
          {post.types && post.types.length > 0 && <Components.GroupLinks document={post} />}
          <a className={classes.commentsLink} href={"#comments"}>{ postGetCommentCountStr(post)}</a>
          <span className={classes.actions}>
            <AnalyticsContext pageElementContext="tripleDotMenu">
              <PostsPageActions post={post} />
            </AnalyticsContext>
          </span>
        </div>
      </div>
      {!post.shortform && <div className={classes.headerVote}>
        <PostsVote post={post} />
      </div>}
    </div>
    
    {!post.shortform && <AnalyticsContext pageSectionContext="tagHeader">
      <FooterTagList post={post} hideScore />
    </AnalyticsContext>}
    {post.isEvent && <PostsPageEventData post={post}/>}
  </>
}

const PostsPagePostHeaderComponent = registerComponent(
  'PostsPagePostHeader', PostsPagePostHeader, {styles}
);

declare global {
  interface ComponentTypes {
    PostsPagePostHeader: typeof PostsPagePostHeaderComponent,
  }
}
