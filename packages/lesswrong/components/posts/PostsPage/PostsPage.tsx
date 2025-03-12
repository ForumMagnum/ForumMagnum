import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { getConfirmedCoauthorIds, postCoauthorIsPending, postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers'
import { useCurrentUser } from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import { useRecordPostView } from '../../hooks/useRecordPostView';
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import {forumTitleSetting, isAF, isEAForum, isLWorAF} from '../../../lib/instanceSettings';
import { cloudinaryCloudNameSetting, lightconeFundraiserActive, lightconeFundraiserThermometerGoalAmount, recombeeEnabledSetting, vertexEnabledSetting } from '../../../lib/publicSettings';
import classNames from 'classnames';
import { hasPostRecommendations, commentsTableOfContentsEnabled, hasDigests, hasSidenotes } from '../../../lib/betas';
import { useDialog } from '../../common/withDialog';
import { UseMultiResult, useMulti } from '../../../lib/crud/withMulti';
import { PostsPageContext } from './PostsPageContext';
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import { SHOW_PODCAST_PLAYER_COOKIE } from '../../../lib/cookies/cookies';
import { isServer } from '../../../lib/executionEnvironment';
import { isValidCommentView } from '../../../lib/commentViewOptions';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { tagGetUrl } from '../../../lib/collections/tags/helpers';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import { useOnServerSentEvent } from '../../hooks/useUnreadNotifications';
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema';
import { CommentTreeNode, unflattenComments } from '../../../lib/utils/unflatten';
import { postHasAudioPlayer } from './PostsAudioPlayerWrapper';
import { ImageProvider } from './ImageContext';
import { getMarketInfo, highlightMarket } from '../../../lib/collections/posts/annualReviewMarkets';
import isEqual from 'lodash/isEqual';
import { usePostReadProgress } from '../usePostReadProgress';
import { useDynamicTableOfContents } from '../../hooks/useDynamicTableOfContents';
import { RecombeeRecommendationsContextWrapper } from '../../recommendations/RecombeeRecommendationsContextWrapper';
import { getBrowserLocalStorage } from '../../editor/localStorageHandlers';
import { HoveredReactionContextProvider } from '@/components/votes/lwReactions/HoveredReactionContextProvider';
import { useVote } from '@/components/votes/withVote';
import { getVotingSystemByName } from '@/lib/voting/votingSystems';
import DeferRender from '@/components/common/DeferRender';
import { SideItemVisibilityContextProvider } from '@/components/dropdowns/posts/SetSideItemVisibility';
import { LW_POST_PAGE_PADDING } from './LWPostsPageHeader';
import { useCommentLinkState } from '@/components/comments/CommentsItem/useCommentLink';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { getReviewPhase, postEligibleForReview, reviewIsActive } from '@/lib/reviewUtils';
import { BestOfLWPostsPageSplashImage } from './BestOfLWPostsPageSplashImage';
import { useNavigate, useSubscribedLocation } from "@/lib/routeUtil";

const HIDE_TOC_WORDCOUNT_LIMIT = 300
export const MAX_COLUMN_WIDTH = 720
export const CENTRAL_COLUMN_WIDTH = 682

export const RIGHT_COLUMN_WIDTH_WITH_SIDENOTES = 300;
export const RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES = 50;
export const RIGHT_COLUMN_WIDTH_XS = 5;
export const sidenotesHiddenBreakpoint = (theme: ThemeType) =>
  theme.breakpoints.down('md')


export const SHARE_POPUP_QUERY_PARAM = 'sharePopup';
export const RECOMBEE_RECOMM_ID_QUERY_PARAM = 'recombeeRecommId';
export const VERTEX_ATTRIBUTION_ID_QUERY_PARAM = 'vertexAttributionId';

const MAX_ANSWERS_AND_REPLIES_QUERIED = 10000

const POST_DESCRIPTION_EXCLUSIONS: RegExp[] = [
  /cross-? ?posted/i,
  /epistemic status/i,
  /acknowledgements/i
];

const getRecommendationsPosition = (): "right" | "underPost" => "underPost";

/** Get a og:description-appropriate description for a post */
export const getPostDescription = (post: {
  contents?: { plaintextDescription: string | null } | null;
  customHighlight?: { plaintextDescription: string | null } | null;
  socialPreviewData?: { text: string | null } | null;
  shortform: boolean;
  user: { displayName: string } | null;
}) => {
  if (post.socialPreviewData?.text) {
    return post.socialPreviewData.text;
  }

  const longDescription = post.customHighlight?.plaintextDescription || post.contents?.plaintextDescription;
  if (longDescription) {
    // concatenate the first few paragraphs together up to some reasonable length
    const plaintextPars = longDescription
      // paragraphs in the plaintext description are separated by double-newlines
      .split(/\n\n/)
      // get rid of bullshit opening text ('epistemic status' or 'crossposted from' etc)
      .filter((par) => !POST_DESCRIPTION_EXCLUSIONS.some((re) => re.test(par)));

    if (!plaintextPars.length) return "";

    // concatenate paragraphs together with a delimiter, until they reach an
    // acceptable length (target is 100-200 characters)
    // this will return a longer description if one of the first couple of
    // paragraphs is longer than 200
    let firstFewPars = plaintextPars[0];
    for (const par of plaintextPars.slice(1)) {
      const concat = `${firstFewPars} • ${par}`;
      // If we're really short, we need more
      if (firstFewPars.length < 40) {
        firstFewPars = concat;
        continue;
      }
      // Otherwise, if we have room for the whole next paragraph, concatenate it
      if (concat.length < 150) {
        firstFewPars = concat;
        continue;
      }
      // If we're here, we know we have enough and couldn't fit the last
      // paragraph, so we should stop
      break;
    }
    if (firstFewPars.length > 148) {
      return firstFewPars.slice(0, 149).trim() + "…";
    }
    return firstFewPars + " …";
  }
  if (post.shortform)
    return `A collection of shorter posts ${
      post.user ? `by ${forumTitleSetting.get()} user ${post.user.displayName}` : ""
    }`;
  return null;
};


const getCommentStructuredData = ({
  comment
}: {
  comment: CommentTreeNode<CommentsList>
}): Record<string, any> => ({
  "@type": "Comment",
  text: comment.item.contents?.html,
  datePublished: new Date(comment.item.postedAt).toISOString(),
  author: [{
    "@type": "Person",
    name: comment.item.user?.displayName,
    url: userGetProfileUrl(comment.item.user, true),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/CommentAction",
        },
        userInteractionCount: comment.item.user?.[isAF ? "afCommentCount" : "commentCount"],
      },
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/WriteAction",
        },
        userInteractionCount: comment.item.user?.[isAF ? "afPostCount" : "postCount"],
      },
    ],
  }],
  ...(comment.children.length > 0 && {comment: comment.children.map(child => getCommentStructuredData({comment: child}))})
})

