import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Link } from '@/lib/reactRouterWrapper';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { nofollowKarmaThreshold } from '@/lib/instanceSettings';
import { getPingbackElementId, pingbackExcerptLinkClass } from '@/lib/pingback';
import { scrollFocusOnElement } from '@/lib/scrollUtils';
import { isMobile } from '@/lib/utils/isMobile';
import { flattenCommentBranch, type CommentTreeNode } from '@/lib/utils/unflatten';
import { getDefaultVotingSystem } from '@/lib/voting/getVotingSystem';
import { useForumType } from '@/components/hooks/useForumType';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useFilteredCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover';
import { useVote } from '../votes/withVote';
import type { VotingProps } from '../votes/votingProps';
import OverallVoteAxis from '../votes/OverallVoteAxis';
import PostsTooltip from '../posts/PostsPreviewTooltip/PostsTooltip';
import UsersName from '../users/UsersName';
import AnimatedCollapse from '../common/AnimatedCollapse';
import FormatDate from '../common/FormatDate';
import ContentStyles from '../common/ContentStyles';
import LWPopper from '../common/LWPopper';
import { ContentItemBody } from '../contents/ContentItemBody';
import CommentFrame, { getEffectiveNestingLevel, getReplyFormLevelClass } from './CommentFrame';
import CommentsNode from './CommentsNode';
import CommentsNewForm from './CommentsNewForm';
import { commentBottomStyles } from './CommentsItem/CommentBottom';
import { commentsItemStyles } from './CommentsItem/CommentsItem';
import { CommentCollapseButton } from './CommentsItem/CommentsItemMeta';
import { useCommentLinkState } from './CommentsItem/useCommentLink';
import { SINGLE_LINE_PADDING_TOP, singleLineCommentStyles } from './SingleLineComment';
import { useExpansionHeightAnimation } from './useExpansionHeightAnimation';
import type { CommentTreeOptions } from './commentTree';
import type { PingbackWithSourcePost } from './interleavePingbacks';

const PINGBACK_NESTING_LEVEL = 1;

