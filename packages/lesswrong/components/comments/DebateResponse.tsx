import React, {useRef, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {useCurrentUser} from '../common/withUser';
import {DebateResponseWithReplies} from './DebateResponseBlock';
import classNames from 'classnames';
import {useVote} from '../votes/withVote';
import {getVotingSystemByName} from '../../lib/voting/votingSystems';
import {Comments} from '../../lib/collections/comments';
import {lwReactStyles} from './CommentsItem/CommentsItem';

const styles = (theme: ThemeType): JssStyles => ({
  innerDebateComment: {
    marginTop: 6,
    padding: '8px 8px 8px 16px',
    borderLeft: 'solid',
    borderLeftWidth: '2px',
    '&:hover $menu': {
      opacity: 0.5
    },
    '&:hover $responseDate': {
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
  menu: {
    opacity: 0,
    marginRight: '-30px',
    float: 'right'
  },
  editForm: {
    width: '100%'
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
  lwReactStyling: lwReactStyles(theme),
  bottomUI: {
    position: 'absolute',
    right: 10,
    bottom: -12,
    display: "flex",
    alignItems: "center"
  },
  responseDate: {
    opacity: 0,
  }
});

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

export const DebateResponse = ({classes, comment, replies, idx, responseCount, orderedParticipantList, responses, post}: {
  classes: ClassesType,
  comment: CommentsList,
  replies: CommentsList[],
  idx: number,
  responseCount: number,
  orderedParticipantList: string[],
  responses: DebateResponseWithReplies[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
}) => {
    const { CommentUserName, CommentsItemDate, CommentBody, CommentsEditForm, CommentsMenu, DebateCommentsListSection } = Components;

    const [showEdit, setShowEdit] = useState(false);
    
    const votingSystemName = comment.votingSystem || "default";
    const votingSystem = getVotingSystemByName(votingSystemName);
    const voteProps = useVote(comment, "Comments", votingSystem);
    const commentItemRef = useRef<HTMLDivElement|null>(null); // passed into CommentsItemBody for use in InlineReactSelectionWrapper

    const VoteBottomComponent = votingSystem.getCommentBottomComponent?.() ?? null;


    const fullParticipantSet = new Set([post.userId, ...(post.coauthorStatuses ?? []).map(coauthor => coauthor.userId)]);



    const currentUser = useCurrentUser();

    const isFirstCommentInBlock = idx === 0;
    const isLastCommentInBlock = idx === (responseCount - 1);
    const commentParticipantIndex = orderedParticipantList.indexOf(comment.userId);
    const readerIsParticipant = currentUser && fullParticipantSet.has(currentUser._id);

    const showHeader = isFirstCommentInBlock;
    const showInlineReplyForm = isLastCommentInBlock && !readerIsParticipant;
    
    const addBottomMargin = isLastCommentInBlock;
    const borderStyle = getParticipantBorderStyle(commentParticipantIndex);

    const header = showHeader && <>
      <CommentUserName comment={comment} className={classes.username} />
      <span>{" " /* Explicit space (rather than just padding/margin) for copy-paste purposes */ }</span>
      <span className={classes.responseDate}>
        <CommentsItemDate comment={comment} post={post} />
      </span>
      
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
    : <div ref={commentItemRef}>
        <CommentBody comment={comment} voteProps={voteProps} commentItemRef={commentItemRef}/>
      </div>;

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
        </div>
        <div className={classes.bottomUI}>
          {VoteBottomComponent && <VoteBottomComponent
            document={comment}
            hideKarma={post.hideCommentKarma}
            collection={Comments}
            votingSystem={votingSystem}
            commentItemRef={commentItemRef}
            voteProps={voteProps}
            post={post}
          />}
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