/**
 * Build structured data for a post to help with SEO.
 */
const getStructuredData = ({
  post,
  description,
  commentTree,
  answersTree
}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision;
  description: string | null;
  commentTree: CommentTreeNode<CommentsList>[];
  answersTree: CommentTreeNode<CommentsList>[];
}) => {
  const hasUser = !!post.user;
  const hasCoauthors = !!post.coauthors && post.coauthors.length > 0;
  const answersAndComments = [...answersTree, ...commentTree];
  // Get comments from Apollo Cache

  return {
    "@context": "http://schema.org",
    "@type": "DiscussionForumPosting",
    "url": postGetPageUrl(post, true),
    "text": post.contents?.html ?? description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postGetPageUrl(post, true),
    },
    headline: post.title,
    ...(description && { description: description }),
    datePublished: new Date(post.postedAt).toISOString(),
    about: post.tags.filter(tag => !!tag.description?.htmlHighlight).map(tag => ({
      "@type": "Thing",
      name: tag.name,
      url: tagGetUrl(tag, undefined, true),
      description: tag.description?.htmlHighlight,
    })),
    ...(hasUser && {
      author: [
        {
          "@type": "Person",
          name: post.user.displayName,
          url: userGetProfileUrl(post.user, true),
        },
        ...(hasCoauthors
          ? post.coauthors
              .filter(({ _id }) => !postCoauthorIsPending(post, _id))
              .map(coauthor => ({
                "@type": "Person",
                "name": coauthor.displayName,
                url: userGetProfileUrl(post.user, true),
              }))
          : []),
      ],
    }),
    ...(answersAndComments.length > 0 && {comment: answersAndComments.map(comment => getCommentStructuredData({comment}))}),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/CommentAction",
        },
        userInteractionCount: post.commentCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/LikeAction",
        },
        userInteractionCount: post.baseScore,
      },
    ],
  };
};


