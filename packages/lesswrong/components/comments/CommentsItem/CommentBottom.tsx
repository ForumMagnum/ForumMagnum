import classNames from 'classnames';
import React from 'react';
import { hideUnreviewedAuthorCommentsSettings } from '../../../lib/publicSettings';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import type { VotingProps } from '../../votes/votingProps';
import type { CommentTreeOptions } from '../commentTree';
import type { VotingSystem } from '../../../lib/voting/votingSystems';
import type { ContentItemBodyImperative } from '../../common/ContentItemBody';
import { userIsAllowedToComment } from '../../../lib/collections/users/helpers';
import { isFriendlyUI } from '../../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  bottom: {
    paddingBottom: isFriendlyUI ? 12 : 5,
    paddingTop: isFriendlyUI ? 4 : undefined,
    minHeight: 12,
    ...(isFriendlyUI ? {} : {fontSize: 12}),
  },
  bottomWithReacts: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  answer: {
    display: "flex",
    alignItems: "baseline",
  },
})

const CommentBottom = ({comment, treeOptions, votingSystem, voteProps, commentBodyRef, replyButton, classes}: {
  comment: CommentsList,
  post: PostsMinimumInfo|undefined,
  treeOptions: CommentTreeOptions,
  votingSystem: VotingSystem
  voteProps: VotingProps<VoteableTypeClient>,
  commentBodyRef?: React.RefObject<ContentItemBodyImperative>|null,
  replyButton: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const { CommentBottomCaveats } = Components
  const currentUser = useCurrentUser();
  const now = useCurrentTime();
  const isMinimalist = treeOptions.formStyle === "minimalist"
  const VoteBottomComponent = votingSystem.getCommentBottomComponent?.() ?? null;

  const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > now;

  const hideSince = hideUnreviewedAuthorCommentsSettings.get()
  const commentHidden = hideSince && new Date(hideSince) < new Date(comment.postedAt) &&
    comment.authorIsUnreviewed
  const showReplyButton = (
    !treeOptions.hideReply &&
    !comment.deleted &&
    (!blockedReplies || userCanDo(currentUser,'comments.replyOnBlocked.all')) &&
    // FIXME userIsAllowedToComment depends on some post metadatadata that we
    // often don't want to include in fragments, producing a type-check error
    // here. We should do something more complicated to give client-side feedback
    // if you're banned.
    // @ts-ignore
    (!currentUser || userIsAllowedToComment(currentUser, treeOptions.post ?? null, null, true)) &&
    (!commentHidden || userCanDo(currentUser, 'posts.moderate.all'))
  )

  return (
    <div className={classNames(
      classes.bottom,
      comment.answer && classes.answer,
      !!VoteBottomComponent && classes.bottomWithReacts,
    )}>
      <CommentBottomCaveats comment={comment} />
      {showReplyButton && replyButton}
      {VoteBottomComponent && <VoteBottomComponent
        document={comment}
        hideKarma={treeOptions.post?.hideCommentKarma}
        collectionName="Comments"
        votingSystem={votingSystem}
        commentBodyRef={commentBodyRef}
        voteProps={voteProps}
      />}
    </div>
  );
}

const CommentBottomComponent = registerComponent('CommentBottom', CommentBottom, {styles});

declare global {
  interface ComponentTypes {
    CommentBottom: typeof CommentBottomComponent
  }
}

