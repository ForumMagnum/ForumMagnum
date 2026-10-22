import React, { useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import FormatDate from '@/components/common/FormatDate';
import LWTooltip from '@/components/common/LWTooltip';
import PostsTooltip from '@/components/posts/PostsPreviewTooltip/PostsTooltip';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message';
import PeopleIcon from '@/lib/vendor/@material-ui/icons/src/People';
import FullscreenIcon from '@/lib/vendor/@material-ui/icons/src/Fullscreen';
import FeedContentBody from '@/components/ultraFeed/FeedContentBody';
import MetaInfo from '@/components/common/MetaInfo';
import { useForumType } from '@/components/hooks/useForumType';
import { commentGetPageUrlFromIds, commentIsHiddenPendingReview } from '@/lib/collections/comments/helpers';
import type { ForumTypeString } from '@/lib/instanceSettings';
import ShowParentComment from '@/components/comments/ShowParentComment';
import UsersName from '@/components/users/UsersName';
import Loading from '@/components/vulcan-core/Loading';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import type { InboxAction } from './inboxReducer';
import { isPost, POSITIVE_KARMA, type ContentItem } from './helpers';
import ModerationContentStatus from './ModerationContentStatus';

const INITIAL_WORDS = 75;
const EXPANSION_FACTOR = 4;
const POST_EXPANDED_WORDS = 1000;
// The parent is only context for the reply being judged, so it starts as a short excerpt
const PARENT_INITIAL_WORDS = 40;

const ParentCommentQuery = gql(`
  query ModerationFeedCardParentComment($documentId: String) {
    comment(selector: { _id: $documentId }) {
      result {
        ...CommentsList
      }
    }
  }
`);

function tint(color: string) {
  return `linear-gradient(${color}, ${color})`;
}

const styles = defineStyles('ModerationFeedCard', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  card: {
    backgroundColor: theme.palette.panelBackground.bannerAdTranslucentHeavy,
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Quoted parents always get the neutral grey, since the reply's karma tint is about the reply alone
  parentsSection: {
    padding: '10px 16px 0 0',
    // The divider under the last quote marks where the reply's tint begins
    '& > :last-child': {
      marginBottom: 0,
    },
  },
  replySection: {
    padding: '10px 16px 12px 0',
  },
  selected: {
    boxShadow: `0 0 0 1px ${theme.palette.grey[600]}`,
  },
  positiveTint: {
    backgroundImage: tint(theme.palette.background.primaryTranslucent),
  },
  negativeTint: {
    backgroundImage: tint('light-dark(rgba(191,54,12,0.07),rgba(191,54,12,0.2))'),
  },
  neutralTint: {
    backgroundImage: tint(theme.palette.greyAlpha(0.03)),
  },
  // Quoted context for the reply below it, kept visually quieter than the reply itself
  parent: {
    margin: '0 0 10px 10px',
    padding: '2px 0 2px 10px',
    borderLeft: `2px solid ${theme.palette.greyAlpha(0.15)}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  // Inset 10px from both card edges (the card has 16px of right padding and none on the left),
  // so it separates the parent from the reply without reading as a card boundary
  parentDivider: {
    margin: '0 -6px 10px 10px',
    borderTop: theme.palette.border.faint,
  },
  dateLink: {
    color: 'inherit',
  },
  showGrandparentButton: {
    padding: 0,
    border: 'none',
    background: 'none',
    font: 'inherit',
    whiteSpace: 'nowrap',
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  parentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: theme.palette.grey[700],
    '& .ShowParentComment-root': {
      padding: 0,
    },
  },
  iconGutter: {
    display: 'grid',
    gridTemplateColumns: '28px minmax(0, 1fr)',
  },
  iconColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingTop: 3,
    '& .ShowParentComment-root': {
      padding: 0,
    },
  },
  gutterIcon: {
    height: 14,
    width: 14,
    color: theme.palette.grey[500],
  },
  metaKarma: {
    fontWeight: 600,
  },
  username: {
    fontWeight: 500,
  },
  fullscreenTooltip: {
    marginLeft: 'auto',
  },
  fullscreenButton: {
    display: 'flex',
    cursor: 'pointer',
    color: theme.palette.grey[500],
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
  fullscreenIcon: {
    height: 18,
    width: 18,
  },
  coauthorChip: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '1px 6px',
    borderRadius: 3,
    backgroundColor: theme.palette.greyAlpha(0.06),
    color: theme.palette.grey[700],
  },
  coauthorLead: {
    fontSize: 12,
    color: theme.palette.grey[600],
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
  },
  metaRow: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: theme.palette.grey[600],
  },
  positive: {
    color: theme.palette.primary.main,
  },
  negative: {
    color: theme.palette.error.main,
  },
  cardTitle: {
    minWidth: 0,
    fontSize: 15,
    fontStyle: 'italic',
    color: theme.palette.grey[500],
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  title: {
    color: theme.palette.greyAlpha(0.55),
    fontStyle: 'italic',
  },
  ownPostTitle: {
    display: 'block',
    fontFamily: theme.palette.fonts.serifStack,
    fontSize: 17,
    lineHeight: 1.3,
    color: theme.palette.greyAlpha(0.87),
  },
  compactBody: {
    '& .ContentStyles-base, & .ContentStyles-base p, & .ContentStyles-base li': {
      fontSize: 14,
      lineHeight: 1.45,
    },
    '& .ContentStyles-base p': {
      marginTop: 0,
      marginBottom: '0.5em',
    },
    '& .ContentStyles-base p:last-child': {
      marginBottom: 0,
    },
    '& .paragraph-gap': {
      display: 'block',
      height: '0.5em',
    },
  },
  faded: {
    opacity: 0.85,
  },
  pendingApprovalNotice: {
    fontSize: 13,
  },
  // Follows compactBody so these sizes win
  parentBody: {
    '& .ContentStyles-base, & .ContentStyles-base p, & .ContentStyles-base li': {
      fontSize: 13,
      lineHeight: 1.4,
      color: theme.palette.grey[800],
    },
  },
}));

// Comments often separate paragraphs with a double line break, which renders as a full
// blank line; browsers ignore sizing on <br>, so swap the extra breaks for a short spacer
function compactParagraphBreaks(html: string) {
  return html.replace(/<br\s*\/?>(\s*<br\s*\/?>)+/g, '<br><span class="paragraph-gap"></span>');
}

// The same notices the post page and comment items show while content awaits moderation
function getPendingApprovalNotice(item: ContentItem, forumType: ForumTypeString) {
  if (item.rejected) return null;
  if (isPost(item)) {
    return item.authorIsUnreviewed && !item.draft ? 'This post is unlisted and is still awaiting moderation.' : null;
  }
  return commentIsHiddenPendingReview(item, forumType)
    ? 'This comment will not be visible to other users until the moderation team has reviewed it.'
    : null;
}

function getCommentPermalink(comment: CommentsList) {
  return commentGetPageUrlFromIds({
    postId: comment.postId,
    tagSlug: comment.tag?.slug,
    tagCommentType: comment.tagCommentType,
    commentId: comment._id,
  });
}

function getPermalink(item: ContentItem) {
  return isPost(item) ? postGetPageUrl(item) : getCommentPermalink(item);
}

function isOnOwnShortform(comment: SunshineCommentsList) {
  return !!comment.post?.shortform && comment.post.userId === comment.userId;
}

function getKindLabel(item: ContentItem) {
  if (isPost(item)) return 'Post';
  return item.post?.shortform && !item.parentCommentId ? 'Quick take' : 'Comment';
}

// The lead author, plus a count of any co-authors besides the user being reviewed
function getCoauthoredLead(post: SunshinePostsList) {
  const otherCoauthors = Math.max((post.coauthors?.length ?? 0) - 1, 0);
  return `lead: ${post.user?.displayName ?? 'unknown'}${otherCoauthors > 0 ? ` +${otherCoauthors}` : ''}`;
}

// The hide toggle lives on the parent itself while it's shown; the reply's gutter only has the show toggle
// Shown above `child`, and can show its own parent above it in turn, one level at a time
const ParentComment = ({ commentId, child, onHide }: {
  commentId: string;
  child: CommentsList;
  onHide: () => void;
}) => {
  const classes = useStyles(styles);
  const [wordLimit, setWordLimit] = useState(PARENT_INITIAL_WORDS);
  const [showOwnParent, setShowOwnParent] = useState(false);
  const { data, loading } = useQuery(ParentCommentQuery, { variables: { documentId: commentId } });
  const parent = data?.comment?.result;

  return <>
    {parent?.parentCommentId && showOwnParent &&
      <ParentComment commentId={parent.parentCommentId} child={parent} onHide={() => setShowOwnParent(false)} />}
    <div className={classes.parent}>
      {!parent
        ? loading && <Loading />
        : <>
          <div className={classes.parentMeta}>
            <ShowParentComment comment={child} active onClick={onHide} />
            <UsersName user={parent.user} simple className={classes.username} />
            <span>{parent.baseScore ?? 0}</span>
            <Link to={getCommentPermalink(parent)} className={classes.dateLink}>
              <FormatDate date={parent.postedAt} />
            </Link>
            <span>(parent comment)</span>
            {parent.parentCommentId && !showOwnParent && <button
              type="button"
              className={classes.showGrandparentButton}
              onClick={() => setShowOwnParent(true)}
            >
              show its parent
            </button>}
          </div>
          <div className={classNames(classes.compactBody, classes.parentBody)}>
            {/* FeedContentBody only expands once, so remount it at a higher limit for each further "read more" */}
            <FeedContentBody
              key={wordLimit}
              html={compactParagraphBreaks(parent.contents?.html ?? '')}
              wordCount={parent.contents?.wordCount ?? 0}
              initialWordCount={wordLimit}
              maxWordCount={wordLimit * EXPANSION_FACTOR}
              onExpand={() => setWordLimit(wordLimit * EXPANSION_FACTOR)}
              expandOnlyFromSuffix
            />
          </div>
        </>}
    </div>
    <div className={classes.parentDivider} />
  </>;
};

const ModerationFeedCard = ({ item, isSelected, initialWordCount = INITIAL_WORDS, showParentDefault = false, isRunningLlmCheck, onReject, onFullscreen, dispatch, isCoauthored = false }: {
  item: ContentItem;
  isSelected: boolean;
  initialWordCount?: number;
  // Starts with the parent comment (truncated) shown above a reply
  showParentDefault?: boolean;
  isRunningLlmCheck: boolean;
  // Absent for co-authored posts, which can't be rejected from here
  onReject?: () => void;
  // Shows the post in full across the feed's column
  onFullscreen?: () => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  // Someone else's post that the reviewed user co-authored: shown for context, not moderated here
  isCoauthored?: boolean;
}) => {
  const classes = useStyles(styles);
  const { forumType } = useForumType();
  const [showParent, setShowParent] = useState(showParentDefault);
  const [wordLimit, setWordLimit] = useState(initialWordCount);
  // Posts are long enough that a small first step means clicking "read more" over and over
  const nextWordLimit = isPost(item)
    ? Math.max(wordLimit * EXPANSION_FACTOR, POST_EXPANDED_WORDS)
    : wordLimit * EXPANSION_FACTOR;
  const karma = item.baseScore ?? 0;
  const parentCommentId = isPost(item) ? null : item.parentCommentId;
  const pendingApprovalNotice = getPendingApprovalNotice(item, forumType);

  return (
    <div className={classes.root}>
      <div className={classNames(classes.card, { [classes.selected]: isSelected })}>
        {parentCommentId && showParent && !isPost(item) && <div className={classNames(classes.parentsSection, classes.neutralTint)}>
          <ParentComment commentId={parentCommentId} child={item} onHide={() => setShowParent(false)} />
        </div>}
        <div className={classNames(classes.replySection, {
          [classes.positiveTint]: !isCoauthored && karma >= POSITIVE_KARMA,
          [classes.negativeTint]: !isCoauthored && karma < 0,
          [classes.neutralTint]: isCoauthored || (karma >= 0 && karma < POSITIVE_KARMA),
        })}>
          <div className={classes.iconGutter}>
            <div className={classes.iconColumn}>
              <LWTooltip title={isCoauthored ? 'Co-authored post' : getKindLabel(item)} placement="left">
                {isCoauthored
                  ? <PeopleIcon className={classes.gutterIcon} />
                  : isPost(item)
                    ? <DescriptionIcon className={classes.gutterIcon} />
                    : <MessageIcon className={classes.gutterIcon} />}
              </LWTooltip>
              {parentCommentId && !showParent && !isPost(item) &&
                <ShowParentComment comment={item} onClick={() => setShowParent(true)} />}
            </div>
            <div className={classes.content}>
              <div className={classes.metaRow}>
                {/* Co-authored posts name their lead author instead */}
                {!isCoauthored && <UsersName user={item.user} simple className={classes.username} />}
                <span className={classNames(classes.metaKarma, {
                  [classes.positive]: karma >= POSITIVE_KARMA,
                  [classes.negative]: karma < 0,
                })}>
                  {karma}
                </span>
                <Link to={getPermalink(item)} className={classes.dateLink}>
                  <FormatDate date={item.postedAt} />
                </Link>
                {isCoauthored && isPost(item)
                  ? <>
                    <span className={classes.coauthorChip}>Co-author</span>
                    <span className={classes.coauthorLead}>{getCoauthoredLead(item)}</span>
                  </>
                  : <ModerationContentStatus
                    item={item}
                    isRunningLlmCheck={isRunningLlmCheck}
                    onReject={onReject}
                    dispatch={dispatch}
                  />}
                {onFullscreen && <LWTooltip title="Show full post" placement="top" className={classes.fullscreenTooltip}>
                  <span className={classes.fullscreenButton} onClick={onFullscreen}>
                    <FullscreenIcon className={classes.fullscreenIcon} />
                  </span>
                </LWTooltip>}
              </div>
              {!isPost(item) && item.post && <div className={classes.cardTitle}>
                {isOnOwnShortform(item)
                  ? 'Quick take'
                  : <>on <PostsTooltip postId={item.post._id} inlineBlock={false}>
                    <Link to={postGetPageUrl(item.post)} className={classes.title}>{item.post.title}</Link>
                  </PostsTooltip>{item.post.userId === item.userId && ' (own)'}</>}
              </div>}
              {isPost(item) && <PostsTooltip post={item} As="div" inlineBlock={false}>
                <Link to={postGetPageUrl(item)} className={classNames(classes.ownPostTitle, { [classes.faded]: item.rejected })}>
                  {item.title}
                </Link>
              </PostsTooltip>}
              <div className={classNames(classes.compactBody, { [classes.faded]: item.rejected })}>
                {/* FeedContentBody only expands once, so remount it at a higher limit for each further "read more" */}
                <FeedContentBody
                  key={wordLimit}
                  html={compactParagraphBreaks(item.contents?.html ?? '')}
                  wordCount={item.contents?.wordCount ?? 0}
                  initialWordCount={wordLimit}
                  maxWordCount={nextWordLimit}
                  onExpand={() => setWordLimit(nextWordLimit)}
                  expandOnlyFromSuffix
                  serifStyle={isPost(item)}
                />
              </div>
              {pendingApprovalNotice && <MetaInfo className={classes.pendingApprovalNotice}>[{pendingApprovalNotice}]</MetaInfo>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationFeedCard;
