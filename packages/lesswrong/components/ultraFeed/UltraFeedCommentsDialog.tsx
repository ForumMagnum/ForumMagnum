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
import { gql } from "@/lib/generated/gql-codegen";
import ForumIcon from '../common/ForumIcon';
import { useDialogNavigation } from "../hooks/useDialogNavigation";
import { useDisableBodyScroll } from "../hooks/useDisableBodyScroll";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { NetworkStatus } from "@apollo/client";

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
    padding: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    '&:first-child': {
      paddingTop: 0,
    },
  },
  stickyHeader: {
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: theme.palette.ultrafeedModalHeader.background,
    borderBottom: theme.palette.border.faint,
    borderRadius: '12px 12px 0 0',
    zIndex: theme.zIndexes.ultrafeedModalHeader,
    padding: '12px 20px',
    [theme.breakpoints.down('sm')]: {
      top: 0,
      left: 0,
      right: 0,
      borderRadius: 0,
      padding: '4px 6px',
    }
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "1.3rem",
    fontWeight: 600,
    maxWidth: 'calc(100% - 120px)', // Leave space for close button on both sides
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    width: 36, 
    height: 36,
    color: theme.palette.grey[600],
    backgroundColor: theme.palette.grey[200],
    borderRadius: 4,
    padding: 6,
    cursor: 'pointer',
    fontSize: 36,
    '&:hover': {
      color: theme.palette.grey[700],
    },
    '& svg': {
      display: 'block',
    },
    [theme.breakpoints.down('sm')]: {
      left: 6,
    }
  },
  dialogPaper: {
    width: 'calc(100vw - 24px)',
    maxWidth: 'calc(100vw - 24px)',
    height: 'calc(100dvh - 24px)',
    maxHeight: 'calc(100dvh - 24px)',
    margin: 12,
    borderRadius: 12,
    overflow: 'auto',
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
      maxWidth: '100vw',
      height: '100dvh',
      maxHeight: '100dvh',
      margin: 0,
      borderRadius: 0,
    },
  },
  scrolledHighlight: {
    backgroundColor: `${theme.palette.secondary.light}6c`,
  },
  scrolledHighlightFading: {
    backgroundColor: 'transparent !important',
    transition: 'background-color 3s ease-out',
  },
  scrollableContent: {
    flex: 1,
    padding: '0 20px 20px 20px',
    paddingTop: 84,
    overflowY: 'auto',
    [theme.breakpoints.down('sm')]: {
      padding: '0 10px 10px 10px',
      paddingTop: 48,
    }
  },
  contentColumn: {
    maxWidth: 720,
    margin: '0 auto',
  },
}));

/**
 * Finds the first scrollable parent container of the given element.
 * Traverses up the DOM tree from the element's parent, looking for a container
 * that has scrollable overflow (auto, scroll, or overlay) and actual content
 * to scroll (scrollHeight > clientHeight).
 * 
 * @param element - The element whose scrollable parent we want to find
 * @returns The first scrollable parent container, or null if none found
 */
const findScrollableParent = (element: HTMLElement): HTMLElement | null => {
  let node: HTMLElement | null = element.parentElement;
  
  while (node) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    
    if ((overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') 
        && node.scrollHeight > node.clientHeight) {
      return node;
    }
    
    node = node.parentElement;
  }
  
  return null;
};

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

  const postCommentsQuery = useQueryWithLoadMore(CommentsListMultiQuery, {
    variables: {
      selector: { postCommentsTop: { postId } },
      limit: 500,
      enableTotal: true,
    },
    skip: !isPost || !postId,
    itemsPerPage: 500,
  });

  const threadCommentsQuery = useQueryWithLoadMore(CommentsListMultiQuery, {
    variables: {
      selector: { repliesToCommentThreadIncludingRoot: { topLevelCommentId: topLevelCommentId ?? '' } },
      limit: 200,
      enableTotal: true,
    },
    skip: isPost || !topLevelCommentId,
    itemsPerPage: 100,
  });
  
  const {
    data: dataComments,
    loading: loadingComments,
    loadMoreProps,
    networkStatus,
  } = isPost ? postCommentsQuery : threadCommentsQuery;

  const comments = dataComments?.comments?.results;
  const totalCount = dataComments?.comments?.totalCount;

  const isLoading = loadingPost || (loadingComments && networkStatus !== NetworkStatus.fetchMore);
  const loadingMoreComments = (networkStatus === NetworkStatus.fetchMore);

  useDialogNavigation(onClose);
  useDisableBodyScroll();

  // TODO: Do this more elegantly, combine within existing functionality in CommentsNode?
  // scroll to comment clicked on when dialog opens
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    let fadeTimer: NodeJS.Timeout | null = null;

    if (!isLoading && targetCommentId && comments && comments.length > 0) {
      scrollTimer = setTimeout(() => {
        const element = window.document.getElementById(targetCommentId);

        if (element) {
          const container = findScrollableParent(element);

          if (container) {
            const elementRect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const elementTopRelativeToContainer = elementRect.top - containerRect.top;
            const desiredScrollTop = container.scrollTop + elementTopRelativeToContainer - (container.clientHeight / 5);

            container.scrollTo({
              top: desiredScrollTop,
              behavior: 'smooth'
            });
          }

          // Add highlight class for immediate color
          element.classList.add(classes.scrolledHighlight);

          // After a short delay, add the fading class to trigger the fade-out
          fadeTimer = setTimeout(() => {
            const currentElement = window.document.getElementById(targetCommentId);
            currentElement?.classList.add(classes.scrolledHighlightFading);
          }, 100);
        }
      }, 200);

      return () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        if (fadeTimer) clearTimeout(fadeTimer);
      };
    }
  }, [isLoading, targetCommentId, comments, classes.scrolledHighlight, classes.scrolledHighlightFading]);

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      paperClassName={classes.dialogPaper}
    >
      <DialogContent className={classes.dialogContent}>
        <div className={classes.stickyHeader}>
          <ForumIcon 
            icon="Close"
            onClick={onClose}
            className={classes.closeButton}
          />
          {postDataForTree
            ? <Link 
                to={postGetPageUrl(postDataForTree)} 
                className={classes.title}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                {postTitle}
              </Link>
            : <span className={classes.title} title={postTitle ?? undefined}>{postTitle}</span>
          }
        </div>
        <div className={classes.scrollableContent}>
          <div className={classes.contentColumn}>
            {isLoading && <Loading />}
            {!isLoading && postDataForTree && (
              <CommentsListSection 
                post={postDataForTree}
                comments={comments ?? []}
                totalComments={totalCount ?? 0}
                commentCount={(comments ?? []).length}
                loadMoreComments={loadMoreProps.loadMore}
                loadingMoreComments={loadingMoreComments}
                highlightDate={undefined}
                setHighlightDate={() => {}}
                hideDateHighlighting={true}
                newForm={isPost}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </LWDialog>
  );
};

export default registerComponent("UltraFeedCommentsDialog", UltraFeedCommentsDialog);



 
