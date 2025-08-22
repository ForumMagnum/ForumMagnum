import qs from 'qs';
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import classNames from 'classnames';
import { defineStyles, useStyles } from "../hooks/useStyles";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl, postGetLink, postGetLinkTarget, detectLinkpost, getResponseCounts } from "@/lib/collections/posts/helpers";
import { BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD } from "@/components/posts/PostsPage/LWPostsPageHeader";
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
import { useModalHashLinkScroll, scrollToElementInContainer } from "../hooks/useModalScroll";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { NetworkStatus } from "@apollo/client";
import UltraFeedPostFooter from "./UltraFeedPostFooter";
import FootnoteDialog from '../linkPreview/FootnoteDialog';
import LWTooltip from "../common/LWTooltip";
import LinkPostMessage from "../posts/LinkPostMessage";
import { unflattenComments } from '../../lib/utils/unflatten';
import PostsPageQuestionContent from "../questions/PostsPageQuestionContent";
import { useSubscribedLocation } from "@/lib/routeUtil";
import { RecombeeRecommendationsContextWrapper } from '../recommendations/RecombeeRecommendationsContextWrapper';
import { Helmet } from '../common/Helmet';
import AnalyticsInViewTracker from "../common/AnalyticsInViewTracker";
import AttributionInViewTracker from "../common/AttributionInViewTracker";
import { commentIsHiddenPendingReview } from '../../lib/collections/comments/helpers';
import { ItemsReadContextWrapper } from '../hooks/useRecordPostView';
import Divider from '../common/Divider';
import CommentOnPostWithReplies from '../comments/CommentOnPostWithReplies';

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
    padding: '12px 12px',
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
    fontSize: '1.4rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.dim3,
    [theme.breakpoints.down('sm')]: {
    },
  },
  metaInfoSecondary: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: 20,
    rowGap: 6,
    flexWrap: 'wrap',
  },
  mobileCommentCount: {
    display: 'flex',
    position: 'relative',
    top: 4,
    alignItems: 'center',
    cursor: 'pointer',
    color: 'inherit',
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  metaDateContainer: {
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
  linkpost: {
    fontSize: theme.typography.body2.fontSize,
    textDecoration: 'none',
    '&:hover': {
      opacity: 0.7,
      cursor: 'pointer',
    }
  },
  scrollableContent: {
    flex: 1,
    padding: '0 20px 20px 20px',
    paddingTop: 20,
    [theme.breakpoints.down('sm')]: {
      padding: '0 10px 10px 10px',
      paddingTop: 10,
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
    color: theme.palette.grey[700],
    backgroundColor: theme.palette.grey[200],
    borderRadius: 4,
    padding: 6,
    cursor: 'pointer',
    marginRight: 8,
    fontSize: 36,
    fontWeight: 'bold',
    '&:hover': {
      color: theme.palette.grey[900],
      backgroundColor: theme.palette.grey[300],
    },
    '& svg': {
      display: 'block',
      strokeWidth: 2.5,
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: 3,
    },
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
  scrolledHighlight: {
    backgroundColor: `${theme.palette.secondary.light}6c`,
  },
  scrolledHighlightFading: {
    transition: 'background-color 3s ease-out',
  },
  '& .PostsPagePostFooter-voteBottom': {
    '&.PostsPagePostFooter-lwVote': {
      marginTop: '0 !important',
      marginBottom: '0 !important',
      '& .PostsVoteDefault-voteScores': {
        padding: '40% 15% 30% 15% !important'
      }
    }
  },
  permalinkSection: {
    maxWidth: 720,
    margin: '0 auto',
    marginTop: 32,
    marginBottom: 32,
  },
  permalinkLabel: {
    color: theme.palette.grey[600],
    marginBottom: theme.spacing.unit*2,
    marginLeft: 10,
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  seeInContext: {
    textAlign: 'right',
    color: theme.palette.lwTertiary.main,
    marginRight: 10,
    marginTop: 12,
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.palette.fonts.sansSerifStack,
    '& a': {
      '&:hover': {
        opacity: 0.7,
      }
    }
  },
  dividerMargins: {
    marginTop: 24,
    marginBottom: 24,
  },
  fullHeightFlex: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  clickable: {
    cursor: 'pointer',
  },
}));


const HIDE_TOC_WORDCOUNT_LIMIT = 300;
const MAX_ANSWERS_AND_REPLIES_QUERIED = 10000;

const ModalContextWrapper = ({ children, postId, recommId }: { 
  children: React.ReactNode;
  postId: string;
  recommId?: string;
}) => (
  <RecombeeRecommendationsContextWrapper postId={postId} recommId={recommId}>
    <ItemsReadContextWrapper>
      <AnalyticsContext pageModalContext="ultraFeedPostModal" postId={postId}>
        {children}
      </AnalyticsContext>
    </ItemsReadContextWrapper>
  </RecombeeRecommendationsContextWrapper>
);

const CommentPermalinkSection = ({ 
  targetComment, 
  displayPost, 
  targetCommentId,
  onSeeInContext,
}: {
  targetComment: CommentWithRepliesFragment | null | undefined;
  displayPost: PostsPage | UltraFeedPostFragment | PostsListWithVotes;
  targetCommentId: string;
  onSeeInContext: (e: React.MouseEvent) => void;
}) => {
  const classes = useStyles(styles);
  
  if (!targetComment) return null;
  
  if (commentIsHiddenPendingReview(targetComment) && !targetComment.rejected) {
    return (
      <>
        <div className={classes.permalinkLabel}>
          Comment Permalink
        </div>
        <p>Error: Sorry, this comment is not available</p>
      </>
    );
  }
  
  return (
    <>
      <div className={classes.permalinkLabel}>Comment Permalink</div>
      <CommentOnPostWithReplies
        key={targetComment._id}
        post={displayPost}
        comment={targetComment}
        commentNodeProps={{
          treeOptions: {
            refetch: () => {},
            showPostTitle: false,
          },
          forceUnTruncated: true,
          forceUnCollapsed: true,
          noAutoScroll: true
        }}
      />
      <div className={classes.seeInContext}>
        <a href={`#${targetCommentId}`} onClick={onSeeInContext}>
          See in context
        </a>
      </div>
    </>
  );
};

const COMMENTS_LIST_MULTI_QUERY = gql(`
  query multiCommentUltraFeedPostDialogQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

const ULTRA_FEED_POST_FRAGMENT_QUERY = gql(`
  query UltraFeedPostDialog($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...UltraFeedPostFragment
      }
    }
  }
`);

const TARGET_COMMENT_QUERY = gql(`
  query UltraFeedTargetComment($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentWithRepliesFragment
      }
    }
  }
