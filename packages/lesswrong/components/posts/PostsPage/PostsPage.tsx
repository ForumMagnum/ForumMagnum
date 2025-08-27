import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { getResponseCounts, isDialogueParticipant, postCoauthorIsPending } from '../../../lib/collections/posts/helpers';
import { commentGetDefaultView, commentIncludedInCounts } from '../../../lib/collections/comments/helpers'
import { useCurrentUser } from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import { useRecordPostView } from '../../hooks/useRecordPostView';
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { isAF, isEAForum, isLWorAF, recombeeEnabledSetting, vertexEnabledSetting } from '@/lib/instanceSettings';
import classNames from 'classnames';
import { hasPostRecommendations, commentsTableOfContentsEnabled, hasSidenotes } from '../../../lib/betas';
import { useDialog } from '../../common/withDialog';
import { PostsPageContext } from './PostsPageContext';
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import { SHOW_PODCAST_PLAYER_COOKIE } from '../../../lib/cookies/cookies';
import { isValidCommentView } from '../../../lib/commentViewOptions';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import { subscriptionTypes } from '../../../lib/collections/subscriptions/helpers';
import { unflattenComments } from '../../../lib/utils/unflatten';
import PostsAudioPlayerWrapper, { postHasAudioPlayer } from './PostsAudioPlayerWrapper';
import { ImageProvider } from './ImageContext';
import { getMarketInfo, highlightMarket } from '../../../lib/collections/posts/annualReviewMarkets';
import { useDynamicTableOfContents } from '../../hooks/useDynamicTableOfContents';
import { RecombeeRecommendationsContextWrapper } from '../../recommendations/RecombeeRecommendationsContextWrapper';
import { useVote } from '@/components/votes/withVote';
import { getVotingSystemByName } from '@/lib/voting/getVotingSystem';
import DeferRender from '@/components/common/DeferRender';
import { SideItemVisibilityContextProvider } from '@/components/dropdowns/posts/SetSideItemVisibility';
import LWPostsPageHeader, { LW_POST_PAGE_PADDING } from './LWPostsPageHeader';
import { useCommentLinkState } from '@/components/comments/CommentsItem/useCommentLink';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { getReviewPhase, postEligibleForReview, reviewIsActive } from '@/lib/reviewUtils';
import { BestOfLWPostsPageSplashImage } from './BestOfLessWrong/BestOfLWPostsPageSplashImage';
import { useNavigate, useSubscribedLocation } from "@/lib/routeUtil";
import { useCurrentAndRecentForumEvents } from '@/components/hooks/useCurrentForumEvent';
import SharePostPopup from "../SharePostPopup";
import { SideItemsSidebar, SideItemsContainer } from "../../contents/SideItems";
import MultiToCLayout from "../TableOfContents/MultiToCLayout";
import CitationTags from "../../common/CitationTags";
import PostsPagePostHeader from "./PostsPagePostHeader";
import PostsPagePostFooter from "./PostsPagePostFooter";
import PostBodyPrefix from "./PostBodyPrefix";
import PostCoauthorRequest from "./PostCoauthorRequest";
import CommentPermalink from "../../comments/CommentPermalink";
import ToCColumn from "../TableOfContents/ToCColumn";
import WelcomeBox from "./WelcomeBox";
import TableOfContents from "../TableOfContents/TableOfContents";
import RSVPs from "./RSVPs";
import CloudinaryImage2 from "../../common/CloudinaryImage2";
import ContentStyles from "../../common/ContentStyles";
import PostBody from "./PostBody";
import { CommentOnSelectionContentWrapper } from "../../comments/CommentOnSelection";
import PermanentRedirect from "../../common/PermanentRedirect";
import DebateBody from "../../comments/DebateBody";
import PostsPageRecommendationsList from "../../recommendations/PostsPageRecommendationsList";
import PostSideRecommendations from "../../recommendations/PostSideRecommendations";
import PostBottomRecommendations from "../../recommendations/PostBottomRecommendations";
import { NotifyMeDropdownItem } from "../../dropdowns/NotifyMeDropdownItem";
import Row from "../../common/Row";
import AnalyticsInViewTracker from "../../common/AnalyticsInViewTracker";
import PostsPageQuestionContent from "../../questions/PostsPageQuestionContent";
import AFUnreviewedCommentCount from "../../alignment-forum/AFUnreviewedCommentCount";
import CommentsListSection from "../../comments/CommentsListSection";
import CommentsTableOfContents from "../../comments/CommentsTableOfContents";
import { MaybeStickyDigestAd } from "../../ea-forum/digestAd/StickyDigestAd";
import AttributionInViewTracker from "../../common/AttributionInViewTracker";
import ForumEventPostPagePollSection from "../../forumEvents/ForumEventPostPagePollSection";
import NotifyMeButton from "../../notifications/NotifyMeButton";
import LWTooltip from "../../common/LWTooltip";
import PostsPageDate from "./PostsPageDate";
import FundraisingThermometer from "../../common/FundraisingThermometer";
import PostPageReviewButton from "./PostPageReviewButton";
import HoveredReactionContextProvider from "../../votes/lwReactions/HoveredReactionContextProvider";
import FixedPositionToCHeading from '../TableOfContents/PostFixedPositionToCHeading';
import { CENTRAL_COLUMN_WIDTH, MAX_COLUMN_WIDTH, RECOMBEE_RECOMM_ID_QUERY_PARAM, RIGHT_COLUMN_WIDTH_WITH_SIDENOTES, RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES, RIGHT_COLUMN_WIDTH_XS, SHARE_POPUP_QUERY_PARAM, sidenotesHiddenBreakpoint, VERTEX_ATTRIBUTION_ID_QUERY_PARAM } from './constants';
import { getPostDescription, getStructuredData } from './structuredData';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ReadingProgressBar } from './ReadingProgressBar';
import { StructuredData } from '@/components/common/StructuredData';
import { LWCommentCount } from '../TableOfContents/LWCommentCount';
import { NetworkStatus, QueryResult } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery"
import { gql } from "@/lib/generated/gql-codegen";
import { returnIfValidNumber } from '@/lib/utils/typeGuardUtils';
import { useQueryWithLoadMore, LoadMoreProps } from '@/components/hooks/useQueryWithLoadMore';

