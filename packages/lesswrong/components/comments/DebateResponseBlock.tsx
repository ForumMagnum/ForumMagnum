import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import {useVote} from '../votes/withVote';
import {getVotingSystemByName} from '../../lib/voting/votingSystems';
import {Comments} from '../../lib/collections/comments';
import {reactStyles} from './CommentsItem/CommentsItem';
import {canVoteOnTag} from '../../lib/voting/tagRelVoteRules';

const styles = (theme: ThemeType): JssStyles => ({
  innerDebateComment: {
    padding: '8px 8px 8px 16px',
    borderLeft: 'solid',
    borderLeftWidth: '2px',
    '&:hover $menu': {
      opacity: 0.5
    },
    ...theme.typography.commentStyle,
    position: 'relative'
  },
  blockMargin: {
    marginBottom: 16
  },
  commentWithReplyButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
  },
  username: {
    marginRight: 10,
    fontSize: '1.35rem'
  },
  replyLink: {
    color: theme.palette.link.dim,
    "@media print": {
      display: "none",
    },
    minWidth: 'fit-content'
  },
  hideReplyLink: {
    visibility: 'hidden'
  },
  menu: {
    opacity: 0,
    marginRight: '-30px',
    float: 'right'
  },
  editForm: {
    width: '100%'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: theme.palette.border.normal,
    height: 0,
    position: 'relative',
    marginBottom: '16px'
  },
  dividerLabel: {
    width: 'fit-content',
    paddingLeft: 6,
    paddingRight: 6,
    background: theme.palette.background.pageActiveAreaBackground,
    ...theme.typography.subheading
  },
  greenBorder: {
    borderColor: theme.palette.border.debateComment
  },
  redBorder: {
    borderColor: theme.palette.border.debateComment2
  },
  blueBorder: {
    borderColor: theme.palette.border.debateComment3
  },
  purpleBorder: {
    borderColor: theme.palette.border.debateComment4
  },
  yellowBorder: {
    borderColor: theme.palette.border.debateComment5
  },
  lwReactStyling: reactStyles(theme),
  reacts: {
    position: 'absolute',
    right: 10,
    bottom: -14,
  },
});

export interface DebateResponseWithReplies {
  comment: CommentsList;
  replies: CommentsList[];
}

const getParticipantBorderStyle = (participantIndex: number) => {
  switch (participantIndex) {
    case 0:
      return 'greenBorder';
    case 1:
      return 'redBorder';
    case 2:
      return 'blueBorder';
    case 3:
      return 'purpleBorder';
    default:
      return 'yellowBorder';
  }
};

export const DebateResponseBlock = ({ responses, post, orderedParticipantList, daySeparator, classes }: {
  responses: DebateResponseWithReplies[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  orderedParticipantList: string[],
  daySeparator?: string,
  classes: ClassesType,
}) => {
  const { CommentUserName, CommentsItemDate, CommentBody, CommentsEditForm, CommentsMenu, DebateCommentsListSection } = Components;

  const currentUser = useCurrentUser();

  const responseStates = responses.map(_ => false);
  const [showReplyState, setShowReplyState] = useState([...responseStates]);
  const [showEdit, setShowEdit] = useState([...responseStates]);

  const fullParticipantSet = new Set([post.userId, ...(post.coauthorStatuses ?? []).map(coauthor => coauthor.userId)]);

  const showRepliesForComment = (e: React.MouseEvent, responseIdx: number) => {
    e.preventDefault();
    const newReplyState = [...showReplyState];
    newReplyState[responseIdx] = !newReplyState[responseIdx];
    setShowReplyState(newReplyState);
  };

  const showEditForResponse = (newShowEditState: boolean, responseIdx: number) => {
    const newShowEdit = [...showEdit];
    newShowEdit[responseIdx] = newShowEditState;
    setShowEdit(newShowEdit);
  }

  return <div>
    {daySeparator && <div className={classes.divider}>
      <span className={classes.dividerLabel}>{daySeparator}</span>
    </div>}
    {responses.map(({ comment, replies }, idx) => {
      const isFirstCommentInBlock = idx === 0;
      const isLastCommentInBlock = idx === (responses.length - 1);
      const commentParticipantIndex = orderedParticipantList.indexOf(comment.userId);
      const readerIsParticipant = currentUser && fullParticipantSet.has(currentUser._id);

      const showHeader = isFirstCommentInBlock;
      const showInlineReplyForm = isLastCommentInBlock && !readerIsParticipant;
      const showReplyLink = replies.length > 0 || showInlineReplyForm;
      const addBottomMargin = isLastCommentInBlock;
      const borderStyle = getParticipantBorderStyle(commentParticipantIndex);

      const header = showHeader && <>
        <CommentUserName comment={comment} className={classes.username} />
        <CommentsItemDate comment={comment} post={post} />
      </>;

      const menu = <CommentsMenu
        comment={comment}
        post={post}
        showEdit={() => showEditForResponse(true, idx)}
        className={classes.menu}
      />;

      const votingSystemName = comment.votingSystem || "default";
      const votingSystem = getVotingSystemByName(votingSystemName);
      const voteProps = useVote(comment, "Comments", votingSystem);
      const commentItemRef = useRef<HTMLDivElement|null>(null); // passed into CommentsItemBody for use in InlineReactSelectionWrapper

      const VoteBottomComponent = votingSystem.getCommentBottomComponent?.() ?? null;


      const commentBodyOrEditor = showEdit[idx]
      ? <CommentsEditForm
          comment={comment}
          successCallback={() => showEditForResponse(false, idx)}
          cancelCallback={() => showEditForResponse(false, idx)}
          className={classes.editForm}
          formProps={{ post }}
        />
      : (<div ref={commentItemRef}>
          <CommentBody comment={comment} voteProps={voteProps} commentItemRef={commentItemRef}/>
        </div>
      );

      const replyLink = showReplyLink && <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={e => showRepliesForComment(e, idx)}>
        Reply <span>({replies.filter(replyComment => replyComment.topLevelCommentId === comment._id).length})</span>
      </a>;

      const replyCommentList =
        <DebateCommentsListSection
          comments={replies}
          totalComments={replies.length}
          post={post}
          newForm={showInlineReplyForm}
          newFormProps={{
            parentComment: comment,
            replyFormStyle: 'minimalist',
          }}
        />;

      const replyState = showReplyState[idx] && showReplyLink && replyCommentList;

      return (
        <div
          key={`debate-comment-${comment._id}`}
          id={`debate-comment-${comment._id}`}
          className={classNames(classes.innerDebateComment, classes[borderStyle], { [classes.blockMargin]: addBottomMargin }, classes.lwReactStyling)}
        >
          {header}
          {menu}
          <div className={classes.commentWithReplyButton}>
            {commentBodyOrEditor}
            {replyLink}
          </div>
          {replyState}
          {VoteBottomComponent && <div className={classes.reacts}>
            <VoteBottomComponent
              document={comment}
              hideKarma={post?.hideCommentKarma}
              collection={Comments}
              votingSystem={votingSystem}
              commentItemRef={commentItemRef}
              voteProps={voteProps}
            />
          </div>}
        </div>
      );
    })}
  </div>;
}

const DebateResponseBlockComponent = registerComponent('DebateResponseBlock', DebateResponseBlock, {styles, stylePriority: 200});

declare global {
  interface ComponentTypes {
    DebateResponseBlock: typeof DebateResponseBlockComponent
  }
}
