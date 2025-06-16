import React, { useEffect, useRef } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import LWDialog from "../common/LWDialog";
import FeedContentBody from "./FeedContentBody";
import UltraFeedItemFooter from "./UltraFeedItemFooter";
import Loading from "../vulcan-core/Loading";
import CommentsListSection from "../comments/CommentsListSection";
import ForumIcon from '../common/ForumIcon';
import { DialogContent } from "../widgets/DialogContent";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import UltraFeedPostActions from "./UltraFeedPostActions";
import TruncatedAuthorsList from "../posts/TruncatedAuthorsList";
import FormatDate from "../common/FormatDate";
import { FeedPostMetaInfo } from "./ultraFeedTypes";
import FixedPositionToC from "../posts/TableOfContents/FixedPositionToC";
import { useDynamicTableOfContents } from "../hooks/useDynamicTableOfContents";
import PostFixedPositionToCHeading from '../posts/TableOfContents/PostFixedPositionToCHeading';
import LWCommentCount from '../posts/TableOfContents/LWCommentCount';

const HIDE_TOC_WORDCOUNT_LIMIT = 300;

const CommentsListMultiQuery = gql(`
  query multiCommentUltraFeedPostDialogQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

const UltraFeedPostFragmentQuery = gql(`
  query UltraFeedPostDialog($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...UltraFeedPostFragment
      }
    }
  }
