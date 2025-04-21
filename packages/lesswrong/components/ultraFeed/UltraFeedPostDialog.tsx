import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import DialogContent from "@material-ui/core/DialogContent";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSingle } from "../../lib/crud/withSingle";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetLink } from "@/lib/collections/posts/helpers";
import classnames from "classnames";
import { useMulti } from "@/lib/crud/withMulti";

const styles = defineStyles("UltraFeedPostDialog", (theme: ThemeType) => ({
  dialogContent: {
    padding: 20,
    paddingTop: 0,
    [theme.breakpoints.down('sm')]: {
      padding: 10,
      paddingTop: 0,
    }
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  title: { 
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.4rem',
    fontWeight: 600,
    opacity: 0.8,
    lineHeight: 1.15,
    textWrap: 'balance',
    width: '100%',
    '&:hover': {
      opacity: 0.9,
      textDecoration: 'none',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.6rem',
    },
  },
  closeButton: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[500],
    fontWeight: 600,
    fontSize: "1.1rem",
    cursor: 'pointer',
    padding: 8,
    '&:hover': {
      color: theme.palette.grey[700],
    },
  },
  dialogPaper: {
    maxWidth: 765,
    margin: 4
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 0",
  },
  voteContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: `${theme.palette.fonts.sansSerifStack} !important`,
  },
  voteBottom: {
    position: 'relative',
    fontSize: 42,
    textAlign: 'center',
    display: 'inline-block',
    marginLeft: 'auto',
    marginRight:'auto',
    marginBottom: 40,
    "@media print": { display: "none" },
    '& h1': {
      fontFamily: `${theme.palette.fonts.sansSerifStack} !important`,
    }
  },
}));

type UltraFeedPostDialogProps = {
  postId?: string;
  post?: never; // Use a fragment that includes contents.html
  onClose: () => void;
} | {
  postId?: never;
  post: UltraFeedPostFragment; // Use a fragment that includes contents.html
  onClose: () => void;
}

const UltraFeedPostDialog = ({
  postId,
  post,
  onClose,
}: UltraFeedPostDialogProps) => {
  const { LWDialog, FeedContentBody, Loading, CommentsListSection, PostsVote } = Components;
  const classes = useStyles(styles);

  const { document: fetchedPost, loading: loadingPost } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "UltraFeedPostFragment",
    skip: !!post, 
  });

  const { results: comments, loading: isCommentsLoading, totalCount: commentsTotalCount } = useMulti({
    terms: {
      view: "postCommentsTop",
      postId: postId ?? post?._id,
      limit: 50, // Consider pagination later if needed
    },
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !postId,
    enableTotal: true,
  });

  const fullPost = post ?? fetchedPost;
  const isLoading = loadingPost && !post;

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      dialogClasses={{
        paper: classes.dialogPaper,
      }}
    >
      { loadingPost && <div className={classes.loadingContainer}><Loading /></div>}
      {!loadingPost && fullPost && <div>
        <div className={classes.titleContainer}>
          <Link to={postGetLink(fullPost)} className={classes.title} onClick={(e) => { e.stopPropagation(); onClose(); /* Close dialog on click, allow navigation */ }}>
            {fullPost.title}
          </Link>
          <span className={classes.closeButton} onClick={onClose}>
            Close
          </span>
        </div>
        <DialogContent className={classes.dialogContent}>
          {isLoading && (
            <div className={classes.loadingContainer}>
              <Loading />
            </div>
          )}
          {!isLoading && fullPost.contents?.html && (
            <FeedContentBody
              post={fullPost}
              html={fullPost.contents?.html}
              wordCount={fullPost.contents?.wordCount || 0}
              linkToDocumentOnFinalExpand={false} // Not applicable
              hideSuffix={true} // No suffix needed
            />
          )}
          {!isLoading && !fullPost.contents?.html && (
            <div>Post content not available.</div>
          )}
        </DialogContent>
      </div>}
      <div className={classes.voteBottom}>
        {fullPost && <PostsVote post={fullPost} useHorizontalLayout={false} isFooter />}
      </div>
      {isCommentsLoading && !isLoading && <Loading />}
      {!isCommentsLoading && comments && (
        <CommentsListSection 
          post={fullPost}
          comments={comments ?? []}
          totalComments={commentsTotalCount ?? 0}
          commentCount={(comments ?? []).length}
          loadMoreComments={() => {}}
          loadingMoreComments={false}
          highlightDate={undefined}
          setHighlightDate={() => {}}
          hideDateHighlighting={true}
          newForm={true}
        />
      )}
    </LWDialog>
  );
};

const UltraFeedPostDialogComponent = registerComponent("UltraFeedPostDialog", UltraFeedPostDialog);

export default UltraFeedPostDialogComponent;

declare global {
  interface ComponentTypes {
    UltraFeedPostDialog: typeof UltraFeedPostDialogComponent
  }
} 
