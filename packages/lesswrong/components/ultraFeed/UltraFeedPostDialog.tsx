import React, { useEffect, useRef } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSingle } from "../../lib/crud/withSingle";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { useMulti } from "@/lib/crud/withMulti";
import LWDialog from "../common/LWDialog";
import FeedContentBody from "./FeedContentBody";
import UltraFeedItemFooter from "./UltraFeedItemFooter";
import Loading from "../vulcan-core/Loading";
import CommentsListSection from "../comments/CommentsListSection";
import ForumIcon from '../common/ForumIcon';
import { DialogContent } from "../widgets/DialogContent";
import TruncatedAuthorsList from "../posts/TruncatedAuthorsList";
import FormatDate from "../common/FormatDate";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import UltraFeedPostActions from "./UltraFeedPostActions";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const styles = defineStyles("UltraFeedPostDialog", (theme: ThemeType) => ({
  dialogContent: {
    padding: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    '&:first-child': {
      paddingTop: 0,
    }
  },
  stickyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    zIndex: 10,
    padding: '12px 20px',
    [theme.breakpoints.down('sm')]: {
      padding: '8px 10px',
    }
  },
  titleContainer: {
  },
  tripleDotMenu: {
    opacity: 0.7,
    padding: 5,
    marginLeft: 'auto',
    "& svg": {
      fontSize: 18,
      cursor: "pointer",
      color: theme.palette.text.dim,
      transform: 'rotate(90deg)',
    },
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: 24,
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  metaRow: {
    gap: "12px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    rowGap: "6px",
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      fontSize: 17,
    },
  },
  metaDateContainer: {
    marginRight: 8,
  },
  authorsList: {
    fontSize: 'inherit',
    color: 'inherit',
    fontFamily: 'inherit',
    marginRight: 8,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  scrollableContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 20px 20px',
    [theme.breakpoints.down('sm')]: {
      padding: '0 10px 10px 10px',
    }
  },
  title: {
    fontFamily: theme.palette.fonts.serifStack,
    fontSize: '1.4rem',
    fontWeight: 600,
    paddingTop: 4,
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
  chevronButton: {
    cursor: 'pointer',
    opacity: 0.6,
    marginRight: 12,
    fontSize: 36,
    '&:hover': {
      color: theme.palette.grey[700],
    },
    '& svg': {
      display: 'block',
    }
  },
  dialogPaper: {
    maxWidth: 765,
    height: '100dvh',
    maxHeight: '100dvh',
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
  footer: {
    marginTop: 24,
    marginBottom: 24,
  }
}));

type UltraFeedPostDialogProps = {
  post?: never;
  partialPost: PostsListWithVotes;
  onClose: () => void;
} | {
  post: PostsPage | UltraFeedPostFragment;
  partialPost?: never;
  onClose: () => void;
}

const UltraFeedPostDialog = ({
  post,
  onClose,
  partialPost,
}: UltraFeedPostDialogProps) => {
  const classes = useStyles(styles);
  const authorListRef = useRef<HTMLDivElement>(null);
  const isClosingViaBackRef = useRef(false);

  const postId = partialPost?._id ?? undefined;

  const { document: fetchedPost, loading: loadingPost } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "UltraFeedPostFragment",
    skip: !!post,
  });

  const fullPostForContent = fetchedPost ?? post;

  const { results: comments, loading: isCommentsLoading, totalCount: commentsTotalCount } = useMulti({
    terms: {
      view: "postCommentsTop",
      postId: post?._id ?? partialPost?._id,
      limit: 100, // TODO: add load more
    },
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !(post?._id ?? partialPost?._id),
    enableTotal: true,
  });

  const displayPost = fetchedPost ?? post ?? partialPost;

  useEffect(() => {
    window.history.pushState({ dialogOpen: true }, '');

    // Handle popstate (back button/swipe)
    const handlePopState = (event: PopStateEvent) => {
      if (!event.state?.dialogOpen) {
        isClosingViaBackRef.current = true;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If dialog is closing normally (not via back), remove the history entry
      if (!isClosingViaBackRef.current && window.history.state?.dialogOpen) {
        window.history.back();
      }
    };
  }, [onClose]);

  // Compute content props based on what data we have
  let contentData = null;
  
  if (fullPostForContent?.contents?.html) {
    contentData = {
      html: fullPostForContent.contents.html,
      wordCount: fullPostForContent.contents.wordCount ?? 0,
      showLoading: false,
    };
  } else if (partialPost?.contents?.htmlHighlight) {
    contentData = {
      html: partialPost.contents.htmlHighlight,
      wordCount: partialPost.contents.wordCount ?? 0,
      showLoading: true,
    };
  }

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      paperClassName={classes.dialogPaper}
    >
      <DialogContent className={classes.dialogContent}>
        {!displayPost && (
          <div className={classes.loadingContainer}>
            <Loading />
          </div>
        )}
        
        {displayPost && (
          <>
            <div className={classes.stickyHeader}>
              <ForumIcon 
                icon="ThickChevronLeft" 
                onClick={onClose} 
                className={classes.chevronButton} 
              />
              <AnalyticsContext pageElementContext="tripleDotMenu">
                <PostActionsButton
                  post={displayPost}
                  vertical={true}
                  autoPlace
                  ActionsComponent={UltraFeedPostActions}
                  className={classes.tripleDotMenu}
                />
              </AnalyticsContext>
            </div>
            <div className={classes.scrollableContent}>
              <div className={classes.titleContainer}>
                <div className={classes.headerContent}>
                  <div className={classes.titleWrapper}>
                    <Link
                      to={postGetPageUrl(displayPost)}
                      className={classes.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }
                    }>
                      {displayPost.title}
                    </Link>
                  </div>
                  <div className={classes.metaRow}>
                    <TruncatedAuthorsList 
                      post={displayPost} 
                      useMoreSuffix={false} 
                      expandContainer={authorListRef}
                      className={classes.authorsList} 
                    />
                    {displayPost.postedAt && (
                      <span className={classes.metaDateContainer}>
                        <FormatDate date={displayPost.postedAt} format="MMM D YYYY" />
                      </span>
                    )}
                    {displayPost.readTimeMinutes && (
                      <span>{displayPost.readTimeMinutes} min read</span>
                    )}
                  </div>
                </div>
              </div>

              {contentData && (
                <>
                  <FeedContentBody
                    html={contentData.html}
                    wordCount={contentData.wordCount}
                    initialWordCount={contentData.wordCount}
                    maxWordCount={contentData.wordCount}
                    hideSuffix
                    serifStyle
                  />
                  {contentData.showLoading && (
                    <div className={classes.loadingContainer}>
                      <Loading />
                    </div>
                  )}
                </>
              )}
              
              {!contentData && (
                <div className={classes.loadingContainer}>
                  <Loading />
                </div>
              )}
              
              <UltraFeedItemFooter
                document={displayPost}
                collectionName="Posts"
                metaInfo={{
                  sources: [],
                  displayStatus: "expanded",
                }}
                className={classes.footer}
              />
              {isCommentsLoading && fullPostForContent && (
                <div className={classes.loadingContainer}><Loading /></div>
              )}
              {comments && (
                <CommentsListSection
                  post={fullPostForContent}
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
            </div>
          </>
        )}
      </DialogContent>
    </LWDialog>
  );
};

export default UltraFeedPostDialog;


