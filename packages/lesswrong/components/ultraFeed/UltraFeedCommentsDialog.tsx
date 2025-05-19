import React, { useEffect } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSingle } from "../../lib/crud/withSingle";
import { useMulti } from "../../lib/crud/withMulti";
import { DialogContent } from "../widgets/DialogContent";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import LWDialog from "../common/LWDialog";
import CommentsListSection from "../comments/CommentsListSection";
import Loading from "../vulcan-core/Loading";

const styles = defineStyles("UltraFeedCommentsDialog", (theme: ThemeType) => ({
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
    fontSize: "1.3rem",
    fontWeight: 600,
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
  scrolledHighlight: {
    backgroundColor: `${theme.palette.secondary.light}6c`,
  }
}));

const UltraFeedCommentsDialog = ({
  document,
  collectionName,
  onClose
}: {
  document: PostsListWithVotes | UltraFeedComment,
  collectionName: "Posts" | "Comments",
  onClose: () => void,
}) => {
  const classes = useStyles(styles);

  const isPost = collectionName === "Posts";
  const comment = isPost ? null : (document as UltraFeedComment);
  const postId = isPost ? document._id : comment?.postId ?? undefined;
  const topLevelCommentId = comment?.topLevelCommentId ?? comment?._id;
  const postTitle = isPost ? document.title : comment?.post?.title;
  const targetCommentId = !isPost ? document._id : undefined;

  const { document: postDataForTree, loading: loadingPost } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsDetails",
    skip: !postId,
  });

  const { results: postComments, loading: loadingPostComments, totalCount: postCommentsTotalCount } = useMulti({
    terms: {
      view: "postCommentsTop",
      postId,
      limit: 50, // Consider pagination later if needed
    },
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !isPost || !postId,
    enableTotal: true,
  });

  const { results: threadComments, loading: loadingThreadComments, totalCount: threadCommentsTotalCount } = useMulti({
    terms: {
      view: "repliesToCommentThreadIncludingRoot",
      topLevelCommentId,
      limit: 50, // Fetch a large number to get the whole thread initially
    },
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: isPost || !topLevelCommentId, // Only run if collectionName is Comments and we have the ID
    enableTotal: true,
  });

  const isLoading = loadingPost || (isPost ? loadingPostComments : loadingThreadComments);
  const comments = isPost ? postComments : threadComments;
  const totalCount = isPost ? postCommentsTotalCount : threadCommentsTotalCount;

  // TODO: Do this more elegantly, combine within existing functionality in CommentsNode?
  // scroll to comment clicked on when dialog opens
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;

    if (!isLoading && targetCommentId && comments && comments.length > 0) {
      scrollTimer = setTimeout(() => {
        const element = window.document.getElementById(targetCommentId);

        const container = element?.closest('.MuiDialogContent-root') as HTMLElement | null;

        if (element && container) {
          const isScrollable = container.scrollHeight > container.clientHeight;

          if (isScrollable) {
            const elementRect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const elementTopRelativeToContainer = elementRect.top - containerRect.top;
            const desiredScrollTop = container.scrollTop + elementTopRelativeToContainer - (container.clientHeight / 5);

            container.scrollTo({
              top: desiredScrollTop,
              behavior: 'smooth'
            });
          }

          //Apply static highlight class
          element.classList.add(classes.scrolledHighlight);
        } else if (element) {
          element.classList.add(classes.scrolledHighlight);
        }
      }, 200);

      return () => {
        if (scrollTimer) clearTimeout(scrollTimer);
      };
    }
  }, [isLoading, targetCommentId, comments, classes.scrolledHighlight]);

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      paperClassName={classes.dialogPaper}
    >
      <div className={classes.titleContainer}>
        {postDataForTree
          ? <Link to={postGetPageUrl(postDataForTree)} className={classes.title}>{postTitle}</Link>
          : <span className={classes.title}>{postTitle}</span>
        }
        <span className={classes.closeButton} onClick={onClose}>
          Close
        </span>
      </div>
      <DialogContent className={classes.dialogContent}>
        {isLoading && <Loading />}
        {!isLoading && postDataForTree && (
          <CommentsListSection 
            post={postDataForTree}
            comments={comments ?? []}
            totalComments={totalCount ?? 0}
            commentCount={(comments ?? []).length}
            loadMoreComments={() => {}}
            loadingMoreComments={false}
            highlightDate={undefined}
            setHighlightDate={() => {}}
            hideDateHighlighting={true}
            newForm={isPost}
          />
        )}
      </DialogContent>
    </LWDialog>
  );
};

export default registerComponent("UltraFeedCommentsDialog", UltraFeedCommentsDialog);



 
