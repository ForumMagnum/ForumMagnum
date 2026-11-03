import React, { useMemo, useState } from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { nofollowKarmaThreshold } from '@/lib/instanceSettings';
import { getPingbackElementId, pingbackExcerptLinkClass } from '@/lib/pingback';
import type { CommentTreeNode } from '@/lib/utils/unflatten';
import { getDefaultVotingSystem } from '@/lib/voting/getVotingSystem';
import { useForumType } from '@/components/hooks/useForumType';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useVote } from '../votes/withVote';
import OverallVoteAxis from '../votes/OverallVoteAxis';
import PostsTooltip from '../posts/PostsPreviewTooltip/PostsTooltip';
import UsersName from '../users/UsersName';
import FormatDate from '../common/FormatDate';
import ContentStyles from '../common/ContentStyles';
import { ContentItemBody } from '../contents/ContentItemBody';
import CommentFrame from './CommentFrame';
import CommentsNode from './CommentsNode';
import CommentsNewForm from './CommentsNewForm';
import type { CommentTreeOptions } from './commentTree';
import type { PingbackWithSourcePost } from './interleavePingbacks';

const styles = defineStyles("CommentsPingbackItem", (theme: ThemeType) => ({
  root: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 8,
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
  replyLink: {
    display: "inline-block",
    marginTop: 4,
    color: theme.palette.link.dim,
    "@media print": {
      display: "none",
    },
  },
  replyForm: {
    marginTop: 8,
    border: theme.palette.border.normal,
  },
  replies: {
    position: "relative",
  },
}));

const CommentsPingbackItem = ({pingback, replies, treeOptions}: {
  pingback: PingbackWithSourcePost,
  replies: CommentTreeNode<CommentsList>[],
  treeOptions: CommentTreeOptions,
}) => {
  const classes = useStyles(styles);
  const { forumType } = useForumType();
  const voteProps = useVote(pingback, "Pingbacks", getDefaultVotingSystem());
  const [replyFormIsOpen, setReplyFormIsOpen] = useState(false);
  const { sourcePost } = pingback;

  // Replies to a pingback are comments on the post containing the link
  const repliesTreeOptions = useMemo(() => ({
    ...treeOptions,
    post: sourcePost,
    parentPingbackId: pingback._id,
  }), [treeOptions, sourcePost, pingback._id]);

  return <AnalyticsContext pageElementContext="pingbackItem" collectionName="Pingbacks" documentId={pingback._id}>
    <CommentFrame treeOptions={treeOptions} nestingLevel={1} id={getPingbackElementId(pingback._id)} hasChildren={replies.length > 0}>
      <div className={classes.root}>
        <div className={classes.meta}>
          <span>Mentioned in</span>
          <PostsTooltip postId={sourcePost._id} inlineBlock>
            <Link className={classes.postTitle} to={postGetPageUrl(sourcePost)}>
              {sourcePost.title}
            </Link>
          </PostsTooltip>
          <span>by</span>
          <UsersName user={sourcePost.user} />
          <FormatDate date={sourcePost.postedAt} />
          <OverallVoteAxis document={pingback} voteProps={voteProps} />
        </div>
        <ContentStyles contentType="comment">
          <ContentItemBody
            className={classes.excerpt}
            dangerouslySetInnerHTML={{__html: pingback.excerpt}}
            description={`pingback ${pingback._id}`}
            nofollow={(sourcePost.user?.karma ?? 0) < nofollowKarmaThreshold.get(forumType)}
          />
        </ContentStyles>
        {!replyFormIsOpen && <a className={classes.replyLink} onClick={() => setReplyFormIsOpen(true)}>
          Reply
        </a>}
        {replyFormIsOpen && <div className={classes.replyForm}>
          <CommentsNewForm
            post={sourcePost}
            prefilledProps={{ pingbackId: pingback._id }}
            successCallback={() => setReplyFormIsOpen(false)}
            cancelCallback={() => setReplyFormIsOpen(false)}
            interactionType="reply"
            formStyle={treeOptions.formStyle}
          />
        </div>}
      </div>
      {replies.length > 0 && <div className={classes.replies}>
        {replies.map(reply => <CommentsNode
          key={reply.item._id}
          treeOptions={repliesTreeOptions}
          comment={reply.item}
          childComments={reply.children}
          nestingLevel={2}
          isChild
        />)}
      </div>}
    </CommentFrame>
  </AnalyticsContext>
}

export default CommentsPingbackItem;