const CommentsListMultiQuery = gql(`
  query multiCommentPostsPageQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

const HIDE_TOC_WORDCOUNT_LIMIT = 300
const MAX_ANSWERS_AND_REPLIES_QUERIED = 10000
const emptyArray: readonly any[] = [];

const getRecommendationsPosition = (): "right" | "underPost" => "underPost";

// Also used in PostsCompareRevisions
export const styles = defineStyles("PostsPage", (theme: ThemeType) => ({
  title: {
    marginBottom: 32,
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing.titleDividerSpacing,
    }
  },
  titleWithMarket: {
    [theme.breakpoints.down('sm')]: {
      marginBottom: 35,
    }
  },
  centralColumn: {
    marginLeft: 'auto',
    marginRight: 'auto',
    maxWidth: CENTRAL_COLUMN_WIDTH, // this necessary in both friendly and non-friendly UI to prevent Comment Permalinks from overflowing the page
    ...(theme.isFriendlyUI && {
      [theme.breakpoints.down('sm')]: {
        // This can only be used when display: "block" is applied, otherwise the 100% confuses the
        // grid layout into adding loads of left margin
        maxWidth: `min(100%, ${CENTRAL_COLUMN_WIDTH}px)`,
      }
    }),
  },
  postBody: {
    ...(theme.isFriendlyUI && {
      width: "100%",
    }),
  },
  audioPlayerHidden: {
    // Only show the play button next to headings if the audio player is visible
    '& .t3a-heading-play-button': {
      display: 'none !important'
    },
  },
  postContent: {
    marginBottom: theme.isFriendlyUI ? 40 : undefined
  },
  betweenPostAndComments: {
    minHeight: 24,
  },
  recommendations: {
    maxWidth: MAX_COLUMN_WIDTH,
    margin: "0 auto 40px",
  },
  commentsSection: {
    minHeight: hasPostRecommendations() ? undefined : 'calc(70vh - 100px)',
    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
      marginLeft: 0
    },
    // TODO: This is to prevent the Table of Contents from overlapping with the comments section. Could probably fine-tune the breakpoints and spacing to avoid needing this.
    background: theme.palette.background.pageActiveAreaBackground,
    position: "relative",
    paddingTop: theme.isFriendlyUI ? 16 : undefined
  },
  noCommentsPlaceholder: {
    marginTop: 60,
    color: theme.palette.grey[600],
    textAlign: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "1.6em",
  },
  // these marginTops are necessary to make sure the image is flush with the header,
  // since the page layout has different paddingTop values for different widths
  headerImageContainer: {
    paddingBottom: 15,
    [theme.breakpoints.up('md')]: {
      marginTop: -theme.spacing.mainLayoutPaddingTop,
    },
    [theme.breakpoints.down('sm')]: {
      marginTop: -12,
      marginLeft: -8,
      marginRight: -8,
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: -10,
    }
  },
  // if there is a comment above the image,
  // then we DON'T want to account for those paddingTop values
  headerImageContainerWithComment: {
    [theme.breakpoints.up('md')]: {
      marginTop: 10,
    },
    [theme.breakpoints.down('sm')]: {
      marginTop: 10,
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 10,
    }
  },
  headerImage: {
    width: '100vw',
    maxWidth: 682,
  },
  embeddedPlayer: {
    marginBottom: "30px"
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
  welcomeBox: {
    marginTop: LW_POST_PAGE_PADDING,
    maxWidth: 220,
    [theme.breakpoints.down('md')]: {
      display: 'none'
    }
  },
  bottomOfPostSubscribe: {
    marginBottom: 40,
    marginTop: 40,
    border: theme.palette.border.commentBorder,
    borderRadius: 5,
    display: "flex",
    justifyContent: "center",
  },
  splashHeaderImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100vh',
    width: '100vw',
  },
  reserveSpaceForSidenotes: {
    width: RIGHT_COLUMN_WIDTH_WITH_SIDENOTES,
    [sidenotesHiddenBreakpoint(theme)]: {
      width: RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES,
      [theme.breakpoints.down('xs')]: {
        width: RIGHT_COLUMN_WIDTH_XS,
      },
    },
  },
  reserveSpaceForIcons: {
    width: 0,
    [theme.breakpoints.up('xs')]: {
      width: RIGHT_COLUMN_WIDTH_XS,
      [theme.breakpoints.up('sm')]: {
        width: RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES,
      },
    },
  },
  subscribeToGroup: {
    padding: '8px 16px',
    ...theme.typography.body2,
  },
  dateAtBottom: {
    color: theme.palette.text.dim3,
    fontSize: theme.isFriendlyUI ? undefined : theme.typography.body2.fontSize,
    cursor: 'default'
  },
  reviewVoting: {
    marginTop: 60,
    marginBottom: -20 // to account or voting UI padding
  },
}));

const getDebateResponseBlocks = (responses: readonly CommentsList[], replies: readonly CommentsList[]) => responses.map(debateResponse => ({
  comment: debateResponse,
  replies: replies.filter(reply => reply.topLevelCommentId === debateResponse._id)
}));

export type EagerPostComments = {
  terms: CommentsViewTerms,
  queryResponse: QueryResult<postCommentsThreadQueryQuery> & { loadMoreProps: LoadMoreProps },
}

export const postsCommentsThreadMultiOptions = {
  collectionName: "Comments" as const,
  fragmentName: 'CommentsList' as const,
  fetchPolicy: 'cache-and-network' as const,
  enableTotal: true,
}

export const postCommentsThreadQuery = gql(`
  query postCommentsThreadQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

export function usePostCommentTerms<T extends CommentsViewTerms>(currentUser: UsersCurrent | null, defaultTerms: T, query: Record<string, string>) {
  const commentOpts = { includeAdminViews: currentUser?.isAdmin };
  // If the provided view is among the valid ones, spread whole query into terms, otherwise just do the default query
  let terms;
  let view;
  let limit;
  if (isValidCommentView(query.view, commentOpts)) {
    const { view: queryView, limit: queryLimit, ...rest } = query;
    terms = rest;
    view = queryView;
    limit = returnIfValidNumber(queryLimit);
  } else {
    const { view: defaultView, limit: defaultLimit, ...rest } = defaultTerms;
    terms = rest;
    view = defaultView;
    limit = defaultLimit;
  }

  limit ??= 1000;
  
  return useMemo(() => ({ terms, view, limit }), [terms, view, limit]);
}


const PostsPage = ({fullPost, postPreload, refetch}: {
  refetch: () => void,
} & (
  { fullPost: PostsWithNavigation|PostsWithNavigationAndRevision, postPreload: undefined }
  | { fullPost: undefined, postPreload: PostsListWithVotes }
)) => {
  const classes = useStyles(styles);
  const post = fullPost ?? postPreload;
  const location = useSubscribedLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const now = useCurrentTime();
  const { openDialog } = useDialog();
  const { recordPostView } = useRecordPostView(post);
  const [highlightDate,setHighlightDate] = useState<Date|undefined|null>(post?.lastVisitedAt ? new Date(post.lastVisitedAt) : undefined);
  const { currentForumEvent } = useCurrentAndRecentForumEvents();

  const { captureEvent } = useTracking();
  const [cookies, setCookie] = useCookiesWithConsent([SHOW_PODCAST_PLAYER_COOKIE]);
  const { query, params } = location;
  const [recommId, setRecommId] = useState<string | undefined>();
  const [attributionId, setAttributionId] = useState<string | undefined>();

  const votingSystem = getVotingSystemByName(post.votingSystem || 'default');
  const voteProps = useVote(post, 'Posts', votingSystem);

  const showEmbeddedPlayerCookie = cookies[SHOW_PODCAST_PLAYER_COOKIE] === "true";

  // Show the podcast player if the user opened it on another post, hide it if they closed it (and by default)
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(showEmbeddedPlayerCookie);

  const toggleEmbeddedPlayer = useCallback(() => {
    if (!post || !postHasAudioPlayer(post)) {
      return;
    }
    const action = showEmbeddedPlayer ? "close" : "open";
    const newCookieValue = showEmbeddedPlayer ? "false" : "true";
    captureEvent("toggleAudioPlayer", { action });
    setCookie(
      SHOW_PODCAST_PLAYER_COOKIE,
      newCookieValue, {

      path: "/"
    });
    setShowEmbeddedPlayer(!showEmbeddedPlayer);
  }, [post, showEmbeddedPlayer, captureEvent, setCookie]);

  const getSequenceId = () => {
    return params.sequenceId || fullPost?.canonicalSequenceId || null;
  }

  // We don't want to show the splash header if the user is on a `/s/:sequenceId/p/:postId` route
  // We explicitly don't use `getSequenceId` because that also gets the post's canonical sequence ID,
  // and we don't want to hide the splash header for any post that _is_ part of a sequence, since that's many review winners

  const isReviewWinner = ('reviewWinner' in post) && post.reviewWinner;
  const showSplashPageHeader = isLWorAF() && !!isReviewWinner && !params.sequenceId;

  useEffect(() => {
    if (!query[SHARE_POPUP_QUERY_PARAM]) return;

    if (fullPost) {
      openDialog({
        name: "SharePostPopup",
        contents: ({onClose}) => <SharePostPopup
          onClose={onClose}
          post={fullPost}
        />,
        closeOnNavigate: true,
      });
    }

    // Remove "sharePopup" from query once the popup is open, to prevent accidentally
    // sharing links with the popup open
    const currentQuery = isEmpty(query) ? {} : query
    const newQuery = {...currentQuery, [SHARE_POPUP_QUERY_PARAM]: undefined}
    navigate({...location.location, search: `?${qs.stringify(newQuery)}`})
  }, [navigate, location.location, openDialog, fullPost, query]);

  const sortBy: CommentSortingMode = (query.answersSorting as CommentSortingMode) || "top";
  const { data } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { answersAndReplies: { postId: post._id, sortBy } },
      limit: MAX_ANSWERS_AND_REPLIES_QUERIED,
      enableTotal: true,
    },
    skip: !post.question,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const answersAndReplies = data?.comments?.results;
  const answers = answersAndReplies?.filter(c => c.answer) ?? [];

  // note: these are from a debate feature that was deprecated in favor of collabEditorDialogue.
  // we're leaving it for now to keep supporting the few debates that were made with it, but
  // may want to migrate them at some point.
  const { data: dataDebateResponses, refetch: refetchDebateResponses } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { debateResponses: { postId: post._id } },
      limit: 1000,
      enableTotal: false,
    },
    skip: !post.debate,
    notifyOnNetworkStatusChange: true,
  });

  const debateResponses = dataDebateResponses?.comments?.results ?? emptyArray;

  const defaultView = commentGetDefaultView(post, currentUser);
  const defaultTerms = { view: defaultView, limit: 1000 };
  const { terms, view, limit } = usePostCommentTerms(currentUser, defaultTerms, query);

  // these are the replies to the debate responses (see earlier comment about deprecated feature)
  const { data: dataDebateResponseReplies } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { [view]: { ...terms, postId: post._id } },
      limit,
      enableTotal: false,
    },
    skip: !post.debate || !fullPost,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const debateReplies = dataDebateResponseReplies?.comments?.results;

  useEffect(() => {
    const recommId = query[RECOMBEE_RECOMM_ID_QUERY_PARAM];
    const attributionId = query[VERTEX_ATTRIBUTION_ID_QUERY_PARAM];

    void recordPostView({
      post: post,
      extraEventProperties: {
        sequenceId: getSequenceId()
      },
      recommendationOptions: {
        recombeeOptions: { recommId },
        vertexOptions: { attributionId }
      }
    });

    if (!recombeeEnabledSetting.get() && !vertexEnabledSetting.get()) return;
    setRecommId(recommId);
    setAttributionId(attributionId);

    // Remove recombee & vertex attribution ids from query once the they're stored to state and initial event fired off, to prevent accidentally
    // sharing links with the query params still present
    const currentQuery = isEmpty(query) ? {} : query;
    const newQuery = {
      ...currentQuery,
      [RECOMBEE_RECOMM_ID_QUERY_PARAM]: undefined,
      [VERTEX_ATTRIBUTION_ID_QUERY_PARAM]: undefined
    };
    navigate({...location.location, search: `?${qs.stringify(newQuery)}`}, { replace: true });  

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post._id]);
  
  const isOldVersion = !!(query.revision && post.contents);
  
  const sequenceId = getSequenceId();
  const sectionData = useDynamicTableOfContents({
    html: (post as PostsWithNavigationAndRevision)?.contents?.html ?? post?.contents?.htmlHighlight ?? "",
    post,
    answers,
  });
  const htmlWithAnchors = sectionData?.html || fullPost?.contents?.html || postPreload?.contents?.htmlHighlight || "";

  const showRecommendations = hasPostRecommendations() &&
    !currentUser?.hidePostsRecommendations &&
    !post.shortform &&
    !post.draft &&
    !post.deletedDraft &&
    !post.question &&
    !post.debate &&
    !post.isEvent &&
    !sequenceId &&
    (post.contents?.wordCount ?? 0) >= 500;
  const recommendationsPosition = getRecommendationsPosition();

  const { linkedCommentId: globalLinkedCommentId } = useCommentLinkState();
  const linkedCommentId = globalLinkedCommentId || params.commentId

  const description = fullPost ? getPostDescription(fullPost) : null

  const debateResponseIds = new Set((debateResponses ?? []).map(response => response._id));
  const debateResponseReplies = debateReplies?.filter(comment => comment.topLevelCommentId && debateResponseIds.has(comment.topLevelCommentId));

  const isDebateResponseLink = linkedCommentId && debateResponseIds.has(linkedCommentId);
  
  useEffect(() => {
    if (isDebateResponseLink) {
      navigate({ ...location.location, hash: `#debate-comment-${linkedCommentId}` }, {replace: true});
    }
    // No exhaustive deps to avoid any infinite loops with links to comments
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebateResponseLink, linkedCommentId]);

  const isCrosspostedQuestion = post.question &&
    post.fmCrosspost?.isCrosspost &&
    !post.fmCrosspost?.hostedHere;

  const marketInfo = getMarketInfo(post)

  const lazyResults = useQueryWithLoadMore(postCommentsThreadQuery, {
    variables: {
      selector: { [view]: { ...terms, postId: post._id } },
      limit,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network' as const,
  });

  const { loading, data: rawData, networkStatus, loadMoreProps: { loadMore } } = lazyResults;
  const rawComments = rawData?.comments?.results;
  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  // If the user has just posted a comment, and they are sorting by magic, put it at the top of the list for them
  const comments = useMemo(() => {
    if (!isEAForum() || !rawComments || view !== "postCommentsMagic") return rawComments;

    const recentUserComments = rawComments
      .filter((c) => c.userId === currentUser?._id && now.getTime() - new Date(c.postedAt).getTime() < 60000)
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

    if (!recentUserComments.length) return rawComments;

    return [...recentUserComments, ...rawComments.filter((c) => !recentUserComments.includes(c))];
    // Ignore `now` to make this more stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, rawComments, currentUser?._id]);

  const displayedPublicCommentCount = comments?.filter(c => commentIncludedInCounts(c))?.length ?? 0;
  const { commentCount: totalComments } = getResponseCounts({ post, answers })
  const commentTree = useMemo(() => unflattenComments(comments ?? []), [comments]);
  const answersTree = useMemo(() => unflattenComments(answersAndReplies ?? []), [answersAndReplies]);
  const answerCount = post.question ? answersTree.length : undefined;

  // Hide the table of contents on questions that are foreign crossposts
  // as we read ToC data from the foreign site and it includes answers
  // which don't exists locally. TODO: Remove this gating when we finally
  // rewrite crossposting.
  const hasTableOfContents = !!sectionData && !isCrosspostedQuestion;
  const tableOfContents = hasTableOfContents
    ? (isLWorAF()
        ? <TableOfContents
            sectionData={sectionData}
            title={post.title}
            heading={<FixedPositionToCHeading post={post}/>}
            fixedPositionToc={true}
          />
        : <TableOfContents sectionData={sectionData} title={post.title} fixedPositionToc={false} />
      )
    : null;

  const hashCommentId = location.hash.length >= 1 ? location.hash.slice(1) : null;
  // If the comment reference in the hash doesn't appear in the page, try and load it separately as a permalinked comment
  const showHashCommentFallback = useMemo(() => (
    hashCommentId && !loading && ![...(comments ?? []), ...(answersAndReplies ?? [])].map(({ _id }) => _id).includes(hashCommentId)
  ), [answersAndReplies, hashCommentId, loading, comments]);

  const [permalinkedCommentId, setPermalinkedCommentId] = useState((fullPost && !isDebateResponseLink) ? (linkedCommentId ?? null) : null)
  // Don't show loading state if we are are getting the id from the hash, because it might be a hash referencing a non-comment id in the page
  const silentLoadingPermalink = permalinkedCommentId === hashCommentId;
  useEffect(() => { // useEffect required because `location.hash` isn't sent to the server
    if (fullPost && !isDebateResponseLink) {
      if (linkedCommentId) {
        setPermalinkedCommentId(linkedCommentId)
      } else if (showHashCommentFallback) {
        setPermalinkedCommentId(hashCommentId)
      } else {
        setPermalinkedCommentId(null)
      }
    }
  }, [fullPost, hashCommentId, isDebateResponseLink, linkedCommentId, showHashCommentFallback])

  const splashHeaderImage = fullPost && showSplashPageHeader && <div className={classes.splashHeaderImage}>
    <ImageProvider>
      <BestOfLWPostsPageSplashImage post={fullPost} />
    </ImageProvider>
  </div>

  const header = <>
    {fullPost && !linkedCommentId && <>
      <StructuredData generate={() => getStructuredData({post: fullPost, description, commentTree, answersTree})}/>
      <CitationTags
        title={post.title}
        author={post.user?.displayName}
        coauthors={post.coauthors
          ?.filter(({ _id }) => !postCoauthorIsPending(post, _id))
          .map(({displayName}) => displayName)}
        date={post.createdAt ?? undefined}
      />
    </>}
    {/* Header/Title */}
    <AnalyticsContext pageSectionContext="postHeader">
      <div className={classNames(classes.title, {[classes.titleWithMarket] : highlightMarket(marketInfo)})}>
        <div className={classes.centralColumn}>
          {permalinkedCommentId && <CommentPermalink documentId={permalinkedCommentId} post={fullPost} silentLoading={silentLoadingPermalink} />}
          {post.eventImageId && <div className={classNames(classes.headerImageContainer, {[classes.headerImageContainerWithComment]: permalinkedCommentId})}>
            <CloudinaryImage2
              publicId={post.eventImageId}
              imgProps={{ar: '191:100', w: '682', q: '100'}}
              className={classes.headerImage}
            />
          </div>}
          <PostCoauthorRequest post={post} currentUser={currentUser} />
          {isBookUI() && <LWPostsPageHeader
            post={post}
            showEmbeddedPlayer={showEmbeddedPlayer}
            dialogueResponses={debateResponses}
            answerCount={answerCount}
            toggleEmbeddedPlayer={toggleEmbeddedPlayer}
            annualReviewMarketInfo={marketInfo}
            showSplashPageHeader={showSplashPageHeader}
            />}
          {!isBookUI() && <PostsPagePostHeader
            post={post}
            answers={answers ?? []}
            showEmbeddedPlayer={showEmbeddedPlayer}
            toggleEmbeddedPlayer={toggleEmbeddedPlayer}
            dialogueResponses={debateResponses} 
            annualReviewMarketInfo={marketInfo}/>}
          {(post._id === '5n2ZQcbc7r4R8mvqc') &&
            <FundraisingThermometer onPost />}
        </div>
      </div>
    </AnalyticsContext>
  </>;

  const welcomeBox = (
    <DeferRender ssr={false}>
      <div className={classes.welcomeBox}>
        <WelcomeBox />
      </div>
    </DeferRender>
  );

  const rightColumnChildren = (welcomeBox || hasSidenotes() || (showRecommendations && recommendationsPosition === "right")) && <>
    {welcomeBox}
    {showRecommendations && recommendationsPosition === "right" && fullPost && <PostSideRecommendations post={fullPost} />}
    {hasSidenotes() && <>
      <div className={classes.reserveSpaceForSidenotes}/>
      <SideItemsSidebar/>
    </>}
  </>;

  const postsPageContext = useMemo(() => ({fullPost: fullPost ?? null, postPreload: postPreload ?? null}), [fullPost, postPreload]);


  // If this is a non-AF post being viewed on AF, redirect to LW.
  if (isAF() && !post.af) {
    const lwURL = "https://www.lesswrong.com" + location.url;
    return <PermanentRedirect url={lwURL}/>
  }

  const userIsDialogueParticipant = currentUser && isDialogueParticipant(currentUser._id, post);
  const showSubscribeToDialogueButton = post.collabEditorDialogue && !userIsDialogueParticipant;

  // Show poll if tagged with the tag of the current forum event
  const showGlobalForumEventPoll = (currentForumEvent?.tagId ? (post?.tagRelevance?.[currentForumEvent.tagId] ?? 0) : 0) >= 1;

  // JB: postBodySection, betweenPostAndCommentsSection, and commentsSection are represented as variables here
  // to support the forum-gating below, because the comments-ToC changes the page structure wrt the ToC column
  // components. When the forum gating is removed, each of these variables should have only a single usage,
  // so inline it back into place. See also the forum gating in PostsCommentsSection, which must be removed at
  // the same time.

  const postBodySection =
    <div id="postBody" className={classNames(
      classes.centralColumn,
      classes.postBody,
      !showEmbeddedPlayer && classes.audioPlayerHidden
    )}>
      {isBookUI() && header}
      {/* Body */}
      {fullPost && isEAForum() && <PostsAudioPlayerWrapper showEmbeddedPlayer={showEmbeddedPlayer} post={fullPost}/>}
      {fullPost && post.isEvent && fullPost.activateRSVPs &&  <RSVPs post={fullPost} />}
      {!post.debate && <ContentStyles
        contentType="post"
        className={classNames(classes.postContent, "instapaper_body")}
      >
        <PostBodyPrefix post={post} query={query}/>
        <AnalyticsContext pageSectionContext="postBody">
          <HoveredReactionContextProvider voteProps={voteProps}>
          <CommentOnSelectionContentWrapper post={post}>
          <div id="postContent">
            {htmlWithAnchors && <>
              <PostBody
                post={post}
                html={htmlWithAnchors}
                isOldVersion={isOldVersion}
                voteProps={voteProps}
              />
              {post.isEvent && isBookUI() && <p className={classes.dateAtBottom}>Posted on: <PostsPageDate post={post} hasMajorRevision={false} /></p>
              }
              </>
            }
          </div>
          </CommentOnSelectionContentWrapper>
          </HoveredReactionContextProvider>
        </AnalyticsContext>
      </ContentStyles>}

      {showSubscribeToDialogueButton && <Row justifyContent="center">
        <div className={classes.bottomOfPostSubscribe}>
          <NotifyMeDropdownItem
            document={post}
            enabled={!!post.collabEditorDialogue}
            subscribeMessage="Subscribe to dialogue"
            unsubscribeMessage="Unsubscribe from dialogue"
            subscriptionType={subscriptionTypes.newPublishedDialogueMessages}
            tooltip="Notifies you when there is new activity in the dialogue"
          />
        </div>
      </Row>}

      {post.isEvent && post.group && isBookUI() &&
          <Row justifyContent="center">
            <div className={classes.bottomOfPostSubscribe}>
              <LWTooltip title={<div>Subscribed users get emails for future events by<div>{post.group?.name}</div></div>} placement='bottom'>
                <NotifyMeButton
                    showIcon
                    document={post.group}
                    subscribeMessage="Subscribe to group"
                    unsubscribeMessage="Unsubscribe from group"
                    className={classes.subscribeToGroup}
                />
              </LWTooltip>
            </div>
          </Row>
      }

      {post.debate && debateResponses && debateResponseReplies && fullPost &&
        <DebateBody
          debateResponses={getDebateResponseBlocks(debateResponses, debateResponseReplies)}
          post={fullPost}
        />}

    </div>
  const betweenPostAndCommentsSection =
    <div className={classNames(classes.centralColumn, classes.betweenPostAndComments)}>
      {reviewIsActive() && postEligibleForReview(post) && getReviewPhase() !== "RESULTS" && <div className={classes.reviewVoting}>
        <PostPageReviewButton post={post} />
      </div>}
      <PostsPagePostFooter post={post} sequenceId={sequenceId} />
      {showGlobalForumEventPoll && <DeferRender ssr={false}>
        <ForumEventPostPagePollSection postId={post._id} />
      </DeferRender>}
  
      {showRecommendations && recommendationsPosition === "underPost" &&
        <AnalyticsContext pageSectionContext="postBottomRecommendations">
          <div className={classes.recommendations}>
            <PostsPageRecommendationsList
              strategy="tagWeightedCollabFilter"
            />
          </div>
        </AnalyticsContext>
      }
    </div>

  const commentsSection =
    <AnalyticsInViewTracker eventProps={{inViewType: "commentsSection"}}>
      <AttributionInViewTracker eventProps={{ post, portion: 1, recommId, vertexAttributionId: attributionId }}>
        {/* Answers Section */}
        {post.question && <div className={classes.centralColumn}>
          <div id="answers"/>
          {fullPost && <AnalyticsContext pageSectionContext="answersSection">
            <PostsPageQuestionContent post={fullPost} answersTree={answersTree ?? []} refetch={refetch}/>
          </AnalyticsContext>}
        </div>}
        {/* Comments Section */}
        <div className={classes.commentsSection}>
          <AnalyticsContext pageSectionContext="commentsSection">
            {fullPost && <CommentsListSection
              comments={comments ?? []}
              loadMoreComments={loadMore}
              totalComments={totalComments}
              commentCount={displayedPublicCommentCount}
              loadingMoreComments={loadingMore}
              loading={loading}
              post={fullPost}
              newForm={!post.question && (!post.shortform || post.userId===currentUser?._id)}
              highlightDate={highlightDate ?? undefined}
              setHighlightDate={setHighlightDate}
            />}
            {isAF() && <AFUnreviewedCommentCount post={post}/>}
          </AnalyticsContext>
          {isFriendlyUI() && Math.max(post.commentCount, comments?.length ?? 0) < 1 &&
            <div className={classes.noCommentsPlaceholder}>
              <div>No comments on this post yet.</div>
              <div>Be the first to respond.</div>
            </div>
          }
        </div>
      </AttributionInViewTracker>
    </AnalyticsInViewTracker>

  const commentsToC = fullPost
    ? <CommentsTableOfContents
        commentTree={commentTree}
        answersTree={answersTree}
        post={fullPost}
        highlightDate={highlightDate ?? undefined}
      />
    : undefined

  return <AnalyticsContext pageContext="postsPage" postId={post._id}>
    <PostsPageContext.Provider value={postsPageContext}>
    <RecombeeRecommendationsContextWrapper postId={post._id} recommId={recommId}>
    <SideItemsContainer>
    <ImageProvider>
    <SideItemVisibilityContextProvider post={fullPost}>
    <ReadingProgressBar post={post}/>
    {splashHeaderImage}
    {commentsTableOfContentsEnabled()
      ? <MultiToCLayout
          segments={[
            {
              toc: (post.contents?.wordCount || 0) > HIDE_TOC_WORDCOUNT_LIMIT && tableOfContents,
              centralColumn: postBodySection,
              rightColumn: rightColumnChildren
            },
            {centralColumn: betweenPostAndCommentsSection},
            {
              toc: commentsToC,
              centralColumn: commentsSection,
              isCommentToC: true
            },
            {
              centralColumn: <PostBottomRecommendations post={post} hasTableOfContents={hasTableOfContents} />
            }
          ]}
          tocRowMap={[0, 0, 2, 2]}
          showSplashPageHeader={showSplashPageHeader}
          sharedToCFooter={<LWCommentCount
            answerCount={answerCount}
            commentCount={displayedPublicCommentCount}
          />}
        />
      : <ToCColumn
          tableOfContents={tableOfContents}
          header={header}
          rightColumnChildren={rightColumnChildren}
        >
          {postBodySection}
          {betweenPostAndCommentsSection}
          {commentsSection}
        </ToCColumn>
    }
  
    {isEAForum() && <DeferRender ssr={false}><MaybeStickyDigestAd post={post} /></DeferRender>}
    {hasPostRecommendations() && fullPost && <AnalyticsInViewTracker eventProps={{inViewType: "postPageFooterRecommendations"}}>
      <PostBottomRecommendations
        post={post}
        hasTableOfContents={hasTableOfContents}
      />
    </AnalyticsInViewTracker>}
    </SideItemVisibilityContextProvider>
    </ImageProvider>
    </SideItemsContainer>
    </RecombeeRecommendationsContextWrapper>
    </PostsPageContext.Provider>
  </AnalyticsContext>
}

export default registerComponent('PostsPage', PostsPage, {
  hocs: [withErrorBoundary],
  areEqual: "auto",
});