`);



type UltraFeedPostDialogBaseProps = {
  postMetaInfo: FeedPostMetaInfo;
  targetCommentId?: string;
  openAtComments?: boolean;
  topLevelCommentId?: string;
  onClose: () => void;
}

type UltraFeedPostDialogProps = {
  post?: never;
  partialPost: PostsListWithVotes;
} & UltraFeedPostDialogBaseProps | {
  post: PostsPage | UltraFeedPostFragment;
  partialPost?: never;
} & UltraFeedPostDialogBaseProps

const UltraFeedPostDialog = ({
  post,
  partialPost,
  postMetaInfo,
  targetCommentId,
  openAtComments,
  topLevelCommentId,
  onClose,
}: UltraFeedPostDialogProps) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  const location = useSubscribedLocation();
  const { query } = location;
  
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const dialogInnerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  
  // State
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [footnoteDialogHTML, setFootnoteDialogHTML] = useState<string | null>(null);
  
  const [cookies, setCookie] = useCookiesWithConsent([SHOW_PODCAST_PLAYER_COOKIE]);
  const showEmbeddedPlayerCookie = cookies[SHOW_PODCAST_PLAYER_COOKIE] === "true";
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(showEmbeddedPlayerCookie);
  
  const postId = (partialPost ?? post)._id;
  const recommId = postMetaInfo.recommInfo?.recommId;
  
  // Fetch full post if needed
  const { loading: loadingPost, data: postData } = useQuery(ULTRA_FEED_POST_FRAGMENT_QUERY, {
    variables: { documentId: partialPost?._id },
    skip: !!post,
  });
  const fetchedPost = postData?.post?.result;
  const fullPostForContent = fetchedPost ?? post;
  
  const displayPost = fetchedPost ?? post ?? partialPost;
  
  const { loading: loadingTargetComment, data: targetCommentData, error: targetCommentError } = useQuery(TARGET_COMMENT_QUERY, {
    variables: { documentId: targetCommentId },
    skip: !targetCommentId,
  });
  const targetComment = targetCommentData?.comment?.result;
  
  const postCommentsQuery = useQueryWithLoadMore(COMMENTS_LIST_MULTI_QUERY, {
    variables: {
      selector: { postCommentsTop: { postId: postId ?? post?._id } },
      limit: 1500,
      enableTotal: true,
    },
    skip: !(postId ?? post?._id),
    itemsPerPage: 500,
  });

  const commentsQuery = postCommentsQuery;
  const {
    data: dataCommentsList,
    loading: isCommentsLoading,
    loadMoreProps,
    networkStatus,
  } = commentsQuery;
  
  const comments = dataCommentsList?.comments?.results;
  const totalCount = dataCommentsList?.comments?.totalCount;
  const loadingMoreComments = networkStatus === NetworkStatus.fetchMore;
  
  // Answers query for questions
  const sortBy: CommentSortingMode = (query.answersSorting as CommentSortingMode) || "top";
  const { data: dataAnswers, loading: isAnswersLoading, refetch: refetchAnswers } = useQuery(COMMENTS_LIST_MULTI_QUERY, {
    variables: {
      selector: { answersAndReplies: { postId: displayPost._id, sortBy } },
      limit: MAX_ANSWERS_AND_REPLIES_QUERIED,
      enableTotal: true,
    },
    skip: !displayPost.question,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  
  const answersAndReplies = dataAnswers?.comments?.results;
  const answers = answersAndReplies?.filter(c => c.answer) ?? [];
  const answersTree = useMemo(() => unflattenComments(answersAndReplies ?? []), [answersAndReplies]);
  const answerCount = displayPost.question ? answersTree.length : undefined;

  const { commentCount: totalComments } = getResponseCounts({ post: displayPost, answers });
  const votingSystem = getVotingSystemByName(displayPost.votingSystem || 'default');
  const { isLinkpost, linkpostDomain } = detectLinkpost(displayPost);
  const aboveLinkpostThreshold = displayPost.contents?.wordCount && 
    displayPost.contents?.wordCount >= BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD;
  
  // Table of contents
  const initialWordCount = partialPost?.contents?.wordCount ?? post?.contents?.wordCount ?? 0;
  const shouldShowToc = initialWordCount > HIDE_TOC_WORDCOUNT_LIMIT;
  const tocData = useDynamicTableOfContents({
    html: fullPostForContent?.contents?.html ?? null,
    post: fullPostForContent ?? null,
    answers: [],
  });
  const hasTocData = !!tocData && (tocData.sections ?? []).length > 0;
  
  const finalHtml = tocData?.html ?? fullPostForContent?.contents?.html ?? partialPost?.contents?.htmlHighlight ?? "";
  
  const scrollToElement = useCallback((elementId: string, onSuccess?: () => void) => {
    const scrollTimer = setTimeout(() => {
      const element = document.getElementById(elementId);
      const container = scrollableContentRef.current;

      if (element && container) {
        scrollToElementInContainer(container, element, 0.2);
        onSuccess?.();
      }
    }, 300);

    return () => {
      clearTimeout(scrollTimer);
    };
  }, [scrollableContentRef]);

  
  const handleClose = useCallback(() => {
    captureEvent("ultraFeedDialogClosed", { collectionName: "Posts", postId });
    onClose();
  }, [captureEvent, onClose, postId]);
  
  // Dialog navigation and scroll behavior
  const postUrl = displayPost ? 
    `${postGetPageUrl(displayPost)}?${qs.stringify({ 
      ...(targetCommentId ? { commentId: targetCommentId } : {}),
      from: 'feedModal' 
    })}` : undefined;
  useDialogNavigation(handleClose, postUrl);
  useDisableBodyScroll();
  useModalHashLinkScroll(scrollableContentRef, true, true, (footnoteHTML: string) => {
    setFootnoteDialogHTML(footnoteHTML);
  });

  const toggleEmbeddedPlayer = displayPost && postHasAudioPlayer(displayPost) ? (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const action = showEmbeddedPlayer ? "close" : "open";
    const newCookieValue = showEmbeddedPlayer ? "false" : "true";
    captureEvent("toggleAudioPlayer", { action, pageModalContext: "ultraFeedPostModal" });
    setCookie(SHOW_PODCAST_PLAYER_COOKIE, newCookieValue, { path: "/" });
    setShowEmbeddedPlayer(!showEmbeddedPlayer);
  } : undefined;
  
  const scrollToComments = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    captureEvent("ultraFeedPostDialogScrollToComments");
    
    const container = scrollableContentRef.current;
    if (displayPost.question) {
      const answersElement = document.getElementById('answers');
      if (container && answersElement) {
        scrollToElementInContainer(container, answersElement);
        return;
      }
    }
    
    const commentsElement = document.getElementById('commentsSection');
    if (container && commentsElement) {
      scrollToElementInContainer(container, commentsElement);
    }
  };
  
  const handleSeeInContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    captureEvent("ultraFeedPostDialogSeeInContext", { commentId: targetCommentId });
    
    if (!targetCommentId) return;
    
    const cleanup = scrollToElement(targetCommentId, () => {
      const element = document.getElementById(targetCommentId);
      if (element) {
        // Add highlight instantly
        element.classList.add(classes.scrolledHighlight);

        // After a brief delay, add transition and remove highlight to trigger fade
        const removeHighlightTimer = setTimeout(() => {
          element.classList.add(classes.scrolledHighlightFading);
          element.classList.remove(classes.scrolledHighlight);
          
          // Clean up transition class after animation completes
          const cleanupTimer = setTimeout(() => {
            element.classList.remove(classes.scrolledHighlightFading);
          }, 3000);
          
          // Store cleanup timer
          return () => clearTimeout(cleanupTimer);
        }, 100);
        
        // Store removal timer
        return () => clearTimeout(removeHighlightTimer);
      }
    });
    
    return cleanup;
  }, [targetCommentId, scrollToElement, classes.scrolledHighlight, classes.scrolledHighlightFading, captureEvent]);
  
  // Scroll to comments section if requested
  useEffect(() => {
    if (openAtComments && !isCommentsLoading) {
      const cleanup = scrollToElement('commentsSection');
      return cleanup;
    }
  }, [openAtComments, isCommentsLoading, scrollToElement]);
  
  // Bridge scroll events from container to window
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
  
  // Prepare content data
  let contentData = null;
  if (fullPostForContent?.contents?.html) {
    contentData = {
      html: finalHtml,
      wordCount: fullPostForContent.contents.wordCount ?? 0,
      showLoading: false,
    };
  } else if (partialPost?.contents?.htmlHighlight) {
    contentData = {
      html: finalHtml,
      wordCount: partialPost.contents.wordCount ?? 0,
      showLoading: true,
    };
  }
  
  const linkpostTooltip = <div>View the original at:<br/>{displayPost.url}</div>;
  
  const tocButton = (
    <div className={classes.hamburgerMenuButton}>
      <IconButton
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          captureEvent("ultraFeedPostDialogToCToggled", { open: !navigationOpen });
          setNavigationOpen(prev => !prev);
        }}
        className={classes.hamburgerIcon}
      >
        <TocIcon />
      </IconButton>
    </div>
  );

  if (!displayPost) {
    return (
      <LWDialog
        open={true}
        onClose={onClose}
        fullWidth
        disableBackdropClick
        paperClassName={classes.dialogPaper}
        className={classes.modalWrapper}
      >
        <ModalContextWrapper postId={postId} recommId={recommId}>
          <DialogContent className={classes.dialogContent}>
            <div className={classes.fullHeightFlex}>
              <div className={classes.loadingContainer}>
                <Loading />
              </div>
            </div>
          </DialogContent>
        </ModalContextWrapper>
      </LWDialog>
    );
  }

  return (
    <LWDialog
      open={true}
      onClose={handleClose}
      fullWidth
      disableBackdropClick
      paperClassName={classes.dialogPaper}
      className={classes.modalWrapper}
    >
      <ModalContextWrapper postId={postId} recommId={recommId}>
        <DialogContent className={classes.dialogContent}>
            {/* Canonical URL changed to enable audio player to work */}
            {postUrl && (
              <Helmet name="ultraFeedPostDialogCanonical">
                <link rel="canonical" href={postUrl} />
              </Helmet>
            )}
            <div ref={dialogInnerRef} className={classes.fullHeightFlex}>
              {/* Header */}
            <div className={classes.stickyHeader}>
              <ForumIcon 
                icon="ArrowLeft"
                onClick={handleClose}
                className={classes.closeButton}
              />
              {tocButton}
              <div className={classes.headerActions}>
                <BookmarkButton 
                  documentId={displayPost._id} 
                  collectionName="Posts" 
                  className={classes.bookmarkButton} 
                  placement="bottom-start" 
                />
                <div className={classes.audioToggle}>
                  <AudioToggle 
                    post={displayPost} 
                    toggleEmbeddedPlayer={toggleEmbeddedPlayer} 
                    showEmbeddedPlayer={showEmbeddedPlayer} 
                  />
                </div>
                <div className={classes.vote}>
                  <LWPostsPageTopHeaderVote 
                    post={displayPost} 
                    votingSystem={votingSystem} 
                  />
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
            
            {/* Main content */}
            <div className={classes.dialogInnerWrapper} ref={scrollableContentRef}>
              {/* Grid placeholders for layout */}
              <div />
              
              {/* Table of Contents column */}
              <div className={classes.tocColumnWrapper}>
                {shouldShowToc && hasTocData && tocData && (
                  <FixedPositionToC
                    tocSections={tocData.sections}
                    title={displayPost.title}
                    heading={<PostFixedPositionToCHeading post={displayPost as PostsListWithVotes}/>}
                    scrollContainerRef={scrollableContentRef}
                  />
                )}
              </div>
              
              <div />
              
              <div className={classes.scrollableContent} id="postBody">

                {/* Target Comment Permalink Section */}
                {targetCommentId && <div className={classes.permalinkSection}>
                  {loadingTargetComment && <Loading />}
                  {(targetCommentError || (!targetComment && !loadingTargetComment)) && <div>Comment not found</div>}
                  {!loadingTargetComment && !targetCommentError && targetComment && <CommentPermalinkSection
                    targetComment={targetComment}
                    displayPost={displayPost}
                    targetCommentId={targetCommentId}
                    onSeeInContext={handleSeeInContext}
                  />}
                  <div className={classes.dividerMargins}><Divider /></div>
                </div>}
                
                <div id="postContent" className={classes.contentColumn}>
                  <div className={classes.titleContainer}>
                    <div className={classes.headerContent}>
                      <div className={classes.titleWrapper}>
                        <Link
                          to={postGetPageUrl(displayPost)}
                          className={classes.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClose();
                          }}
                        >
                          {displayPost.title}
                        </Link>
                      </div>
                      
                      <div className={classes.metaRow}>
                        <PostsAuthors 
                          post={displayPost} 
                          pageSectionContext="post_header"
                        />
                        <div className={classes.metaInfoSecondary}>
                          {displayPost.postedAt && (
                            <span className={classes.metaDateContainer}>
                              <PostsPageDate post={displayPost} hasMajorRevision={false} />
                            </span>
                          )}
                          {displayPost.readTimeMinutes && (
                            <ReadTime post={displayPost} dialogueResponses={[]} />
                          )}
                          {isLinkpost && linkpostDomain && aboveLinkpostThreshold && (
                            <LWTooltip title={linkpostTooltip}>
                              <a 
                                href={postGetLink(displayPost)} 
                                target={postGetLinkTarget(displayPost)} 
                                className={classes.linkpost}
                              >
                                Linkpost from {linkpostDomain}
                              </a>
                            </LWTooltip>
                          )}
                          <div 
                            className={classNames(classes.mobileCommentCount, classes.clickable)} 
                            onClick={scrollToComments}
                          >
                            <LWCommentCount 
                              commentCount={displayPost.commentCount} 
                              answerCount={answerCount} 
                              label={false} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {fullPostForContent && (
                    <PostsAudioPlayerWrapper 
                      showEmbeddedPlayer={showEmbeddedPlayer} 
                      post={fullPostForContent}
                    />
                  )}

                  {displayPost && !aboveLinkpostThreshold && (
                    <LinkPostMessage post={displayPost} />
                  )}

                  {contentData && (
                    <>
                      <FeedContentBody
                        html={contentData.html}
                        wordCount={contentData.wordCount}
                        initialWordCount={(openAtComments || !!targetCommentId) ? 100 : contentData.wordCount}
                        maxWordCount={contentData.wordCount}
                        serifStyle
                      />
                      {contentData.showLoading && (
                        <div className={classes.loadingContainer}>
                          <Loading />
                        </div>
                      )}
                    </>
                  )}
                  
                  {!contentData && loadingPost && (
                    <div className={classes.loadingContainer}>
                      <Loading />
                    </div>
                  )}
                  
                  {fullPostForContent && (
                    <div className={classes.footer}>
                      <UltraFeedPostFooter post={fullPostForContent} />
                    </div>
                  )}
                </div>
                
                <AnalyticsInViewTracker eventProps={{ inViewType: "commentsSection" }}>
                <AttributionInViewTracker eventProps={{ post: displayPost, portion: 1, recommId }}>
                  {displayPost.question && fullPostForContent && (
                    <div id="answers" className={classes.contentColumn}>
                      <AnalyticsContext pageSectionContext="answersSection">
                        {isAnswersLoading ? (
                          <div className={classes.loadingContainer}>
                            <Loading />
                          </div>
                        ) : (
                          <PostsPageQuestionContent 
                            post={fullPostForContent} 
                            answersTree={answersTree} 
                            refetch={() => {
                              void refetchAnswers();
                            }}
                          />
                        )}
                      </AnalyticsContext>
                    </div>
                  )}
                  
                  {isCommentsLoading && !loadingMoreComments && fullPostForContent && (
                    <div className={classes.loadingContainer}>
                      <Loading />
                    </div>
                  )}
                  
                  <div id="commentsSection">
                    {comments && (
                      <CommentsListSection
                        post={fullPostForContent}
                        comments={comments ?? []}
                        totalComments={totalComments}
                        commentCount={(comments ?? []).length}
                        loadMoreComments={loadMoreProps.loadMore}
                        loadingMoreComments={loadingMoreComments}
                        highlightDate={undefined}
                        setHighlightDate={() => {}}
                        hideDateHighlighting={true}
                        newForm={true}
                        treeOptions={{ forceNotSingleLine: true }}
                      />
                    )}
                  </div>
                </AttributionInViewTracker>
                </AnalyticsInViewTracker>
              </div>
              
              {/* Grid placeholders so we can match the grid layout of PostsPage.tsx, placeholders for side comments, etc */}
              <div />
              <div />
              <div />
            </div>
            
            {/* Comment count button (desktop only) */}
            {shouldShowToc && (
              <div 
                className={classNames(classes.commentCount, classes.clickable)} 
                onClick={scrollToComments}
              >
                <LWCommentCount 
                  commentCount={displayPost.commentCount} 
                  answerCount={answerCount} 
                />
              </div>
            )}
            
            <UltraFeedPostToCDrawer
              open={navigationOpen}
              onClose={() => setNavigationOpen(false)}
              toc={tocData}
              post={displayPost}
              scrollContainerRef={scrollableContentRef}
            />
          </div>
        </DialogContent>
        
        {footnoteDialogHTML && (
          <FootnoteDialog
            onClose={() => setFootnoteDialogHTML(null)}
            footnoteHTML={footnoteDialogHTML}
          />
        )}
      </ModalContextWrapper>
    </LWDialog>
  );
};

export default UltraFeedPostDialog;


