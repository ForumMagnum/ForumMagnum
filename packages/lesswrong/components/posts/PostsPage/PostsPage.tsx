import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../../lib/routeUtil';
import { getConfirmedCoauthorIds, postCoauthorIsPending, postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers'
import { useCurrentUser } from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import { useRecordPostView } from '../../hooks/useRecordPostView';
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import {forumTitleSetting, isAF, isEAForum, isLWorAF} from '../../../lib/instanceSettings';
import { cloudinaryCloudNameSetting, recombeeEnabledSetting, vertexEnabledSetting } from '../../../lib/publicSettings';
import classNames from 'classnames';
import { hasPostRecommendations, hasSideComments, commentsTableOfContentsEnabled, hasDigests } from '../../../lib/betas';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { welcomeBoxes } from './WelcomeBox';
import { useABTest } from '../../../lib/abTestImpl';
import { welcomeBoxABTest } from '../../../lib/abTests';
import { useDialog } from '../../common/withDialog';
import { UseMultiResult, useMulti } from '../../../lib/crud/withMulti';
import { SideCommentMode, SideCommentVisibilityContextType, SideCommentVisibilityContext } from '../../dropdowns/posts/SetSideCommentVisibility';
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
import { unflattenComments } from '../../../lib/utils/unflatten';
import { useNavigate } from '../../../lib/reactRouterWrapper';
import { postHasAudioPlayer } from './PostsAudioPlayerWrapper';
import { ImageProvider } from './ImageContext';
import { getMarketInfo, highlightMarket } from '../../../lib/annualReviewMarkets';
import isEqual from 'lodash/isEqual';
import { usePostReadProgress } from '../usePostReadProgress';
import { useDynamicTableOfContents } from '../../hooks/useDynamicTableOfContents';
import { RecombeeRecommendationsContextWrapper } from '../../recommendations/RecombeeRecommendationsContextWrapper';
import { getBrowserLocalStorage } from '../../editor/localStorageHandlers';
import ForumNoSSR from '../../common/ForumNoSSR';

export const MAX_COLUMN_WIDTH = 720
export const CENTRAL_COLUMN_WIDTH = 682

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

/**
 * Build structured data for a post to help with SEO.
 */
const getStructuredData = ({
  post,
  description,
}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision;
  description: string | null;
}) => {
  const hasUser = !!post.user;
  const hasCoauthors = !!post.coauthors && post.coauthors.length > 0;

  return {
    "@context": "http://schema.org",
    "@type": "DiscussionForumPosting",
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
export const styles = (theme: ThemeType): JssStyles => ({
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
    maxWidth: CENTRAL_COLUMN_WIDTH,
    marginLeft: 'auto',
    marginRight: 'auto',
    [theme.breakpoints.down('sm')]: {
      // This can only be used when display: "block" is applied, otherwise the 100% confuses the
      // grid layout into adding loads of left margin
      maxWidth: `min(100%, ${CENTRAL_COLUMN_WIDTH}px)`,
    }
  },
  postBody: {
    width: "max-content",
  },
  postContent: { //Used by a Cypress test
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
    [theme.breakpoints.down('md')]: {
      display: 'none'
    }
  },
  subscribeToDialogue: {
    marginBottom: 40,
    marginTop: 40,
    border: theme.palette.border.commentBorder,
    borderRadius: 5,
    display: "flex",
    justifyContent: "center",
  },
  secondSplashPageHeader: {
    ...theme.typography.postStyle,
    fontSize: '46px',
    lineHeight: 1,
    textWrap: 'balance',
    fontWeight: '600'
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
  classes: ClassesType,
} & (
  { fullPost: PostsWithNavigation|PostsWithNavigationAndRevision, postPreload: undefined }
  | { fullPost: undefined, postPreload: PostsListWithVotes }
)) => {
  const post = fullPost ?? postPreload;
  const location = useSubscribedLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { recordPostView } = useRecordPostView(post);
  const [showDigestAd, setShowDigestAd] = useState(false)
  const [highlightDate,setHighlightDate] = useState<Date|undefined|null>(post?.lastVisitedAt && new Date(post.lastVisitedAt));

  const { captureEvent } = useTracking();
  const [cookies, setCookie] = useCookiesWithConsent([SHOW_PODCAST_PLAYER_COOKIE]);
  const { query, params } = location;
  const [recommId, setRecommId] = useState<string | undefined>();
  const [attributionId, setAttributionId] = useState<string | undefined>();

  const showEmbeddedPlayerCookie = cookies[SHOW_PODCAST_PLAYER_COOKIE] === "true";

  // Show the podcast player if the user opened it on another post, hide it if they closed it (and by default)
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(showEmbeddedPlayerCookie);

  const toggleEmbeddedPlayer = fullPost && postHasAudioPlayer(fullPost) ? () => {
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

  const welcomeBoxABTestGroup = useABTest(welcomeBoxABTest);

  const disableProgressBar = (isBookUI || isServer || post.isEvent || post.question || post.debate || post.shortform || post.readTimeMinutes < 3);

  const { readingProgressBarRef } = usePostReadProgress({
    updateProgressBar: (element, scrollPercent) => element.style.setProperty("--scrollAmount", `${scrollPercent}%`),
    disabled: disableProgressBar
  });
  
  // postReadCount is currently only used by StickyDigestAd, to only show the ad after the client has visited multiple posts.
  const ls = getBrowserLocalStorage()
  useEffect(() => {
    if (ls && hasDigests) {
      const postReadCount = ls.getItem('postReadCount') ?? 0
      ls.setItem('postReadCount', parseInt(postReadCount) + 1)
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
        noClickawayCancel: true,
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
  const { results: debateResponses, refetch: refetchDebateResponses } = useMulti({
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

  const { HeadTags, CitationTags, PostsPagePostHeader, PostsPagePostFooter, PostBodyPrefix,
    PostCoauthorRequest, CommentPermalink, ToCColumn, WelcomeBox, TableOfContents, RSVPs,
    CloudinaryImage2, ContentStyles, PostBody, CommentOnSelectionContentWrapper,
    PermanentRedirect, DebateBody, PostsPageRecommendationsList, PostSideRecommendations,
    PostBottomRecommendations, NotifyMeDropdownItem, Row, AnalyticsInViewTracker,
    PostsPageQuestionContent, AFUnreviewedCommentCount, CommentsListSection, CommentsTableOfContents,
    StickyDigestAd, PostsPageSplashHeader, PostsAudioPlayerWrapper, AttributionInViewTracker
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

    if (!currentUser || (!recombeeEnabledSetting.get() && !vertexEnabledSetting.get())) return;
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
  
  const isOldVersion = query.revision && post.contents;
  
  const defaultSideCommentVisibility = hasSideComments
    ? (fullPost?.sideCommentVisibility ?? "highKarma")
    : "hidden";
  const [sideCommentMode,setSideCommentMode] = useState<SideCommentMode>(defaultSideCommentVisibility as SideCommentMode);
  const sideCommentModeContext: SideCommentVisibilityContextType = useMemo(
    () => ({ sideCommentMode, setSideCommentMode }),
    [sideCommentMode, setSideCommentMode]
  );
  
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

  const commentId = query.commentId || params.commentId

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

  const isDebateResponseLink = commentId && debateResponseIds.has(commentId);
  
  useEffect(() => {
    if (isDebateResponseLink) {
      navigate({ ...location.location, hash: `#debate-comment-${commentId}` }, {replace: true});
    }
    // No exhaustive deps to avoid any infinite loops with links to comments
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebateResponseLink, commentId]);

  const onClickCommentOnSelection = useCallback((html: string) => {
    openDialog({
      componentName:"ReplyCommentDialog",
      componentProps: {
        post, initialHtml: html
      },
      noClickawayCancel: true,
    })
  }, [openDialog, post]);

  const isCrosspostedQuestion = post.question &&
    post.fmCrosspost?.isCrosspost &&
    !post.fmCrosspost?.hostedHere;

  // Hide the table of contents on questions that are foreign crossposts
  // as we read ToC data from the foreign site and it includes answers
  // which don't exists locally. TODO: Remove this gating when we finally
  // rewrite crossposting.
  const hasTableOfContents = !!sectionData && !isCrosspostedQuestion;
  const tableOfContents = hasTableOfContents
    ? <TableOfContents sectionData={sectionData} title={post.title} postedAt={post.postedAt} fixedPositionToc={isLWorAF} />
    : null;

  const noIndex = fullPost?.noIndex || post.rejected;

  const marketInfo = getMarketInfo(post)

  const header = <>
    {fullPost && !commentId && <>
      <HeadTags
        ogUrl={ogUrl} canonicalUrl={canonicalUrl} image={socialPreviewImageUrl}
        title={post.title}
        description={description}
        noIndex={noIndex}
        structuredData={getStructuredData({post: fullPost, description})}
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
          {fullPost && commentId && !isDebateResponseLink && <CommentPermalink documentId={commentId} post={fullPost} />}
          {post.eventImageId && <div className={classNames(classes.headerImageContainer, {[classes.headerImageContainerWithComment]: commentId})}>
            <CloudinaryImage2
              publicId={post.eventImageId}
              imgProps={{ar: '191:100', w: '682', q: '100'}}
              className={classes.headerImage}
            />
          </div>}
          <PostCoauthorRequest post={post} currentUser={currentUser} />
          {!showSplashPageHeader && <PostsPagePostHeader
            post={post}
            answers={answers ?? []}
            showEmbeddedPlayer={showEmbeddedPlayer}
            toggleEmbeddedPlayer={toggleEmbeddedPlayer}
            dialogueResponses={debateResponses} 
            annualReviewMarketInfo={marketInfo}/>}
        </div>
      </div>
    </AnalyticsContext>
  </>;

  const maybeWelcomeBoxProps = forumSelect(welcomeBoxes);
  const welcomeBoxProps = welcomeBoxABTestGroup === "welcomeBox" && !currentUser && maybeWelcomeBoxProps;
  const welcomeBox = welcomeBoxProps
    ? <div className={classes.welcomeBox}>
        <WelcomeBox {...welcomeBoxProps} />
      </div>
    : null;

  const rightColumnChildren = (welcomeBox || (showRecommendations && recommendationsPosition === "right")) && <>
    {welcomeBox}
    {showRecommendations && recommendationsPosition === "right" && fullPost && <PostSideRecommendations post={fullPost} />}
  </>;

  // check for deep equality between terms and eagerPostComments.terms
  const useEagerResults = eagerPostComments && isEqual(commentTerms, eagerPostComments?.terms);

  const lazyResults = useMulti({
    terms: {...commentTerms, postId: post._id},
    skip: useEagerResults,
    ...postsCommentsThreadMultiOptions,
  });


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
    <div id="postBody" className={classNames(classes.centralColumn, classes.postBody)}>
      {showSplashPageHeader && !commentId && !isDebateResponseLink && <h1 className={classes.secondSplashPageHeader}>
        {post.title}
      </h1>}
      {/* Body */}
      {fullPost && <PostsAudioPlayerWrapper showEmbeddedPlayer={showEmbeddedPlayer} post={fullPost}/>}
      {fullPost && post.isEvent && fullPost.activateRSVPs &&  <RSVPs post={fullPost} />}
      {!post.debate && <ContentStyles contentType="post" className={classNames(classes.postContent, "instapaper_body")}>
        <PostBodyPrefix post={post} query={query}/>
        <AnalyticsContext pageSectionContext="postBody">
          <CommentOnSelectionContentWrapper onClickComment={onClickCommentOnSelection}>
            {htmlWithAnchors &&
              <PostBody
                post={post}
                html={htmlWithAnchors}
                sideCommentMode={isOldVersion ? "hidden" : sideCommentMode}
              />
            }
          </CommentOnSelectionContentWrapper>
        </AnalyticsContext>
      </ContentStyles>}

      {showSubscribeToDialogueButton && <Row justifyContent="center">
        <div className={classes.subscribeToDialogue}>
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

      {post.debate && debateResponses && debateResponseReplies && fullPost &&
        <DebateBody
          debateResponses={getDebateResponseBlocks(debateResponses, debateResponseReplies)}
          post={fullPost}
        />}

    </div>
  const betweenPostAndCommentsSection =
    <div className={classNames(classes.centralColumn, classes.betweenPostAndComments)}>
      <PostsPagePostFooter post={post} sequenceId={sequenceId} />
  
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

  const { loading, results, loadMore, loadingMore, totalCount } = useEagerResults ? eagerPostComments.queryResponse : lazyResults;

  const commentCount = results?.length ?? 0;
  const commentTree = unflattenComments(results ?? []);
  const answersTree = unflattenComments(answersAndReplies ?? []);
  
  const commentsSection =
    <AnalyticsInViewTracker eventProps={{inViewType: "commentsSection"}}>
      <AttributionInViewTracker eventProps={{ postId: post._id, portion: 1, recommId, vertexAttributionId: attributionId }}>
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
    <PostsPageContext.Provider value={fullPost ?? null}>
    <RecombeeRecommendationsContextWrapper postId={post._id} recommId={recommId}>
    <ImageProvider>
    <SideCommentVisibilityContext.Provider value={sideCommentModeContext}>
    <div ref={readingProgressBarRef} className={classes.readingProgressBar}></div>
    {fullPost && showSplashPageHeader && !commentId && !isDebateResponseLink && <PostsPageSplashHeader
      // We perform this seemingly redundant spread because `showSplashPageHeader` checks that `post.reviewWinner` exists,
      // and Typescript is only smart enough to narrow the type for you if you access the field directly like this
      post={{...fullPost, reviewWinner: fullPost.reviewWinner!}}
      showEmbeddedPlayer={showEmbeddedPlayer}
      toggleEmbeddedPlayer={toggleEmbeddedPlayer}
    />}
    {commentsTableOfContentsEnabled
      ? <Components.MultiToCLayout
          segments={[
            {centralColumn: header},
            {
              toc: tableOfContents,
              centralColumn: postBodySection,
              rightColumn: rightColumnChildren
            },
            {centralColumn: betweenPostAndCommentsSection},
            {
              toc: commentsToC,
              centralColumn: commentsSection,
              isCommentToC: true
            },
          ]}
          tocRowMap={[1, 1, 1, 3]}
          showSplashPageHeader={showSplashPageHeader}
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
  
    {isEAForum && showDigestAd && <ForumNoSSR><StickyDigestAd /></ForumNoSSR>}
    {hasPostRecommendations && fullPost && <AnalyticsInViewTracker eventProps={{inViewType: "postPageFooterRecommendations"}}>
      <PostBottomRecommendations
        post={post}
        hasTableOfContents={hasTableOfContents}
      />
    </AnalyticsInViewTracker>}
    </SideCommentVisibilityContext.Provider>
    </ImageProvider>
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
