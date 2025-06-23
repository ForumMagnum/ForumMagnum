import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import CommentsNewForm from "../comments/CommentsNewForm";

const styles = defineStyles("UltraFeedReplyEditor", (theme: ThemeType) => ({
  replyEditorContainer: {
    marginBottom: 12,
    paddingRight: 16,
    background: theme.palette.grey[100],
    borderRadius: theme.borderRadius.small,
    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
    },
  },
  cannotReplyMessage: {
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    background: theme.palette.grey[100],
    borderRadius: theme.borderRadius.small,
    color: theme.palette.text.dim,
    fontSize: 14,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontStyle: 'italic',
  },
  viewAllCommentsButton: {
    cursor: 'pointer',
    color: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    marginBottom: 8,
    '&:hover': {
      color: theme.palette.text.primary,
      opacity: 0.3,
    },
  },
}));

interface UltraFeedReplyEditorBaseProps {
  cannotReplyReason?: string | null;
  onReplySubmit: (newComment: UltraFeedComment) => void;
  onReplyCancel: () => void;
  onViewAllComments: () => void;
}

type UltraFeedReplyEditorPostProps = UltraFeedReplyEditorBaseProps & {
  document: PostsListWithVotes;
  collectionName: "Posts";
};

type UltraFeedReplyEditorCommentProps = UltraFeedReplyEditorBaseProps & {
  document: UltraFeedComment;
  collectionName: "Comments";
};

export type UltraFeedReplyEditorProps =
  | UltraFeedReplyEditorPostProps
  | UltraFeedReplyEditorCommentProps;

const UltraFeedReplyEditor = ({
  document,
  collectionName,
  cannotReplyReason,
  onReplySubmit,
  onReplyCancel,
  onViewAllComments,
}: UltraFeedReplyEditorProps) => {
  const classes = useStyles(styles);

  const post = collectionName === "Comments" ? document.post : document;

  if (!post) {
    return null;
  }

  const parentComment =
    collectionName === "Comments" ? document : undefined;

  return (
    <>
      <div className={classes.viewAllCommentsButton} onClick={onViewAllComments} >
        Click to view all comments
      </div>
      {cannotReplyReason ? (
        <div className={classes.cannotReplyMessage}>
          {cannotReplyReason}
        </div>
      ) : (
        <div className={classes.replyEditorContainer}>
          <CommentsNewForm
            post={{...post, af: false}} // in order to hide AF checkbox
            parentComment={parentComment}
            successCallback={(newComment) => {
              if (!newComment || !post) {
                return;
              }
              
              onReplySubmit({
                ...newComment,
                post: post,
              });
            }}
            cancelCallback={onReplyCancel}
            interactionType={collectionName === "Comments" ? "reply" : "comment"}
            enableGuidelines={false}
            formStyle="default"
            overrideHintText="Text goes here! Visit lesswrong.com/editor for more info about the editor..."
          />
        </div>
      )}
    </>
  );
};

export default UltraFeedReplyEditor; 
