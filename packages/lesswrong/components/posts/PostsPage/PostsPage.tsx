import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useNavigation, useSubscribedLocation } from '../../../lib/routeUtil';
import { getConfirmedCoauthorIds, isPostAllowedType3Audio, postCoauthorIsPending, postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { commentGetDefaultView } from '../../../lib/collections/comments/helpers'
import { useCurrentUser } from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import { useRecordPostView } from '../../hooks/useRecordPostView';
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import {forumTitleSetting, forumTypeSetting, isEAForum} from '../../../lib/instanceSettings';
import { cloudinaryCloudNameSetting } from '../../../lib/publicSettings';
import classNames from 'classnames';
import { userHasSideComments } from '../../../lib/betas';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { welcomeBoxes } from './WelcomeBox';
import { useABTest } from '../../../lib/abTestImpl';
import { welcomeBoxABTest } from '../../../lib/abTests';
import { useDialog } from '../../common/withDialog';
import { UseMultiResult, useMulti } from '../../../lib/crud/withMulti';
import { SideCommentMode, SideCommentVisibilityContextType, SideCommentVisibilityContext } from '../../dropdowns/posts/SetSideCommentVisibility';
import { PostsPageContext } from './PostsPageContext';
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import Helmet from 'react-helmet';
import { SHOW_PODCAST_PLAYER_COOKIE } from '../../../lib/cookies/cookies';
import { isServer } from '../../../lib/executionEnvironment';
import { isValidCommentView } from '../../../lib/commentViewOptions';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { tagGetUrl } from '../../../lib/collections/tags/helpers';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs';
import { useOnNotificationsChanged } from '../../hooks/useUnreadNotifications';
import { CommentTreeNode } from '../../../lib/utils/unflatten';

export const MAX_COLUMN_WIDTH = 720
export const CENTRAL_COLUMN_WIDTH = 682

export const SHARE_POPUP_QUERY_PARAM = 'sharePopup';

const MAX_ANSWERS_QUERIED = 100

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
  centralColumn: {
    maxWidth: CENTRAL_COLUMN_WIDTH,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: theme.spacing.unit *3
  },
  postContent: { //Used by a Cypress test
    marginBottom: isEAForum ? 40 : undefined
  },
  recommendations: {
    maxWidth: MAX_COLUMN_WIDTH,
    margin: "0 auto 40px",
  },
  commentsSection: {
    minHeight: isEAForum ? undefined : 'calc(70vh - 100px)',
    [theme.breakpoints.down('sm')]: {
      paddingRight: 0,
      marginLeft: 0
    },
    // TODO: This is to prevent the Table of Contents from overlapping with the comments section. Could probably fine-tune the breakpoints and spacing to avoid needing this.
    background: theme.palette.background.pageActiveAreaBackground,
    position: "relative",
    paddingTop: isEAForum ? 16 : undefined
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

export const AllCommentsContext = React.createContext<{comments: CommentTreeNode<CommentsList>[]|null}>({comments: null});

const PostsPage = ({post, eagerPostComments, refetch, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  eagerPostComments?: EagerPostComments,
  refetch: ()=>void,
  classes: ClassesType,
}) => {
  const location = useSubscribedLocation();
  const { history } = useNavigation();
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { recordPostView } = useRecordPostView(post);
  const allCommentsContextValue = useRef({comments: null});

  const { captureEvent } = useTracking();
  const [cookies, setCookie] = useCookiesWithConsent([SHOW_PODCAST_PLAYER_COOKIE]);

  const showEmbeddedPlayerCookie = cookies[SHOW_PODCAST_PLAYER_COOKIE] === "true";

  // Show the podcast player if the user opened it on another post, hide it if they closed it (and by default)
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(showEmbeddedPlayerCookie);
  const allowTypeIIIPlayer = isPostAllowedType3Audio(post);

  const toggleEmbeddedPlayer = post.podcastEpisode || allowTypeIIIPlayer ? () => {
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

  // On the EA Forum, show a reading progress bar to indicate how far in the post you are.
  // Your progress is hard to tell via the scroll bar because it includes the comments section.
  const postBodyRef = useRef<HTMLDivElement|null>(null)
  const readingProgressBarRef = useRef<HTMLDivElement|null>(null)
  useEffect(() => {
    if (!isEAForum || isServer || post.isEvent || post.question || post.debate || post.shortform || post.readTimeMinutes < 3) return

    updateReadingProgressBar()
    window.addEventListener('scroll', updateReadingProgressBar)

    return () => {
      window.removeEventListener('scroll', updateReadingProgressBar)
    };
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const updateReadingProgressBar = () => {
    if (!postBodyRef.current || !readingProgressBarRef.current) return

    // position of post body bottom relative to the top of the viewport
    const postBodyBottomPos = postBodyRef.current.getBoundingClientRect().bottom - window.innerHeight
    // total distance from top of page to post body bottom
    const totalHeight = window.scrollY + postBodyBottomPos
    const scrollPercent = (1 - (postBodyBottomPos / totalHeight)) * 100

    readingProgressBarRef.current.style.setProperty("--scrollAmount", `${scrollPercent}%`)
  }

  const getSequenceId = () => {
    const { params } = location;
    return params.sequenceId || post?.canonicalSequenceId;
  }

  const { query, params } = location;

  useEffect(() => {
    if (!query[SHARE_POPUP_QUERY_PARAM]) return;

    openDialog({
      componentName: "SharePostPopup",
      componentProps: {
        post,
      },
      noClickawayCancel: true,
      closeOnNavigate: true,
    });

    // Remove "sharePopup" from query once the popup is open, to prevent accidentally
    // sharing links with the popup open
    const currentQuery = isEmpty(query) ? {} : query
    const newQuery = {...currentQuery, [SHARE_POPUP_QUERY_PARAM]: undefined}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  }, [history, location.location, openDialog, post, query]);

  const sortBy: CommentSortingMode = (query.answersSorting as CommentSortingMode) || "top";
  const { results: answers } = useMulti({
    terms: {
      view: "questionAnswers",
      postId: post._id,
      limit: MAX_ANSWERS_QUERIED,
      sortBy
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    skip: !post.question,
  });

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
  
  useOnNotificationsChanged(currentUser, (message) => {
    if (message.eventType === 'notificationCheck') {
      if (currentUser && isDialogueParticipant(currentUser._id, post)) {
        refetchDebateResponses();
      }
    }
  });

  const defaultView = commentGetDefaultView(post, currentUser)
  // If the provided view is among the valid ones, spread whole query into terms, otherwise just do the default query
  const commentOpts = {includeAdminViews: currentUser?.isAdmin};
  const commentTerms: CommentsViewTerms = isValidCommentView(query.view, commentOpts)
    ? {...(query as CommentsViewTerms), limit:1000}
    : {view: defaultView, limit: 1000}

  const { results: nonDebateComments } = useMulti({
    terms: {...commentTerms, postId: post._id},
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    skip: !post.debate
  });

  const { HeadTags, CitationTags, PostsPagePostHeader, PostsPagePostFooter, PostBodyPrefix,
    PostsCommentsThread, PostsPageQuestionContent, PostCoauthorRequest,
    CommentPermalink, AnalyticsInViewTracker, ToCColumn, WelcomeBox, TableOfContents, RSVPs,
    PostsPodcastPlayer, AFUnreviewedCommentCount, CloudinaryImage2, ContentStyles,
    PostBody, CommentOnSelectionContentWrapper, PermanentRedirect, DebateBody,
    PostsPageRecommendationsList, PostSideRecommendations, T3AudioPlayer,
    PostBottomRecommendations,
  } = Components

  useEffect(() => {
    recordPostView({
      post: post,
      extraEventProperties: {
        sequenceId: getSequenceId()
      }
    });
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post._id]);
  
  const isOldVersion = query.revision && post.contents;
  
  const defaultSideCommentVisibility = userHasSideComments(currentUser)
    ? (post.sideCommentVisibility ?? "highKarma")
    : "hidden";
  const [sideCommentMode,setSideCommentMode] = useState<SideCommentMode>(defaultSideCommentVisibility as SideCommentMode);
  const sideCommentModeContext: SideCommentVisibilityContextType = useMemo(
    () => ({ sideCommentMode, setSideCommentMode }),
    [sideCommentMode, setSideCommentMode]
  );
  
  const sequenceId = getSequenceId();
  const sectionData = (post as PostsWithNavigationAndRevision).tableOfContentsRevision || (post as PostsWithNavigation).tableOfContents;
  const htmlWithAnchors = sectionData?.html || post.contents?.html;

  const showRecommendations = isEAForum &&
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

  const description = getPostDescription(post)
  const ogUrl = postGetPageUrl(post, true) // open graph
  const canonicalUrl = post.canonicalSource || ogUrl
  // For imageless posts this will be an empty string
  let socialPreviewImageUrl = post.socialPreviewData?.imageUrl ?? "";
  if (post.isEvent && post.eventImageId) {
    socialPreviewImageUrl = `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_fill,g_auto,ar_191:100/${post.eventImageId}`
  }

  const debateResponseIds = new Set((debateResponses ?? []).map(response => response._id));
  const debateResponseReplies = nonDebateComments?.filter(comment => debateResponseIds.has(comment.topLevelCommentId));

  const isDebateResponseLink = commentId && debateResponseIds.has(commentId);
  
  useEffect(() => {
    if (isDebateResponseLink) {
      history.replace({ ...location.location, hash: `#debate-comment-${commentId}` });
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
  const tableOfContents = sectionData && !isCrosspostedQuestion
    ? <TableOfContents sectionData={sectionData} title={post.title} />
    : null;

  const noIndex = post.noIndex || post.rejected;

  const header = <>
    {!commentId && <>
      <HeadTags
        ogUrl={ogUrl} canonicalUrl={canonicalUrl} image={socialPreviewImageUrl}
        title={post.title} description={description} noIndex={noIndex}
        structuredData={getStructuredData({post, description})}
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
      <div className={classes.title}>
        <div className={classes.centralColumn}>
          {commentId && !isDebateResponseLink && <CommentPermalink documentId={commentId} post={post} />}
          {post.eventImageId && <div className={classNames(classes.headerImageContainer, {[classes.headerImageContainerWithComment]: commentId})}>
            <CloudinaryImage2
              publicId={post.eventImageId}
              imgProps={{ar: '191:100', w: '682', q: '100'}}
              className={classes.headerImage}
            />
          </div>}
          <PostCoauthorRequest post={post} currentUser={currentUser} />
          <PostsPagePostHeader
            post={post}
            answers={answers ?? []}
            showEmbeddedPlayer={showEmbeddedPlayer}
            toggleEmbeddedPlayer={toggleEmbeddedPlayer}
            dialogueResponses={debateResponses} />
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

  const rightColumnChildren = <>
    {welcomeBox}
    {showRecommendations && recommendationsPosition === "right" && <PostSideRecommendations post={post} />}
  </>;

  // If this is a non-AF post being viewed on AF, redirect to LW.
  const isAF = (forumTypeSetting.get() === 'AlignmentForum');
  if (isAF && !post.af) {
    const lwURL = "https://www.lesswrong.com" + location.url;
    return <PermanentRedirect url={lwURL}/>
  }

  return (<AnalyticsContext pageContext="postsPage" postId={post._id}>
    <PostsPageContext.Provider value={post}>
    <AllCommentsContext.Provider value={allCommentsContextValue.current}>
    <SideCommentVisibilityContext.Provider value={sideCommentModeContext}>
    <div ref={readingProgressBarRef} className={classes.readingProgressBar}></div>
    <ToCColumn
      tableOfContents={tableOfContents}
      header={header}
      rightColumnChildren={rightColumnChildren}
    >
      <div ref={postBodyRef} className={classes.centralColumn}>
        {/* Body */}
        {/* The embedded player for posts with a manually uploaded podcast episode */}
        {post.podcastEpisode && <div className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}>
          <PostsPodcastPlayer podcastEpisode={post.podcastEpisode} postId={post._id} />
        </div>}
        {allowTypeIIIPlayer && <T3AudioPlayer showEmbeddedPlayer={showEmbeddedPlayer} postId={post._id}/>}
        { post.isEvent && post.activateRSVPs &&  <RSVPs post={post} /> }
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

        {post.debate && debateResponses && debateResponseReplies &&
          <DebateBody
            debateResponses={getDebateResponseBlocks(debateResponses, debateResponseReplies)}
            post={post}
          />}

        <PostsPagePostFooter post={post} sequenceId={sequenceId} />
      </div>

      {showRecommendations && recommendationsPosition === "underPost" &&
        <AnalyticsContext pageSectionContext="postBottomRecommendations">
          <div className={classes.recommendations}>
            <PostsPageRecommendationsList
              strategy="tagWeightedCollabFilter"
            />
          </div>
        </AnalyticsContext>
      }

      <AnalyticsInViewTracker eventProps={{inViewType: "commentsSection"}} >
        {/* Answers Section */}
        {post.question && <div className={classes.centralColumn}>
          <div id="answers"/>
          <AnalyticsContext pageSectionContext="answersSection">
            <PostsPageQuestionContent post={post} answers={answers ?? []} refetch={refetch}/>
          </AnalyticsContext>
        </div>}
        {/* Comments Section */}
        <div className={classes.commentsSection}>
          <AnalyticsContext pageSectionContext="commentsSection">
            <PostsCommentsThread
              terms={{...commentTerms, postId: post._id}}
              eagerPostComments={eagerPostComments}
              post={post}
              newForm={!post.question && (!post.shortform || post.userId===currentUser?._id)}
            />
            {isAF && <AFUnreviewedCommentCount post={post}/>}
          </AnalyticsContext>
          {isEAForum && post.commentCount < 1 &&
            <div className={classes.noCommentsPlaceholder}>
              <div>No comments on this post yet.</div>
              <div>Be the first to respond.</div>
            </div>
          }
        </div>
      </AnalyticsInViewTracker>
    </ToCColumn>
    {isEAForum && <PostBottomRecommendations post={post} />}
    </SideCommentVisibilityContext.Provider>
    </AllCommentsContext.Provider>
    </PostsPageContext.Provider>
  </AnalyticsContext>);
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