const styles = defineStyles("CommentsPingbackItem", (theme: ThemeType) => ({
  root: {
    paddingLeft: 12,
    paddingRight: 12,
    ...theme.typography.commentStyle,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 6,
    rowGap: 6,
    paddingTop: "0.6em",
    marginBottom: 8,
    color: theme.palette.text.dim,
  },
  mentionedIn: {
    display: "flex",
    alignItems: "center",
  },
  postTitle: {
    fontWeight: 600,
    color: theme.palette.text.normal,
  },
  excerpt: {
    maxWidth: "100%",
    overflowX: "hidden",
    [`& .${pingbackExcerptLinkClass}`]: {
      backgroundColor: theme.palette.editor.commentMarker,
    },
  },
  singleLineLabel: {
    flexShrink: 0,
    paddingTop: SINGLE_LINE_PADDING_TOP,
    paddingBottom: SINGLE_LINE_PADDING_TOP,
  },
  singleLinePostTitle: {
    flexShrink: 0,
    maxWidth: "50%",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  replies: {
    position: "relative",
  },
}));

const PingbackMeta = ({pingback, voteProps, hideKarma, collapseButton}: {
  pingback: PingbackWithSourcePost,
  voteProps: VotingProps<VoteableTypeClient>,
  hideKarma?: boolean,
  collapseButton?: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const { sourcePost } = pingback;

  return <div className={classes.meta}>
    <span className={classes.mentionedIn}>
      {collapseButton}
      Mentioned in
    </span>
    <PostsTooltip postId={sourcePost._id} inlineBlock>
      <Link className={classes.postTitle} to={postGetPageUrl(sourcePost)}>
        {sourcePost.title}
      </Link>
    </PostsTooltip>
    <span>by</span>
    <UsersName user={sourcePost.user} />
    <FormatDate date={sourcePost.postedAt} />
    <OverallVoteAxis
      document={pingback}
      voteProps={voteProps}
      hideKarma={hideKarma}
      verticalArrows
      largeArrows
    />
  </div>
}

const PingbackExcerpt = ({pingback}: {
  pingback: PingbackWithSourcePost,
}) => {
  const classes = useStyles(styles);
  const { forumType } = useForumType();

  return <ContentStyles contentType="comment">
    <ContentItemBody
      className={classes.excerpt}
      dangerouslySetInnerHTML={{__html: pingback.excerpt}}
      description={`pingback ${pingback._id}`}
      nofollow={(pingback.sourcePost.user?.karma ?? 0) < nofollowKarmaThreshold.get(forumType)}
    />
  </ContentStyles>
}

const SingleLinePingback = ({pingback, voteProps, treeOptions}: {
  pingback: PingbackWithSourcePost,
  voteProps: VotingProps<VoteableTypeClient>,
  treeOptions: CommentTreeOptions,
}) => {
  const classes = useStyles(styles);
  const singleLineClasses = useStyles(singleLineCommentStyles);
  const { isAF } = useForumType();
  const { anchorEl, hover, eventHandlers } = useHover();
  const excerptText = useMemo(() => htmlToTextDefault(pingback.excerpt), [pingback.excerpt]);
  const hideKarma = treeOptions.post?.hideCommentKarma;
  const isOddLevel = getEffectiveNestingLevel(PINGBACK_NESTING_LEVEL, treeOptions) % 2 !== 0;

  return <div className={singleLineClasses.root} {...eventHandlers}>
    <ContentStyles
      contentType="comment"
      className={classNames(singleLineClasses.commentInfo, isOddLevel && singleLineClasses.odd)}
    >
      {!hideKarma && <span className={singleLineClasses.leadingInfo}>
        {isAF ? pingback.afBaseScore : pingback.baseScore}
      </span>}
      <span className={classes.singleLineLabel}>Mentioned in</span>
      <span className={classNames(singleLineClasses.username, classes.singleLinePostTitle)}>
        {pingback.sourcePost.title}
      </span>
      <span className={singleLineClasses.date}>
        <FormatDate date={pingback.sourcePost.postedAt} tooltip={false} />
      </span>
      <ContentStyles contentType="comment" className={singleLineClasses.truncatedHighlight}>
        {excerptText}
      </ContentStyles>
    </ContentStyles>
    <LWPopper
      open={hover && !isMobile()}
      anchorEl={anchorEl}
      placement="bottom-end"
      clickable={false}
    >
      <div className={singleLineClasses.preview}>
        <CommentFrame
          treeOptions={{ ...treeOptions, switchAlternatingHighlights: false }}
          nestingLevel={PINGBACK_NESTING_LEVEL}
          hoverPreview
        >
          <div className={classes.root}>
            <PingbackMeta pingback={pingback} voteProps={voteProps} hideKarma={hideKarma} />
            <PingbackExcerpt pingback={pingback} />
          </div>
        </CommentFrame>
      </div>
    </LWPopper>
  </div>
}

const CommentsPingbackItem = ({pingback, replies, treeOptions, expandAllThreads}: {
  pingback: PingbackWithSourcePost,
  replies: CommentTreeNode<CommentsList>[],
  treeOptions: CommentTreeOptions,
  expandAllThreads?: boolean,
}) => {
  const classes = useStyles(styles);
  const commentBottomClasses = useStyles(commentBottomStyles);
  const commentsItemClasses = useStyles(commentsItemStyles);
  const voteProps = useVote(pingback, "Pingbacks", getDefaultVotingSystem());
  const noSingleLineComments = useFilteredCurrentUser(u => u?.noSingleLineComments);
  const { scrollToCommentId } = useCommentLinkState();
  const contentsRef = useRef<HTMLDivElement|null>(null);
  const [singleLine, setSingleLine] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [replyFormIsOpen, setReplyFormIsOpen] = useState(false);
  const { sourcePost } = pingback;
  const elementId = getPingbackElementId(pingback._id);

  const isSingleLine = singleLine && !expandAllThreads && !noSingleLineComments;
  const captureHeightBeforeExpansion = useExpansionHeightAnimation(contentsRef, isSingleLine);

  const expandFromSingleLine = () => {
    captureHeightBeforeExpansion();
    setSingleLine(false);
  };

  const isLinked = scrollToCommentId === elementId;
  const hasLinkedReply = replies.some(reply =>
    flattenCommentBranch(reply).some(comment => comment._id === scrollToCommentId)
  );

  // The URL hash isn't sent to the server, so this can't be part of the initial state
  useEffect(() => {
    if (isLinked) {
      setSingleLine(false);
      scrollFocusOnElement({ id: elementId, options: { behavior: "smooth" } });
    }
    if (isLinked || hasLinkedReply) {
      setCollapsed(false);
    }
  }, [isLinked, hasLinkedReply, elementId]);

  // Replies to a pingback are comments on the post containing the link
  const repliesTreeOptions = useMemo(() => ({
    ...treeOptions,
    post: sourcePost,
    parentPingbackId: pingback._id,
  }), [treeOptions, sourcePost, pingback._id]);

  return <AnalyticsContext pageElementContext="pingbackItem" collectionName="Pingbacks" documentId={pingback._id}>
    <CommentFrame
      treeOptions={treeOptions}
      nestingLevel={PINGBACK_NESTING_LEVEL}
      id={elementId}
      hasChildren={replies.length > 0}
      isSingleLine={isSingleLine}
      onClick={isSingleLine ? expandFromSingleLine : undefined}
    >
      <div ref={contentsRef}>
        {isSingleLine
          ? <SingleLinePingback pingback={pingback} voteProps={voteProps} treeOptions={treeOptions} />
          : <div className={classes.root}>
              <PingbackMeta
                pingback={pingback}
                voteProps={voteProps}
                hideKarma={treeOptions.post?.hideCommentKarma}
                collapseButton={treeOptions.showCollapseButtons && <CommentCollapseButton
                  collapsed={collapsed}
                  onClick={() => setCollapsed(!collapsed)}
                />}
              />
              <AnimatedCollapse expanded={!collapsed}>
                <PingbackExcerpt pingback={pingback} />
                <div className={commentBottomClasses.bottom}>
                  <div className={commentBottomClasses.leftSection}>
                    <a className={commentsItemClasses.replyLink} onClick={() => setReplyFormIsOpen(true)}>
                      Reply
                    </a>
                  </div>
                </div>
                {replyFormIsOpen && <div className={classNames(
                  commentsItemClasses.replyForm,
                  getReplyFormLevelClass(PINGBACK_NESTING_LEVEL, treeOptions),
                )}>
                  <CommentsNewForm
                    post={sourcePost}
                    prefilledProps={{ pingbackId: pingback._id }}
                    successCallback={() => setReplyFormIsOpen(false)}
                    cancelCallback={() => setReplyFormIsOpen(false)}
                    interactionType="reply"
                    formStyle={treeOptions.formStyle}
                  />
                </div>}
              </AnimatedCollapse>
            </div>
        }
      </div>
      <AnimatedCollapse expanded={!collapsed}>
        {replies.length > 0 && <div className={classes.replies}>
          {replies.map(reply => <CommentsNode
            key={reply.item._id}
            treeOptions={repliesTreeOptions}
            comment={reply.item}
            childComments={reply.children}
            nestingLevel={PINGBACK_NESTING_LEVEL + 1}
            truncated={isSingleLine}
            expandAllThreads={expandAllThreads}
            isChild
          />)}
        </div>}
      </AnimatedCollapse>
    </CommentFrame>
  </AnalyticsContext>
}

export default CommentsPingbackItem;
