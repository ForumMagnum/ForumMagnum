import React, { useEffect, useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import DialogContent from "@material-ui/core/DialogContent";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSingle } from "../../lib/crud/withSingle";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { useMulti } from "@/lib/crud/withMulti";
import { useLocation, useNavigate } from "@/lib/routeUtil";

const styles = defineStyles("UltraFeedPostDialog", (theme: ThemeType) => ({
  '@global': {
    // Style the browser's text fragment highlighting
    '::target-text': {
      backgroundColor: `${theme.palette.secondary.light}4c`,
    },
    // fallback/common implementation
    'mark': {
      backgroundColor: `${theme.palette.secondary.light}4c`,
    }
  },
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
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    fontSize: 42,
    textAlign: 'center',
    marginBottom: 40,
    "@media print": { display: "none" },
    '& h1': {
      fontFamily: `${theme.palette.fonts.sansSerifStack} !important`,
    }
  },
}));

type UltraFeedPostDialogProps = {
  postId?: string;
  post?: never;
  onClose: () => void;
  textFragment?: string;
} | {
  postId?: never;
  post: PostsPage | UltraFeedPostFragment;
  onClose: () => void;
  textFragment?: string;
}

const UltraFeedDialogContent = ({
  post,
  comments,
  commentsLoading,
  commentsTotalCount,
  textFragment,
  onClose,
}: {
  post: PostsPage | UltraFeedPostFragment;
  comments?: CommentsList[];
  commentsLoading: boolean;
  commentsTotalCount: number;
  textFragment?: string;
  onClose: () => void;
}) => {
  const { LWDialog, FeedContentBody, Loading, CommentsListSection, PostsVote } = Components;
  const classes = useStyles(styles);

  const navigate = useNavigate();

  useEffect(() => {
    if (textFragment) {
      // it would be nice to use navigate here, but it doesn't work to trigger scrolling and highlighting
      window.location.hash = textFragment;
    }

    return () => {
      navigate({ hash: "" }, { replace: true });
    };
  }, [textFragment, navigate]);

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      dialogClasses={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogContent className={classes.dialogContent}>
        {post && <div>
          <div className={classes.titleContainer}>
            <Link
              to={postGetPageUrl(post)}
              className={classes.title}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }
              }>
              {post.title}
            </Link>
            <span className={classes.closeButton} onClick={onClose}>
              Close
            </span>
          </div>
          {post?.contents?.html ? (
            <FeedContentBody
              html={post.contents.html}
              wordCount={post.contents.wordCount || 0}
              linkToDocumentOnFinalExpand={false}
              hideSuffix={true}
            />
          ) : (
            <div>Post content not available.</div>
          )}
        </div>}
        <div className={classes.voteBottom}>
          {post && <PostsVote post={post} useHorizontalLayout={false} isFooter />}
        </div>
        {commentsLoading && <div className={classes.loadingContainer}><Loading /></div>}
        {comments && (
          <CommentsListSection
            post={post}
            comments={comments ?? []}
            totalComments={commentsTotalCount ?? 0}
            commentCount={(comments ?? []).length}
            loadMoreComments={() => { }}
            loadingMoreComments={false}
            highlightDate={undefined}
            setHighlightDate={() => { }}
            hideDateHighlighting={true}
            newForm={true}
          />
        )}
      </DialogContent>
    </LWDialog>
  );

}


const UltraFeedPostDialog = ({
  postId,
  post,
  onClose,
  textFragment,
}: UltraFeedPostDialogProps) => {
  const { Loading } = Components;
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
      limit: 100, // TODO: add load more
    },
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !(postId ?? post?._id),
    enableTotal: true,
  });

  const fullPost = post ?? fetchedPost;
  const isLoading = !!postId && loadingPost && !post;

  return <>
    {isLoading && <div className={classes.loadingContainer}>
      <Loading />
    </div>}
    {fullPost && <UltraFeedDialogContent
      post={fullPost}
      comments={comments}
      commentsLoading={isCommentsLoading}
      commentsTotalCount={commentsTotalCount ?? 0}
      textFragment={textFragment}
      onClose={onClose}
    />}
  </>


};

const UltraFeedPostDialogComponent = registerComponent("UltraFeedPostDialog", UltraFeedPostDialog);

export default UltraFeedPostDialog;

declare global {
  interface ComponentTypes {
    UltraFeedPostDialog: typeof UltraFeedPostDialogComponent
  }
}
