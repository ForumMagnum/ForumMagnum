import React, { useEffect, useRef, useState } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import LWDialog from "../common/LWDialog";
import FeedContentBody from "./FeedContentBody";
import Loading from "../vulcan-core/Loading";
import CommentsListSection from "../comments/CommentsListSection";
import ForumIcon from '../common/ForumIcon';
import { DialogContent } from "../widgets/DialogContent";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import UltraFeedPostActions from "./UltraFeedPostActions";
import PostsAuthors from "../posts/PostsPage/PostsAuthors";
import PostsPageDate from "../posts/PostsPage/PostsPageDate";
import ReadTime from "../posts/PostsPage/ReadTime";
import { FeedPostMetaInfo } from "./ultraFeedTypes";
import FixedPositionToC from "../posts/TableOfContents/FixedPositionToC";
import { useDynamicTableOfContents } from "../hooks/useDynamicTableOfContents";
import PostFixedPositionToCHeading from '../posts/TableOfContents/PostFixedPositionToCHeading';
import LWCommentCount from '../posts/TableOfContents/LWCommentCount';
import { postPageTitleStyles } from "../posts/PostsPage/PostsPageTitle";
import { isFriendlyUI, isBookUI } from '../../themes/forumTheme';
import AudioToggle from '../posts/PostsPage/AudioToggle';
import BookmarkButton from '../posts/BookmarkButton';
import LWPostsPageTopHeaderVote from '../votes/LWPostsPageTopHeaderVote';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { SHOW_PODCAST_PLAYER_COOKIE } from '../../lib/cookies/cookies';
import PostsAudioPlayerWrapper, { postHasAudioPlayer } from '../posts/PostsPage/PostsAudioPlayerWrapper';
import { getVotingSystemByName } from '../../lib/voting/getVotingSystem';
import IconButton from "@/lib/vendor/@material-ui/core/src/IconButton";
import TocIcon from "@/lib/vendor/@material-ui/icons/src/Toc";
import UltraFeedPostToCDrawer from "./UltraFeedPostToCDrawer";
import { useDialogNavigation } from "../hooks/useDialogNavigation";
import { useDisableBodyScroll } from "../hooks/useDisableBodyScroll";

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
    },
  },
  stickyHeader: {
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  titleContainer: {
    marginTop: 24,
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
    }
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
    marginTop: 12,
    marginBottom: 24,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: 20,
    rowGap: 6,
    fontSize: isFriendlyUI ? theme.typography.body1.fontSize : '1.4rem',
    fontWeight: isFriendlyUI ? 450 : undefined,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.dim3,
    [theme.breakpoints.down('sm')]: {
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
    paddingTop: 84,
    [theme.breakpoints.down('sm')]: {
      padding: '0 10px 10px 10px',
      paddingTop: 36,
      overflowY: 'auto',
    }
  },
  title: {
    ...postPageTitleStyles(theme),
    width: '100%',
    textWrap: 'balance',
    [theme.breakpoints.down('sm')]: {
      fontSize: 24,
    },
    '&:hover': {
      opacity: 0.9,
      textDecoration: 'none',
    },
  },
  closeButton: {
    width: 36, 
    height: 36,
    color: theme.palette.grey[600],
    backgroundColor: theme.palette.grey[200],
    borderRadius: 4,
    padding: 6,
    cursor: 'pointer',
    marginRight: 8,
    fontSize: 36,
    '&:hover': {
      color: theme.palette.grey[700],
    },
    '& svg': {
      display: 'block',
    }
  },
  hamburgerMenuButton: {
    display: 'none',
    width: 36, 
    height: 36,
    backgroundColor: theme.palette.grey[200],
    borderRadius: 4,
    marginRight: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
    },
  },
  hamburgerIcon: {
    color: theme.palette.grey[700],
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
  contentColumn: {
    maxWidth: 720,
    margin: '0 auto',
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 0",
  },
  vote: {
    display: 'flex',
    flexDirection: 'row-reverse',
    fontSize: 13,
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
    // replicating PostsPage.tsx grid layout even though we haven't yet implemented side comments, reacts, and notes
    gridTemplateColumns: `
      0px
      minmax(200px, 270px)
      minmax(35px, 0.25fr)
      minmax(min-content, 720px)
      minmax(10px,30px)
      50px
      minmax(0px, 0.5fr)
    `,
    height: '100%',
    overflowY: 'auto',
    position: 'relative',
    paddingTop: 64,
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      paddingTop: 56,
    },
  },
  tocColumnWrapper: {
    position: 'sticky',
    top: 20, // Sticky to top of scrollable container (which has padding for header)
    height: 'calc(100vh - 24px - 64px - 60px)', // Account for modal margins, header and comment count height
    overflowY: 'hidden',
    paddingBottom: 30,
    paddingLeft: 16,
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      width: 0,
    },

    '& .FixedPositionToC-root': {
      maxHeight: 'calc(100vh - 24px - 64px - 50px)', // Account for modal margins and header height
    },
    '& .FixedPositionToC-rowOpacity, & .FixedPositionToC-headingOpacity': {
      opacity: 1,
    },
    '& .ToCRowHover': {
      opacity: 0,
      transition: 'opacity .25s',
    },
    '&:hover .ToCRowHover': {
      opacity: 1,
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
    bottom: 12,
    left: 12,
    width: 240,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderRadius: '0 0 0 12px',
    zIndex: 1000,
    opacity: 1,
    transition: 'opacity .25s',
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
  },
  headerActions: {
    display: 'flex',
    flexWrap: "nowrap",
    alignItems: 'center',
    columnGap: 8,
  },
  audioToggle: {
    opacity: 0.55,
    display: 'flex',
  },
  bookmarkButton: {
    position: 'relative',
    top: 4,
    opacity: 1,
    '&:hover': {
      opacity: 0.3,
    }
  },
  postActionsButton: {
    display: 'flex',
    alignItems: 'center',
    opacity: 0.3,
    '&:hover': {
      opacity: 0.2,
    }
  },
  modalWrapper: {
    zIndex: `${theme.zIndexes.ultrafeedModal} !important`,
  },
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
  const { captureEvent } = useTracking();
  const [cookies, setCookie] = useCookiesWithConsent([SHOW_PODCAST_PLAYER_COOKIE]);
  const showEmbeddedPlayerCookie = cookies[SHOW_PODCAST_PLAYER_COOKIE] === "true";
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(showEmbeddedPlayerCookie);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const dialogInnerRef = useRef<HTMLDivElement>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);

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

  const votingSystem = getVotingSystemByName(displayPost.votingSystem || 'default');

  const toggleEmbeddedPlayer = displayPost && postHasAudioPlayer(displayPost) ? (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const action = showEmbeddedPlayer ? "close" : "open";
    const newCookieValue = showEmbeddedPlayer ? "false" : "true";
    captureEvent("toggleAudioPlayer", { action });
    setCookie(
      SHOW_PODCAST_PLAYER_COOKIE,
      newCookieValue, {
      path: "/"
    });
    setShowEmbeddedPlayer(!showEmbeddedPlayer);
  } : undefined;

  // Predict if there will be a ToC based on word count to prevent layout shift
  const wordCount = displayPost.contents?.wordCount ?? 0;
  const shouldShowToc = wordCount > HIDE_TOC_WORDCOUNT_LIMIT;

  const tocData = useDynamicTableOfContents({
    html: fullPostForContent?.contents?.html ?? null,
    post: fullPostForContent ?? null,
    answers: [],
  });
  const hasTocData = !!tocData && (tocData.sections ?? []).length > 0;

  // Handle browser back button / swipe back navigation
  useDialogNavigation(onClose);
  useDisableBodyScroll();

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

  const finalHtml = tocData?.html ?? contentData?.html ?? "";

  if (contentData) {
    contentData = { ...contentData, html: finalHtml } as typeof contentData;
  }

  const tocButton = <div className={classes.hamburgerMenuButton}>
    <IconButton
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setNavigationOpen(prev => !prev);
      }}
      className={classes.hamburgerIcon}
    >
      <TocIcon />
    </IconButton>
  </div>

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      paperClassName={classes.dialogPaper}
      className={classes.modalWrapper}
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
                  icon="Close"
                  onClick={onClose}
                  className={classes.closeButton}
                />
                {tocButton}
                <div className={classes.headerActions}>
                  <BookmarkButton documentId={displayPost._id} collectionName="Posts" className={classes.bookmarkButton} placement="bottom-start" />
                  <div className={classes.audioToggle}>
                    <AudioToggle post={displayPost} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
                  </div>
                  <div className={classes.vote}>
                    <LWPostsPageTopHeaderVote post={displayPost} votingSystem={votingSystem} />
                  </div>
                  <AnalyticsContext pageElementContext="tripleDotMenu">
                    <PostActionsButton
                      post={displayPost}
                      flip
                      ActionsComponent={UltraFeedPostActions}
                      className={classes.postActionsButton}
                    />
                  </AnalyticsContext>
                </div>
              </div>
              <div className={shouldShowToc ? classes.dialogInnerWrapper : undefined} ref={shouldShowToc ? scrollableContentRef : undefined}>
                {shouldShowToc && (
                  <>
                    {/* placeholders for side comments, reacts, and notes with grid layout (helps get centering right) */}
                    <div />
                    <div className={classes.tocColumnWrapper}>
                      {hasTocData && tocData && (
                        <FixedPositionToC
                          tocSections={tocData.sections}
                          title={displayPost.title}
                          heading={<PostFixedPositionToCHeading post={displayPost as PostsListWithVotes}/>}
                          scrollContainerRef={scrollableContentRef as React.RefObject<HTMLElement>}
                        />
                      )}
                    </div>
                    <div />
                  </>
                )}
                <div 
                  className={classes.scrollableContent} 
                  ref={!shouldShowToc ? scrollableContentRef : undefined} 
                  id="postBody"
                >
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
                          <PostsAuthors 
                            post={displayPost} 
                            pageSectionContext="post_header"
                          />
                          {displayPost.postedAt && (
                            <span className={classes.metaDateContainer}>
                              <PostsPageDate post={displayPost} hasMajorRevision={false} />
                            </span>
                          )}
                          {displayPost.readTimeMinutes && (
                            <ReadTime post={displayPost} dialogueResponses={[]} />
                          )}
                        </div>
                      </div>
                    </div>

                    {fullPostForContent && <PostsAudioPlayerWrapper showEmbeddedPlayer={showEmbeddedPlayer} post={fullPostForContent}/>}

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
                  </div>
                  
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
                {/* placeholders for side comments, reacts, and notes with grid layout (helps get centering right) */}
                <div />
                <div />
                <div />
              </div>
              {shouldShowToc && (
                <div className={classes.commentCount} onClick={scrollToComments} style={{ cursor: 'pointer' }}>
                  <LWCommentCount commentCount={displayPost.commentCount} />
                </div>
              )}
              <UltraFeedPostToCDrawer
                open={navigationOpen}
                onClose={() => setNavigationOpen(false)}
                toc={tocData}
                post={displayPost}
                scrollContainerRef={scrollableContentRef}
              />
            </>
          )}
        </div>
      </DialogContent>
    </LWDialog>
  );
};

export default UltraFeedPostDialog;


