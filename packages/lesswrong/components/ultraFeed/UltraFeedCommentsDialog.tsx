import React, { useEffect, useRef, useState } from "react";
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
import { useModalHashLinkScroll, scrollToElementInContainer } from "../hooks/useModalScroll";
import { useFootnoteHandlers } from "../hooks/useFootnoteHandlers";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { NetworkStatus } from "@apollo/client";
import FootnoteDialog from '../linkPreview/FootnoteDialog';

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
  // Hide footnote poppers/tooltips inside the modal – primarily for footnote display issue but a general experiment
  [theme.breakpoints.down('sm')]: {
    '& .LWPopper-root': {
      display: 'none !important',
    },
  },
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
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const [footnoteDialogHTML, setFootnoteDialogHTML] = useState<string | null>(null);

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
  
  const footnoteHandlers = useFootnoteHandlers({
    onFootnoteClick: (footnoteHTML: string) => {
      setFootnoteDialogHTML(footnoteHTML);
    }
  });
  
  // Handle clicks on hash links (like footnotes) within the modal. If we don't do this, clicking on hash links can close the modal, fail to scroll, etc.
  useModalHashLinkScroll(scrollableContentRef, true, false, footnoteHandlers);

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    let fadeTimer: NodeJS.Timeout | null = null;

    if (!isLoading && targetCommentId && comments && comments.length > 0) {
      scrollTimer = setTimeout(() => {
        const element = window.document.getElementById(targetCommentId);
        const container = scrollableContentRef.current;

        if (element && container) {
          scrollToElementInContainer(container, element, 0.2);

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
        <div className={classes.scrollableContent} ref={scrollableContentRef}>
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
      {footnoteDialogHTML && (
        <FootnoteDialog
          onClose={() => setFootnoteDialogHTML(null)}
          footnoteHTML={footnoteDialogHTML}
        />
      )}
    </LWDialog>
  );
};

export default registerComponent("UltraFeedCommentsDialog", UltraFeedCommentsDialog);



 