// Also used in PostsCompareRevisions
export const styles = (theme: ThemeType) => ({
  readingProgressBar: {
    position: 'fixed',
    top: 0,
    height: 4,
    width: 'var(--scrollAmount)',
    background: theme.palette.primary.main,
    '--scrollAmount': '0%',
    zIndex: theme.zIndexes.commentBoxPopup,
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8
    }
  },
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
    ...(isFriendlyUI && {
      [theme.breakpoints.down('sm')]: {
        // This can only be used when display: "block" is applied, otherwise the 100% confuses the
        // grid layout into adding loads of left margin
        maxWidth: `min(100%, ${CENTRAL_COLUMN_WIDTH}px)`,
      }
    }),
  },
  postBody: {
    ...(isFriendlyUI && {
      width: "max-content",
    }),
  },
  audioPlayerHidden: {
    // Only show the play button next to headings if the audio player is visible
    '& .t3a-heading-play-button': {
      display: 'none !important'
    },
  },
  postContent: {
    marginBottom: isFriendlyUI ? 40 : undefined
  },
  betweenPostAndComments: {
    minHeight: 24,
  },
  recommendations: {
    maxWidth: MAX_COLUMN_WIDTH,
    margin: "0 auto 40px",
  },
  commentsSection: {
    minHeight: hasPostRecommendations ? undefined : 'calc(70vh - 100px)',
    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
      marginLeft: 0
    },
    // TODO: This is to prevent the Table of Contents from overlapping with the comments section. Could probably fine-tune the breakpoints and spacing to avoid needing this.
    background: theme.palette.background.pageActiveAreaBackground,
    position: "relative",
    paddingTop: isFriendlyUI ? 16 : undefined
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
  splashPageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100vh',
    width: '100vw',
  },
  secondSplashPageHeader: {
    ...theme.typography.postStyle,
    fontSize: '46px',
    lineHeight: 1,
    textWrap: 'balance',
    fontWeight: '600'
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
    fontSize: isFriendlyUI ? undefined : theme.typography.body2.fontSize,
    cursor: 'default'
  },
  reviewVoting: {
    marginTop: 60,
    marginBottom: -20 // to account or voting UI padding
  }
})

const getDebateResponseBlocks = (responses: CommentsList[], replies: CommentsList[]) => responses.map(debateResponse => ({
  comment: debateResponse,
  replies: replies.filter(reply => reply.topLevelCommentId === debateResponse._id)
}));

export type EagerPostComments = {
  terms: CommentsViewTerms,
  queryResponse: UseMultiResult<'CommentsList'>,
}

export const postsCommentsThreadMultiOptions = {
  collectionName: "Comments" as const,
  fragmentName: 'CommentsList' as const,
  fetchPolicy: 'cache-and-network' as const,
  enableTotal: true,
}