`);

const styles = defineStyles("UltraFeedPostDialog", (theme: ThemeType) => ({
  dialogContent: {
    padding: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
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
    width: '100vw',
    maxWidth: '100vw',
    height: '100dvh',
    maxHeight: '100dvh',
    margin: 0,
    borderRadius: 0,
    overflow: 'auto',
  },
  contentColumn: {
    maxWidth: 720,
    margin: '0 auto',
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
  },
  tocWrapper: {
  },
  scrollableContentWithToc: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 20px 20px',
    [theme.breakpoints.down('sm')]: {
      padding: '0 10px 10px 10px',
    },
  },
  gridWrapper: {
    display: 'grid',
    gridTemplateColumns: 'minmax(200px, 270px) 1fr',
    height: '100%',
    overflow: 'hidden',
  },
  dialogInnerWrapper: {
    display: 'grid',
    gridTemplateColumns: 'minmax(200px, 270px) 1fr',
    height: '100%',
    overflowY: 'auto',
    position: 'relative',
  },
  tocColumnWrapper: {
    position: 'sticky',
    top: 0,
    height: 'calc(100vh - 60px)', // Account for comment count height
    overflowY: 'hidden', // Prevent independent scrolling
    paddingBottom: 30,
    paddingLeft: 16,
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      width: 0,
    },
    '& .FixedPositionToC-tocTitle': {
      paddingLeft: 12,
    },
    '& .FixedPositionToC-root': {
      maxHeight: 'calc(100vh - 50px)',
    },
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  commentCount: {
    position: 'fixed',
    paddingLeft: 12,
    paddingTop: 12,
    paddingBottom: 20,
    height: 50,
    bottom: 0,
    left: 0,
    width: 240,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    zIndex: 1000,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  scrollOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 270,
    height: '100%',
    zIndex: 1,
    pointerEvents: 'none',
    '& *': {
      pointerEvents: 'auto',
    },
  }
}));

type UltraFeedPostDialogProps = {
  post?: never;
  partialPost: PostsListWithVotes;
  postMetaInfo: FeedPostMetaInfo;
  onClose: () => void;
} | {
  post: PostsPage | UltraFeedPostFragment;
  partialPost?: never;
  postMetaInfo: FeedPostMetaInfo;
  onClose: () => void;
}

const UltraFeedPostDialog = ({
  post,
  partialPost,
  postMetaInfo,
  onClose,
}: UltraFeedPostDialogProps) => {
  const classes = useStyles(styles);
  const authorListRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const dialogInnerRef = useRef<HTMLDivElement>(null);
  const isClosingViaBackRef = useRef(false);

  const postId = partialPost?._id ?? undefined;

  const { loading: loadingPost, data } = useQuery(UltraFeedPostFragmentQuery, {
    variables: { documentId: postId },
    skip: !!post,
  });
  const fetchedPost = data?.post?.result;

  const fullPostForContent = fetchedPost ?? post;

  const { data: dataCommentsList, loading: isCommentsLoading } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { postCommentsTop: { postId: postId ?? post?._id } },
      limit: 100, // TODO: add load more
      enableTotal: true,
    },
    skip: !(postId ?? post?._id),
    notifyOnNetworkStatusChange: true,
  });

  const comments = dataCommentsList?.comments?.results;
  const commentsTotalCount = dataCommentsList?.comments?.totalCount;

  const displayPost = fetchedPost ?? post ?? partialPost;

  // Predict if there will be a ToC based on word count to prevent layout shift
  const wordCount = displayPost.contents?.wordCount ?? 0;
  const shouldShowToc = wordCount > HIDE_TOC_WORDCOUNT_LIMIT;

  const tocData = useDynamicTableOfContents({
    html: fullPostForContent?.contents?.html ?? null,
    post: fullPostForContent as any,
    answers: [],
  });
  const hasTocData = !!tocData && (tocData.sections ?? []).length > 0;

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

  // Disable background scroll while dialog open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Bridge scroll events from internal container to window so hooks relying on window scroll keep working
  useEffect(() => {
    const el = scrollableContentRef.current;
    if (!el) return;
    const handler = () => {
      window.dispatchEvent(new Event('scroll'));
    };
    el.addEventListener('scroll', handler);
    return () => {
      el.removeEventListener('scroll', handler);
    };
  }, [hasTocData]);

  // Handle clicking on comment count to scroll to comments
  const scrollToComments = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = scrollableContentRef.current;
    const commentsElement = document.getElementById('comments');
    if (container && commentsElement) {
      const containerRect = container.getBoundingClientRect();
      const commentsRect = commentsElement.getBoundingClientRect();
      const offsetInsideContainer = commentsRect.top - containerRect.top;
      
      container.scrollTo({
        top: container.scrollTop + offsetInsideContainer - (container.clientHeight * 0.2),
        behavior: 'smooth',
      });
    }
  };

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

  // Prefer HTML with injected anchors for headings if available
  const finalHtml = tocData?.html ?? contentData?.html ?? "";

  if (contentData) {
    contentData = { ...contentData, html: finalHtml } as typeof contentData;
  }

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      paperClassName={classes.dialogPaper}
    >
      <DialogContent className={classes.dialogContent}>
        <div ref={dialogInnerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            <div className={shouldShowToc ? classes.dialogInnerWrapper : undefined} ref={shouldShowToc ? scrollableContentRef : undefined}>
              {shouldShowToc && (
                <div className={classes.tocColumnWrapper}>
                  {hasTocData && tocData && (
                    <FixedPositionToC
                      tocSections={tocData.sections}
                      title={displayPost.title}
                      heading={<PostFixedPositionToCHeading post={displayPost as PostsListWithVotes}/>}
                      hover={true}
                      scrollContainerRef={scrollableContentRef as React.RefObject<HTMLElement>}
                    />
                  )}
                </div>
              )}
              <div className={classes.scrollableContent} ref={!shouldShowToc ? scrollableContentRef : undefined} id="postBody">
                <div id="postContent" className={classes.contentColumn}>
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
                        html={finalHtml}
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
                    metaInfo={postMetaInfo}
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
              </div>
            </div>
            {shouldShowToc && (
              <div className={classes.commentCount} onClick={scrollToComments} style={{ cursor: 'pointer' }}>
                <LWCommentCount commentCount={displayPost.commentCount} />
              </div>
            )}
            </>
          )}
        </div>
      </DialogContent>
    </LWDialog>
  );
};

export default UltraFeedPostDialog;


