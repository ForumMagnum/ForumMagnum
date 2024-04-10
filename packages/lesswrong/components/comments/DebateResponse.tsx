import React, {useRef, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {useCurrentUser} from '../common/withUser';
import {DebateResponseWithReplies} from './DebateResponseBlock';
import classNames from 'classnames';
import {useVote} from '../votes/withVote';
import {getVotingSystemByName} from '../../lib/voting/votingSystems';
import {Comments} from '../../lib/collections/comments';
import type { ContentItemBody } from '../common/ContentItemBody';

const styles = (theme: ThemeType): JssStyles => ({
  innerDebateComment: {
    marginTop: 6,
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
    marginRight: 6,
    fontSize: '1.35rem'
  },
  replyLink: {
    color: theme.palette.link.dim,
    "@media print": {
      display: "none",
    },
    minWidth: 'fit-content',
    marginLeft: 10
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
  border0: {
    borderColor: theme.palette.text.debateComment[1],
  },
  border1: {
    borderColor: theme.palette.text.debateComment[2],
  },
  border2: {
    borderColor: theme.palette.text.debateComment[3],
  },
  border3: {
    borderColor: theme.palette.text.debateComment[4],
  },
  border4: {
    borderColor: theme.palette.text.debateComment[5],
  },
  border5: {
    borderColor: theme.palette.text.debateComment[6],
  },
  bottomUI: {
    position: 'absolute',
    right: 10,
    bottom: -12,
    display: "flex",
    alignItems: "center"
  },
});

const getParticipantBorderStyle = (
  classes: ClassesType<typeof styles>,
  participantIndex: number
) => classes[`border${participantIndex}`] ?? classes.border0;

export const DebateResponse = ({classes, comment, replies, idx, responseCount, orderedParticipantList, responses, post}: {
  classes: ClassesType<typeof styles>,
  comment: CommentsList,
  replies: CommentsList[],
  idx: number,
  responseCount: number,
  orderedParticipantList: string[],
  responses: DebateResponseWithReplies[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
}) => {
    const { CommentUserName, CommentsItemDate, CommentBody, CommentsEditForm, CommentsMenu, DebateCommentsListSection } = Components;

    const [showReplyState, setShowReplyState] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    
    const votingSystemName = comment.votingSystem || "default";
    const votingSystem = getVotingSystemByName(votingSystemName);
    const voteProps = useVote(comment, "Comments", votingSystem);
    const commentBodyRef = useRef<ContentItemBody|null>(null); // passed into CommentsItemBody for use in InlineReactSelectionWrapper

    const VoteBottomComponent = votingSystem.getCommentBottomComponent?.() ?? null;


    const fullParticipantSet = new Set([post.userId, ...(post.coauthorStatuses ?? []).map(coauthor => coauthor.userId)]);



    const currentUser = useCurrentUser();

    const isFirstCommentInBlock = idx === 0;
    const isLastCommentInBlock = idx === (responseCount - 1);
    const commentParticipantIndex = orderedParticipantList.indexOf(comment.userId);
    const readerIsParticipant = currentUser && fullParticipantSet.has(currentUser._id);

    const showHeader = isFirstCommentInBlock;
    const showInlineReplyForm = isLastCommentInBlock && !readerIsParticipant;
    const showReplyLink = replies.length > 0 || showInlineReplyForm;
    const addBottomMargin = isLastCommentInBlock;
    const borderStyle = getParticipantBorderStyle(classes, commentParticipantIndex);

    const header = showHeader && <>
      <CommentUserName comment={comment} className={classes.username} />
      <span>{" " /* Explicit space (rather than just padding/margin) for copy-paste purposes */}</span>
      <CommentsItemDate comment={comment} post={post} />
    </>;

    const menu = <CommentsMenu
      comment={comment}
      post={post}
      showEdit={() => setShowEdit(true)}
      className={classes.menu}
    />;

    const commentBodyOrEditor = showEdit
    ? <CommentsEditForm
        comment={comment}
        successCallback={() => setShowEdit(false)}
        cancelCallback={() => setShowEdit(false)}
        className={classes.editForm}
        formProps={{ post }}
      />
    : <div>
        <CommentBody comment={comment} voteProps={voteProps} commentBodyRef={commentBodyRef}/>
      </div>;

    const replyLink = showReplyLink && <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={e => setShowReplyState(!showReplyState)}>
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
          formStyle: 'minimalist',
        }}
      />;

    const replyState = showReplyState && showReplyLink && replyCommentList;

    return (
      <div
        key={`debate-comment-${comment._id}`}
        id={`debate-comment-${comment._id}`}
        className={classNames(classes.innerDebateComment, borderStyle, { [classes.blockMargin]: addBottomMargin })}
      >
        {header}
        {menu}
        <div className={classes.commentWithReplyButton}>
          {commentBodyOrEditor}
        </div>
        {replyState}
        <div className={classes.bottomUI}>
          {VoteBottomComponent && <VoteBottomComponent
            document={comment}
            hideKarma={post.hideCommentKarma}
            collection={Comments}
            votingSystem={votingSystem}
            commentBodyRef={commentBodyRef}
            voteProps={voteProps}
            post={post}
          />}
          {replyLink}
        </div>
      </div>
    );
  }


const DebateResponseComponent = registerComponent('DebateResponse', DebateResponse, {styles});

declare global {
  interface ComponentTypes {
    DebateResponse: typeof DebateResponseComponent
  }
}
