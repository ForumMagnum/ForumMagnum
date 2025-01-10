import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils';
import classNames from 'classnames';
import { parseUnsafeUrl } from './PostsPagePostHeader';
import { postGetLink, postGetLinkTarget } from '@/lib/collections/posts/helpers';
import { BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD } from './PostBodyPrefix';
import type { AnnualReviewMarketInfo } from '@/lib/collections/posts/annualReviewMarkets';

export const LW_POST_PAGE_PADDING = 110;

const styles = (theme: ThemeType) => ({
  root: {
    paddingTop: LW_POST_PAGE_PADDING,
    marginBottom: 96,
    [theme.breakpoints.down('xs')]: {
      paddingTop: 16,
      marginBottom: 38
    },
  },
  rootWithAudioPlayer: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: LW_POST_PAGE_PADDING - 48,
    },
    [theme.breakpoints.down('xs')]: {
      paddingTop: 16,
    },
  },
  eventHeader: {
    marginBottom: 0,
  },
  authorAndSecondaryInfo: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: 20,
    ...theme.typography.commentStyle,
    flexWrap: 'wrap',
    color: theme.palette.text.dim3,
    marginTop: 12
  },
  authorInfo: {
    maxWidth: "calc(100% - 60px)",
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      marginBottom: 8,
      fontSize: theme.typography.body2.fontSize,
    },
  },
  feedName: {
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  topRight: {
    position: 'absolute',
    right: 8, 
    top: -48,
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      top: -16,
      marginTop: 8,
      marginBottom: 8
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  audioPlayerWrapper: {
    position: 'absolute',
    right: 8, 
    top: 15,
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      position: 'relative',
      justifyContent: 'flex-end',
      marginLeft: 8,
      marginRight: -64,
    },
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-start',
    },
  },
  sequenceNav: {
    marginBottom: 8,
    marginTop: -22
  },
  eventData: {
    marginTop: 48
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    [theme.breakpoints.down('sm')]: {
      marginBottom: 10
    }
  },
  mobileHeaderVote: {
    textAlign: 'center',
    fontSize: 42,
    marginTop: -55,
    marginLeft: 12,
    [theme.breakpoints.up("sm")]: {
      display: 'none'
    }
  },
  date: {
    marginTop: 8,
    marginBottom: 8
  },
  mobileButtons: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.up('sm')]: {
      display: 'none'
    }
  },
  audioToggle: {
    marginRight: 12,
    display: "flex",
    opacity: 0.75
  },
  readTime: {
    marginRight: 20,
  }
}); 

/// LWPostsPageHeader: The metadata block at the top of a post page, with
/// title, author, voting, an actions menu, etc.
const LWPostsPageHeader = ({post, showEmbeddedPlayer, toggleEmbeddedPlayer, classes, dialogueResponses, answerCount, annualReviewMarketInfo}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  showEmbeddedPlayer?: boolean,
  toggleEmbeddedPlayer?: () => void,
  classes: ClassesType<typeof styles>,
  dialogueResponses: CommentsList[],
  answerCount?: number,
  annualReviewMarketInfo?: AnnualReviewMarketInfo
}) => {
  const { PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate, CrosspostHeaderIcon, PostsGroupDetails, PostsTopSequencesNav, PostsPageEventData, AddToCalendarButton, GroupLinks, LWPostsPageHeaderTopRight, PostsAudioPlayerWrapper, PostsVote, AudioToggle, PostActionsButton, AlignmentCrosspostLink, ReadTime, LWCommentCount } = Components;

  const rssFeedSource = ('feed' in post) ? post.feed : null;
  let feedLinkDomain;
  let feedLink;
  if (rssFeedSource?.url) {
    let feedLinkProtocol;
    ({ hostname: feedLinkDomain, protocol: feedLinkProtocol } = parseUnsafeUrl(rssFeedSource.url));
    feedLink = `${feedLinkProtocol}//${feedLinkDomain}`;
  }

  const hasMajorRevision = ('version' in post) && extractVersionsFromSemver(post.version).major > 1

  const crosspostNode = post.fmCrosspost?.isCrosspost && !post.fmCrosspost.hostedHere &&
    <CrosspostHeaderIcon post={post} />
  
  // TODO: If we are not the primary author of this post, but it was shared with
  // us as a draft, display a notice and a link to the collaborative editor.

  const { hostname: linkpostDomain } = post.url
    ? parseUnsafeUrl(post.url)
    : { hostname: undefined };

  const linkpostTooltip = <div>View the original at:<br/>{post.url}</div>;
  const displayLinkpost = post.url && feedLinkDomain !== linkpostDomain && (post.contents?.wordCount ?? 0) >= BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD;
  const linkpostNode = displayLinkpost ? <LWTooltip title={linkpostTooltip}>
    <a href={postGetLink(post)} target={postGetLinkTarget(post)}>
      Linkpost from {linkpostDomain}
    </a>
  </LWTooltip> : null;

  return <div className={classNames(classes.root, {[classes.eventHeader]: post.isEvent, [classes.rootWithAudioPlayer]: !!showEmbeddedPlayer})}>
      {post.group && <PostsGroupDetails post={post} documentId={post.group._id} />}
      <AnalyticsContext pageSectionContext="topSequenceNavigation">
        {('sequence' in post) && !!post.sequence && <div className={classes.sequenceNav}>
          <PostsTopSequencesNav post={post} />
        </div>}
      </AnalyticsContext>
      <div>
        <span className={classes.topRight}>
          <LWPostsPageHeaderTopRight post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} annualReviewMarketInfo={annualReviewMarketInfo} />
        </span>
        {post && <span className={classes.audioPlayerWrapper}>
          <PostsAudioPlayerWrapper showEmbeddedPlayer={!!showEmbeddedPlayer} post={post}/>
        </span>}
      </div>
      <div className={classes.titleSection}>
        <div className={classes.title}>
          <PostsPageTitle post={post} />
          <div className={classes.authorAndSecondaryInfo}>
            <div className={classes.authorInfo}>
              <PostsAuthors post={post} pageSectionContext="post_header" />
            </div>
            {crosspostNode}
            {!post.isEvent && <div className={classes.date}>
              <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
            </div>}
            {rssFeedSource && rssFeedSource.user &&
              <LWTooltip title={`Crossposted from ${feedLinkDomain}`} className={classes.feedName}>
                <a href={feedLink}>{rssFeedSource.nickname}</a>
              </LWTooltip>
            }
            <AlignmentCrosspostLink post={post} />
            {linkpostNode}
            {post.isEvent && <GroupLinks document={post} noMargin />}
            <AddToCalendarButton post={post} label="Add to calendar" hideTooltip />
            <div className={classes.mobileButtons}>
              <div className={classes.readTime}>
                <ReadTime post={post} dialogueResponses={dialogueResponses} />
              </div>
              <LWCommentCount answerCount={answerCount} commentCount={post.commentCount} label={false} />
              <div className={classes.audioToggle}>
                <AudioToggle post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
              </div>
              <PostActionsButton post={post} flip />
            </div>
          </div>
        </div>
        <div className={classes.mobileHeaderVote}>
          <PostsVote post={post} />
        </div>
      </div>
      {post.isEvent && <div className={classes.eventData}>
        <PostsPageEventData post={post}/>
      </div>}
  </div>
}

const LWPostsPageHeaderComponent = registerComponent(
  'LWPostsPageHeader', LWPostsPageHeader, {styles}
);

declare global {
  interface ComponentTypes {
    LWPostsPageHeader: typeof LWPostsPageHeaderComponent,
  }
}