const PostsPage = ({fullPost, postPreload, eagerPostComments, refetch, classes}: {
  eagerPostComments?: EagerPostComments,
  refetch: () => void,
  classes: ClassesType<typeof styles>,
} & (
  { fullPost: PostsWithNavigation|PostsWithNavigationAndRevision, postPreload: undefined }
  | { fullPost: undefined, postPreload: PostsListWithVotes }
)) => {
  const post = fullPost ?? postPreload;
  const location = useSubscribedLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const now = useCurrentTime();
  const { openDialog } = useDialog();
  const { recordPostView } = useRecordPostView(post);
  const [showDigestAd, setShowDigestAd] = useState(false)
  const [highlightDate,setHighlightDate] = useState<Date|undefined|null>(post?.lastVisitedAt && new Date(post.lastVisitedAt));

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

  const toggleEmbeddedPlayer = post && postHasAudioPlayer(post) ? () => {
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

  const disableProgressBar = (isBookUI || isServer || post.isEvent || post.question || post.debate || post.shortform || post.readTimeMinutes < 3);

  const { readingProgressBarRef } = usePostReadProgress({
    updateProgressBar: (element, scrollPercent) => element.style.setProperty("--scrollAmount", `${scrollPercent}%`),
    disabled: disableProgressBar,
    useFixedToCScrollCalculation: false
  });
  
  // postReadCount is currently only used by StickyDigestAd, to only show the ad after the client has visited multiple posts.
  const ls = getBrowserLocalStorage()
  useEffect(() => {
    if (ls && hasDigests) {
      const postReadCount = ls.getItem('postReadCount') ?? '0'
      ls.setItem('postReadCount', `${parseInt(postReadCount) + 1}`)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // On the EA Forum, show a digest ad at the bottom of the screen after the user scrolled down.
  useEffect(() => {
    if (!isEAForum || isServer || post.isEvent || post.question || post.shortform) return

    checkShowDigestAd()
    window.addEventListener('scroll', checkShowDigestAd)

    return () => {
      window.removeEventListener('scroll', checkShowDigestAd)
    };
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const checkShowDigestAd = () => {
    // Ad stays visible once shown
    setShowDigestAd((showAd) => showAd || window.scrollY > 1000)
  }

  const getSequenceId = () => {
    return params.sequenceId || fullPost?.canonicalSequenceId || null;
  }


  // We don't want to show the splash header if the user is on a `/s/:sequenceId/p/:postId` route
  // We explicitly don't use `getSequenceId` because that also gets the post's canonical sequence ID,
  // and we don't want to hide the splash header for any post that _is_ part of a sequence, since that's many review winners
  const isReviewWinner = ('reviewWinner' in post) && post.reviewWinner;
  const showSplashPageHeader = isLWorAF && !!isReviewWinner && !params.sequenceId;

  useEffect(() => {
    if (!query[SHARE_POPUP_QUERY_PARAM]) return;

    if (fullPost) {
      openDialog({
        componentName: "SharePostPopup",
        componentProps: {
          post: fullPost,
        },
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
  const { results: answersAndReplies } = useMulti({
    terms: {
      view: "answersAndReplies",
      postId: post._id,
      limit: MAX_ANSWERS_AND_REPLIES_QUERIED,
      sortBy
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    skip: !post.question,
  });
  const answers = answersAndReplies?.filter(c => c.answer) ?? [];

  // note: these are from a debate feature that was deprecated in favor of collabEditorDialogue.
  // we're leaving it for now to keep supporting the few debates that were made with it, but
  // may want to migrate them at some point.
  const { results: debateResponses=[], refetch: refetchDebateResponses } = useMulti({
    terms: {
      view: 'debateResponses',
      postId: post._id,
    },
    collectionName: 'Comments',
    fragmentName: 'CommentsList',
    skip: !post.debate,
    limit: 1000
  });
  
  useOnServerSentEvent('notificationCheck', currentUser, (message) => {
    if (currentUser && isDialogueParticipant(currentUser._id, post)) {
      refetchDebateResponses();
    }
  });

  const defaultView = commentGetDefaultView(post, currentUser)
  // If the provided view is among the valid ones, spread whole query into terms, otherwise just do the default query
  const commentOpts = {includeAdminViews: currentUser?.isAdmin};
  const defaultCommentTerms = useMemo(() => ({view: defaultView, limit: 1000}), [defaultView])
  const commentTerms: CommentsViewTerms = isValidCommentView(query.view, commentOpts)
    ? {...(query as CommentsViewTerms), limit:1000}
    : defaultCommentTerms;

  // these are the replies to the debate responses (see earlier comment about deprecated feature)
  const { results: debateReplies } = useMulti({
    terms: {...commentTerms, postId: post._id},
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    skip: !post.debate || !fullPost
  });

const { HeadTags, CitationTags, PostsPagePostHeader, LWPostsPageHeader, PostsPagePostFooter, PostBodyPrefix,
    PostCoauthorRequest, CommentPermalink, ToCColumn, WelcomeBox, TableOfContents, RSVPs,
    CloudinaryImage2, ContentStyles, PostBody, CommentOnSelectionContentWrapper,
    PermanentRedirect, DebateBody, PostsPageRecommendationsList, PostSideRecommendations,
    PostBottomRecommendations, NotifyMeDropdownItem, Row, AnalyticsInViewTracker,
    PostsPageQuestionContent, AFUnreviewedCommentCount, CommentsListSection, CommentsTableOfContents,
    StickyDigestAd, PostsPageSplashHeader, PostsAudioPlayerWrapper, AttributionInViewTracker,
    ForumEventPostPagePollSection, NotifyMeButton, LWTooltip, PostsPageDate,
    PostFixedPositionToCHeading, SingleColumnSection, FundraisingThermometer, PostPageReviewButton
  } = Components

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

  const showRecommendations = hasPostRecommendations &&
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
  const ogUrl = postGetPageUrl(post, true) // open graph
  const canonicalUrl = fullPost?.canonicalSource || ogUrl
  // For imageless posts this will be an empty string
  let socialPreviewImageUrl = post.socialPreviewData?.imageUrl ?? "";
  if (post.isEvent && post.eventImageId) {
    socialPreviewImageUrl = `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_fill,g_auto,ar_191:100/${post.eventImageId}`
  }

  const debateResponseIds = new Set((debateResponses ?? []).map(response => response._id));
  const debateResponseReplies = debateReplies?.filter(comment => debateResponseIds.has(comment.topLevelCommentId));

  const isDebateResponseLink = linkedCommentId && debateResponseIds.has(linkedCommentId);
  
  useEffect(() => {
    if (isDebateResponseLink) {
      navigate({ ...location.location, hash: `#debate-comment-${linkedCommentId}` }, {replace: true});
    }
    // No exhaustive deps to avoid any infinite loops with links to comments
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebateResponseLink, linkedCommentId]);

  const onClickCommentOnSelection = useCallback((html: string) => {
    openDialog({
      componentName: "ReplyCommentDialog",
      componentProps: {
        post, initialHtml: html
      },
    })
  }, [openDialog, post]);

  const isCrosspostedQuestion = post.question &&
    post.fmCrosspost?.isCrosspost &&
    !post.fmCrosspost?.hostedHere;

  const shouldLowKarmaNoIndex = isEAForum && post.baseScore <= 0;
  const noIndex = fullPost?.noIndex || post.rejected || shouldLowKarmaNoIndex;

  const marketInfo = getMarketInfo(post)

  // check for deep equality between terms and eagerPostComments.terms
  const useEagerResults = eagerPostComments && isEqual(commentTerms, eagerPostComments?.terms);

  const lazyResults = useMulti({
    terms: {...commentTerms, postId: post._id},
    skip: useEagerResults,
    ...postsCommentsThreadMultiOptions,
  });

  const { loading, results: rawResults, loadMore, loadingMore, totalCount } = useEagerResults ? eagerPostComments.queryResponse : lazyResults;

  // If the user has just posted a comment, and they are sorting by magic, put it at the top of the list for them
  const results = useMemo(() => {
    if (!isEAForum || !rawResults || commentTerms.view !== "postCommentsMagic") return rawResults;

    const recentUserComments = rawResults
      .filter((c) => c.userId === currentUser?._id && now.getTime() - new Date(c.postedAt).getTime() < 60000)
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

    if (!recentUserComments.length) return rawResults;

    return [...recentUserComments, ...rawResults.filter((c) => !recentUserComments.includes(c))];
    // Ignore `now` to make this more stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentTerms.view, rawResults, currentUser?._id]);

  const commentCount = results?.length ?? 0;
  const commentTree = unflattenComments(results ?? []);
  const answersTree = unflattenComments(answersAndReplies ?? []);
  const answerCount = post.question ? answersTree.length : undefined;

  // Hide the table of contents on questions that are foreign crossposts
  // as we read ToC data from the foreign site and it includes answers
  // which don't exists locally. TODO: Remove this gating when we finally
  // rewrite crossposting.
  const hasTableOfContents = !!sectionData && !isCrosspostedQuestion;
  const tableOfContents = hasTableOfContents
    ? (isLWorAF
        ? <TableOfContents
            sectionData={sectionData}
            title={post.title}
            heading={<PostFixedPositionToCHeading post={post}/>}
            fixedPositionToc={true}
          />
        : <TableOfContents sectionData={sectionData} title={post.title} fixedPositionToc={false} />
      )
    : null;

  const hashCommentId = location.hash.length >= 1 ? location.hash.slice(1) : null;
  // If the comment reference in the hash doesn't appear in the page, try and load it separately as a permalinked comment
  const showHashCommentFallback = useMemo(() => (
    hashCommentId && !loading && ![...(results ?? []), ...(answersAndReplies ?? [])].map(({ _id }) => _id).includes(hashCommentId)
  ), [answersAndReplies, hashCommentId, loading, results]);

  const [permalinkedCommentId, setPermalinkedCommentId] = useState(fullPost && !isDebateResponseLink ? linkedCommentId : null)
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

  const splashPageHeader = fullPost && <BestOfLWPostsPageSplashImage post={fullPost} />

  const header = <>
    {fullPost && !linkedCommentId && <>
      <HeadTags
        ogUrl={ogUrl} canonicalUrl={canonicalUrl} image={socialPreviewImageUrl}
        title={post.title}
        description={description}
        noIndex={noIndex}
        structuredData={getStructuredData({post: fullPost, description, commentTree, answersTree})}
      />
      <CitationTags
        title={post.title}
        author={post.user?.displayName}
        coauthors={post.coauthors
          ?.filter(({ _id }) => !postCoauthorIsPending(post, _id))
          .map(({displayName}) => displayName)}
        date={post.createdAt}
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
          {isBookUI && <LWPostsPageHeader
            post={post}
            fullPost={fullPost}
            showEmbeddedPlayer={showEmbeddedPlayer}
            dialogueResponses={debateResponses}
            answerCount={answerCount}
            toggleEmbeddedPlayer={toggleEmbeddedPlayer}
            annualReviewMarketInfo={marketInfo}
            showSplashPageHeader={showSplashPageHeader}
            />}
          {!isBookUI && <PostsPagePostHeader
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

  const rightColumnChildren = (welcomeBox || hasSidenotes || (showRecommendations && recommendationsPosition === "right")) && <>
    {welcomeBox}
    {showRecommendations && recommendationsPosition === "right" && fullPost && <PostSideRecommendations post={fullPost} />}
    {hasSidenotes && <>
      <div className={classes.reserveSpaceForSidenotes}/>
      <Components.SideItemsSidebar/>
    </>}
  </>;

  // If this is a non-AF post being viewed on AF, redirect to LW.
  if (isAF && !post.af) {
    const lwURL = "https://www.lesswrong.com" + location.url;
    return <PermanentRedirect url={lwURL}/>
  }

  const userIsDialogueParticipant = currentUser && isDialogueParticipant(currentUser._id, post);
  const showSubscribeToDialogueButton = post.collabEditorDialogue && !userIsDialogueParticipant;
  
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
      {isBookUI && header}
      {/* Body */}
      {fullPost && isEAForum && <PostsAudioPlayerWrapper showEmbeddedPlayer={showEmbeddedPlayer} post={fullPost}/>}
      {fullPost && post.isEvent && fullPost.activateRSVPs &&  <RSVPs post={fullPost} />}
      {!post.debate && <ContentStyles
        contentType="post"
        className={classNames(classes.postContent, "instapaper_body")}
      >
        <PostBodyPrefix post={post} query={query}/>
        <AnalyticsContext pageSectionContext="postBody">
          <HoveredReactionContextProvider voteProps={voteProps}>
          <CommentOnSelectionContentWrapper onClickComment={onClickCommentOnSelection}>
          <div id="postContent">
            {htmlWithAnchors && <>
              <PostBody
                post={post}
                html={htmlWithAnchors}
                isOldVersion={isOldVersion}
                voteProps={voteProps}
              />
              {post.isEvent && isBookUI && <p className={classes.dateAtBottom}>Posted on: <PostsPageDate post={post} hasMajorRevision={false} /></p>
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

      {post.isEvent && post.group && isBookUI &&
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
      <DeferRender ssr={false}>
        <ForumEventPostPagePollSection postId={post._id} />
      </DeferRender>
  
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
              comments={results ?? []}
              loadMoreComments={loadMore}
              totalComments={totalCount as number}
              commentCount={commentCount}
              loadingMoreComments={loadingMore}
              loading={loading}
              post={fullPost}
              newForm={!post.question && (!post.shortform || post.userId===currentUser?._id)}
              highlightDate={highlightDate ?? undefined}
              setHighlightDate={setHighlightDate}
            />}
            {isAF && <AFUnreviewedCommentCount post={post}/>}
          </AnalyticsContext>
          {isFriendlyUI && Math.max(post.commentCount, results?.length ?? 0) < 1 &&
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
    <PostsPageContext.Provider value={{fullPost: fullPost ?? null, postPreload: postPreload ?? null}}>
    <RecombeeRecommendationsContextWrapper postId={post._id} recommId={recommId}>
    <Components.SideItemsContainer>
    <ImageProvider>
    <SideItemVisibilityContextProvider post={fullPost}>
    <div ref={readingProgressBarRef} className={classes.readingProgressBar}></div>
    <div className={classes.splashPageHeader}>
      {splashPageHeader}
    </div>
    {commentsTableOfContentsEnabled
      ? <Components.MultiToCLayout
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
          answerCount={answerCount}
          commentCount={commentCount}
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
  
    {isEAForum && showDigestAd && <DeferRender ssr={false}><StickyDigestAd /></DeferRender>}
    {hasPostRecommendations && fullPost && <AnalyticsInViewTracker eventProps={{inViewType: "postPageFooterRecommendations"}}>
      <PostBottomRecommendations
        post={post}
        hasTableOfContents={hasTableOfContents}
      />
    </AnalyticsInViewTracker>}
    </SideItemVisibilityContextProvider>
    </ImageProvider>
    </Components.SideItemsContainer>
    </RecombeeRecommendationsContextWrapper>
    </PostsPageContext.Provider>
  </AnalyticsContext>
}

export type PostParticipantInfo = Partial<Pick<PostsDetails, "userId"|"debate"|"hasCoauthorPermission" | "coauthorStatuses">>

export function isDialogueParticipant(userId: string, post: PostParticipantInfo) {
  if (post.userId === userId) return true 
  if (getConfirmedCoauthorIds(post).includes(userId)) return true
  return false
}
const PostsPageComponent = registerComponent('PostsPage', PostsPage, {
  styles, hocs: [withErrorBoundary],
  areEqual: "auto",
});
declare global {
  interface ComponentTypes {
    PostsPage: typeof PostsPageComponent
  }
}
