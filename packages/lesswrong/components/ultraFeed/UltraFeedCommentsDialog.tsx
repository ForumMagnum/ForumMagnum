import React, { useEffect } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { DialogContent } from "../widgets/DialogContent";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import LWDialog from "../common/LWDialog";
import CommentsListSection from "../comments/CommentsListSection";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListMultiQuery = gql(`
  query multiCommentUltraFeedCommentsDialogQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

const PostsDetailsQuery = gql(`
  query UltraFeedCommentsDialog($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsDetails
      }
    }
  }
`);

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

  const { loading: loadingPost, data } = useQuery(PostsDetailsQuery, {
    variables: { documentId: postId },
    skip: !postId,
  });
  const postDataForTree = data?.post?.result;

  const { data: dataPostComments, loading: loadingPostComments } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { postCommentsTop: { postId } },
      limit: 50,
      enableTotal: true,
    },
    skip: !isPost || !postId,
    notifyOnNetworkStatusChange: true,
  });

  const postComments = dataPostComments?.comments?.results;
  const postCommentsTotalCount = dataPostComments?.comments?.totalCount;

  const { data: dataThreadComments, loading: loadingThreadComments } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { repliesToCommentThreadIncludingRoot: { topLevelCommentId: topLevelCommentId ?? '' } },
      limit: 50,
      enableTotal: true,
    },
    skip: isPost || !topLevelCommentId,
    notifyOnNetworkStatusChange: true,
  });

  const threadComments = dataThreadComments?.comments?.results;
  const threadCommentsTotalCount = dataThreadComments?.comments?.totalCount;

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



 
