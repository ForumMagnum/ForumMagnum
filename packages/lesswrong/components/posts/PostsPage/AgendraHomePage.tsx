import { SidebarsContext } from '@/components/common/SidebarsWrapper';
import { useDialog } from '@/components/common/withDialog';
import { useCurrentUser } from '@/components/common/withUser';
import { SideCommentMode, SideCommentVisibilityContext, SideCommentVisibilityContextType } from '@/components/dropdowns/posts/SetSideCommentVisibility';
import { getBrowserLocalStorage } from '@/components/editor/localStorageHandlers';
import { useCookiesWithConsent } from '@/components/hooks/useCookiesWithConsent';
import { useDynamicTableOfContents } from '@/components/hooks/useDynamicTableOfContents';
import { useObserver } from '@/components/hooks/useObserver';
import { useRecordPostView } from '@/components/hooks/useRecordPostView';
import { RecombeeRecommendationsContextWrapper } from '@/components/recommendations/RecombeeRecommendationsContextWrapper';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { getMarketInfo, highlightMarket } from '@/lib/annualReviewMarkets';
import { commentsTableOfContentsEnabled, hasDigests, hasPostRecommendations, hasSideComments } from '@/lib/betas';
import { SHOW_PODCAST_PLAYER_COOKIE } from '@/lib/cookies/cookies';
import { isServer } from '@/lib/executionEnvironment';
import { isEAForum, isLWorAF } from '@/lib/instanceSettings';
import { cloudinaryCloudNameSetting } from '@/lib/publicSettings';
import { useNavigate, useSubscribedLocation } from '@/lib/routeUtil';
import { Components, registerComponent } from '@/lib/vulcan-lib';
import { isBookUI, isFriendlyUI } from '@/themes/forumTheme';
import { hideScrollBars } from '@/themes/styleUtils';
import classNames from 'classnames';
import qs from 'qs';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isEmpty } from 'underscore';
import { usePostReadProgress } from '../usePostReadProgress';
import { ImageProvider, useImageContext } from './ImageContext';
import { CENTRAL_COLUMN_WIDTH, MAX_COLUMN_WIDTH, SHARE_POPUP_QUERY_PARAM } from './PostsPage';
import { PostsPageContext } from './PostsPageContext';

const headerStyles = (theme: ThemeType) => ({
  root: {
    zIndex: theme.zIndexes.postsPageSplashHeader,
    height: '100vh',
    marginTop: 'calc(-50px - 64px)',
    paddingTop: 64,
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    position: 'relative',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
    ...theme.typography.postStyle,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      pointerEvents: 'none'
    },
    transition: 'opacity 0.5s ease-in-out',
    opacity: 1,
    [theme.breakpoints.down('sm')]: {
      marginTop: '-64px',
      // Cancels out padding for mobile views
      marginLeft: -8,
      marginRight: -8
    },
  },
  backgroundImageWrapper: {
    zIndex: -1, // theme.zIndexes.postsPageSplashHeader,
    position: 'absolute',
    paddingTop: 0,
    marginTop: 'calc(-64px)', // to cancel out the padding in the root class
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
    ...theme.typography.postStyle,
    width: '100%',
    height: '100%',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      background: `linear-gradient(0deg, ${theme.palette.panelBackground.default} 3%, transparent 48%)`,
      pointerEvents: 'none'
    },
    transition: 'opacity 0.5s ease-in-out',
    opacity: 1,
    // The images naturally have a landscape aspect ratio, so when viewing it in a portrait orientation we set height to 100% to scale it appropriately
    '@media (orientation:portrait)': {
      height: '100%',
    },
    // Also, the images have a width of 2752px, so if the screen is wider(!!!) than that, make sure it covers everything
    '@media (min-width: 2752px)': {
      width: '100%',
    },
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: -2,
    objectFit: 'cover',
    objectPosition: 'center top',
  },
  backgroundImageCropPreview: {
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: -2,
    objectFit: 'cover',
    objectPosition: 'center top',
  },
  cropPreviewEnabledForeground: {
    zIndex: -1,
  },
  cropPreviewEnabledBackground: {
    zIndex: 2,
  },
  fadeIn: {

  },
  fadeOut: {
    opacity: 0, 
    
    '& $backgroundImageWrapper': {
      opacity: 0,
      transition: 'opacity 0.5s',
      transitionTimingFunction: 'ease-in',
    },
    '& $centralSection, & $reviewContainer': {
      transform: 'translateY(-15vh)'
    }
  },
  centralSection: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    color: theme.palette.text.alwaysWhite,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '7vh',
    transition: 'transform .75s ease-in-out',
    [theme.breakpoints.down('xs')]: {
      paddingBottom: '1vh'
    }
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    width: 'fit-content',
    maxWidth: '350px',
    textAlign: 'left',
    marginLeft: 6,
    padding: 8,
    whiteSpace: 'nowrap',
    ...theme.typography.commentStyle,
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'column'
  },
  rightSectionTopRow: {
    display: 'flex',
    alignItems: 'flex-start',
    height: 'min-content',
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 4,
    opacity: 0.76
  },
  rightSectionBottomRow: {
    display: 'flex',
    flexDirection: 'row-reverse',
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 8,
  },
  rightSectionBelowBottomRow: {
    display: 'flex',
    flexDirection: 'row-reverse',
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 8,
    zIndex: 2,
  },
  changeImageBox: {
    ...theme.typography.commentStyle,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: theme.palette.panelBackground.reviewGold,
    color: theme.palette.text.alwaysWhite,
    cursor: 'pointer',
    marginBottom: 8,
    opacity: 0.3,
    '&:hover': {
      opacity: 1
    }
  },
  audioPlayerContainer: {
    [theme.breakpoints.up('sm')]: {
      width: '480px',
    }
  },
  audioPlayer: {
    padding: 8,
    marginLeft: 6,
  },
  togglePodcastContainer: {
    marginTop: 6,
    background: theme.palette.grey[200],
    opacity: 0.76,
    color: theme.palette.primary.main,
    height: 26,
    width: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  audioIcon: {
    width: 24,
    height: 24,
    transform: 'translateY(2px)',
    padding: 2,
  },
  audioIconOn: {
    background: theme.palette.grey[400],
  },
  nonhumanAudio: {
    color: theme.palette.grey[500],
  },
  title: {
    color: theme.palette.text.reviewWinner.title,
    fontSize: '5.5rem',
    fontWeight: '600',
    margin: '0px',
    lineHeight: '1',
    maxWidth: '75vw',
    textWrap: 'balance',
    [theme.breakpoints.down('xs')]: {
      fontSize: '2.5rem',
      maxWidth: '90vw'
    },
  },
  titleSmaller: {
    fontSize: '3.8rem',
    [theme.breakpoints.down('xs')]: {
      fontSize: '2rem'
    }
  },
  postActionsButton: {
    backgroundColor: theme.palette.tag.coreTagBackground,
    borderRadius: 3,
    cursor: "pointer",
    border: theme.palette.tag.border,
    alignItems: "center",
    '& .PostActionsButton-icon': {
      opacity: 0.5
    },
    "&:hover": {
      backgroundColor: theme.palette.tag.coreTagBackgroundHover,
      borderColor: theme.palette.tag.coreTagBackgroundHover,
    },
  },
  reviewNavigation: {
    display: 'block',
    backgroundColor: theme.palette.panelBackground.reviewGold,
    padding: 6,
    borderRadius: 4,
    color: theme.palette.text.alwaysWhite,
    cursor: 'pointer',
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  reviewNavigationMobile: {
    backgroundColor: theme.palette.panelBackground.reviewGold,
    padding: 6, 
    borderRadius: 4,
    color: theme.palette.text.alwaysWhite,
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    }
  },
  authors: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: theme.palette.text.reviewWinner.author,
    transition: 'opacity .5s, transform .5s',
  },
  reviews: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexWrap: 'wrap-reverse',
    transition: 'opacity .5s, transform .5s',
    ...theme.typography.commentStyle,
  },
  reviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 'auto',
    position: 'relative',
    zIndex: 1,
    minHeight: 0,
    marginBottom: 16,
    padding: '0px 16px',
    transition: 'transform .75s ease-in-out',
    '&::before': {
      content: '""',
      position: 'absolute',
      height: '100%',
      width: '100%'
    },
  },
  review: {
    cursor: 'pointer',
    display: 'flex',
    padding: '4px',
    borderRadius: '4px',
    backgroundColor: theme.palette.panelBackground.reviewGold,
    gap: '7px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    color: theme.palette.text.alwaysWhite,
  },
  reviewScore: {
  },
  reviewAuthor: {

  },
  reviewPreviewContainer: {
    padding: '16px',
    minHeight: 0
  },
  reviewPreview: {
    ...theme.typography.commentStyle,
    transition: 'opacity 0.2s ease-in-out',
    backgroundColor: theme.palette.panelBackground.translucent2,
    border: `1px solid ${theme.palette.panelBackground.reviewGold}`,
    padding: '8px',
    width: '650px',
    maxWidth: '70vw',
    whiteSpace: 'normal',
    textAlign: 'left',
    borderRadius: '8px',
    marginLeft: 'auto',
    marginRight: 'auto',
    overflowY: 'scroll',
    ...hideScrollBars,
    maxHeight: '100%'
  },
  reviewPreviewAuthor: {
    fontWeight: '600'
  },
  reviewPreviewBody: {
  },
  '@global': {
    '.intercom-lightweight-app': {
      transition: 'opacity 1s ease-in 1s'
    },
    'body:has( .PostsPageSplashHeader-fadeIn ) .intercom-lightweight-app': {
      opacity: 0,
      transition: 'opacity 1s ease-in 0s'
    },
  },
});

const styles = (theme: ThemeType) => ({
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
});

const AgendraSplashHeaderInner = ({post, classes}: {
  post: (PostsWithNavigation|PostsWithNavigationAndRevision) & { reviewWinner: ReviewWinnerAll },
  classes: ClassesType<typeof headerStyles>,
}) => {
  const { FooterTagList, UsersName } = Components;
  
  const { selectedImageInfo } = useImageContext();
  const { setToCVisible } = useContext(SidebarsContext)!;
  const currentUser = useCurrentUser();
    
  const [visible, setVisible] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState(post.reviewWinner.reviewWinnerArt?.splashArtImageUrl);
  const [cropPreviewEnabled, setCropPreviewEnabled] = useState(false);
  const [imageFlipped, setImageFlipped] = useState(false);  
  
  const imgRef = useRef<HTMLImageElement>(null);
  const backgroundImgWrapperRef = useRef<HTMLDivElement>(null);
  const backgroundImgCropPreviewRef = useRef<HTMLDivElement>(null);

  const transitionHeader = (headerVisibile: boolean) => {
    setToCVisible(!headerVisibile);
    setVisible(headerVisibile);
  };

  const observerRef = useObserver<HTMLDivElement>({
    onEnter: () => transitionHeader(true),
    onExit: () => transitionHeader(false),
    threshold: 0.85
  });

  useEffect(() => {
    const postLastSavedImage = post.reviewWinner.reviewWinnerArt?.splashArtImageUrl;
    const newBackgroundImage = selectedImageInfo?.splashArtImageUrl || postLastSavedImage;

    if (newBackgroundImage) {
      setBackgroundImage(newBackgroundImage.replace('upload/', imageFlipped ? 'upload/a_hflip/' : 'upload/'));
    }

    // When we leave a review winner post page, we want to set this back to true, since it's a global rather than post-specific setting.
    // Without this, if a user scrolls down and then back up such that the ToC is hidden on a review winner post, and then navigates to another post, the ToC will be hidden.
    return () => setToCVisible(true);
  }, [post, selectedImageInfo, imageFlipped, setToCVisible]);

  const topLeftSection = (
    <div className={classes.leftSection}>
    </div>
  );

  const topRightSection = (
    <div className={classes.rightSection}>
      <AnalyticsContext pageSectionContext="tagHeader">
        <div className={classes.rightSectionTopRow}>
          {/* <FooterTagList post={post} hideScore useAltAddTagButton hideAddTag={false} appendElement={postActionsButton} align="right" /> */}
        </div>
      </AnalyticsContext>
      <div className={classes.rightSectionBottomRow}>
        {/* <PostsSplashPageHeaderVote post={post} votingSystem={votingSystem} /> */}
      </div>
    </div>
  );

  const centralSection = (
    <div className={classes.centralSection}>
      <h1 className={classNames(classes.title, { [classes.titleSmaller]: post.title.length > 80 })}>
        {post.title}
      </h1>
      <div className={classes.authors}>
        <span>
          <UsersName user={post.user} />
          {!!post.coauthors?.length ? ', ' : ''}
        </span>
        {post.coauthors?.map((coauthor, i) =>
          <span key={`coauthor${coauthor._id}`}>
            <UsersName user={coauthor} />
            {i < post.coauthors.length - 1 ? ', ' : ''}
          </span>
        )}
      </div>
    </div>
  );

  return <div className={classNames(classes.root, {[classes.fadeOut]: !visible, [classes.fadeIn]: visible})} ref={observerRef} >
    {
      /* 
       * We have two copies of the image to implement crop preview functionality using masking and z-indexes
       * The important bits are that when the crop element is enabled, it "dims" everything outside of the picker
       * Also, when the picker is moved over the title/author/etc, they don't show up in the preview, just the underlying image
       * This doesn't work with the Layout header, but we don't care that much /shrug
       */
    }
    <div ref={backgroundImgWrapperRef} className={classNames(classes.backgroundImageWrapper, { [classes.cropPreviewEnabledForeground]: cropPreviewEnabled })}>
      <img src={backgroundImage} className={classes.backgroundImage} alt="Background Image" />
    </div>
    {currentUser?.isAdmin && <div ref={backgroundImgCropPreviewRef} className={classNames(classes.backgroundImageWrapper, { [classes.cropPreviewEnabledBackground]: cropPreviewEnabled })}>
      <img ref={imgRef} src={backgroundImage} className={classes.backgroundImageCropPreview} alt="Background Image" />
    </div>}
    <div className={classes.top}>
      {topLeftSection}
      {topRightSection}
    </div>

    {centralSection}
  </div>
}

export const AgendraHomePage = ({fullPost, postPreload, classes}: {
  classes: ClassesType<typeof styles>,
} & (
  { fullPost: PostsWithNavigation|PostsWithNavigationAndRevision, postPreload: undefined }
  | { fullPost: undefined, postPreload: PostsListWithVotes }
)) => {
  const {
    PostsPagePostFooter, PostBodyPrefix, PostCoauthorRequest, ToCColumn, TableOfContents, RSVPs,
    CloudinaryImage2, ContentStyles, PostBody, PostsAudioPlayerWrapper, AgendraSplashHeader
  } = Components;

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
    answers: [],
  });
  const htmlWithAnchors = sectionData?.html || fullPost?.contents?.html || postPreload?.contents?.htmlHighlight || "";

  // For imageless posts this will be an empty string
  let socialPreviewImageUrl = post.socialPreviewData?.imageUrl ?? "";
  if (post.isEvent && post.eventImageId) {
    socialPreviewImageUrl = `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_fill,g_auto,ar_191:100/${post.eventImageId}`
  }

  // Hide the table of contents on questions that are foreign crossposts
  // as we read ToC data from the foreign site and it includes answers
  // which don't exists locally. TODO: Remove this gating when we finally
  // rewrite crossposting.
  const hasTableOfContents = !!sectionData;
  const tableOfContents = hasTableOfContents
    ? <TableOfContents sectionData={sectionData} title={post.title} postedAt={post.postedAt} fixedPositionToc={isLWorAF} />
    : null;

  const marketInfo = getMarketInfo(post)

  const header = <>
    {/* Header/Title */}
    <AnalyticsContext pageSectionContext="postHeader">
      <div className={classNames(classes.title, {[classes.titleWithMarket] : highlightMarket(marketInfo)})}>
        <div className={classes.centralColumn}>
          {post.eventImageId && <div className={classes.headerImageContainer}>
            <CloudinaryImage2
              publicId={post.eventImageId}
              imgProps={{ar: '191:100', w: '682', q: '100'}}
              className={classes.headerImage}
            />
          </div>}
          <PostCoauthorRequest post={post} currentUser={currentUser} />
        </div>
      </div>
    </AnalyticsContext>
  </>;
  
  const postBodySection =
    <div id="postBody" className={classNames(classes.centralColumn, classes.postBody)}>
      {showSplashPageHeader && <h1 className={classes.secondSplashPageHeader}>
        {post.title}
      </h1>}
      {/* Body */}
      {fullPost && <PostsAudioPlayerWrapper showEmbeddedPlayer={showEmbeddedPlayer} post={fullPost}/>}
      {fullPost && post.isEvent && fullPost.activateRSVPs &&  <RSVPs post={fullPost} />}
      {!post.debate && <ContentStyles contentType="post" className={classNames(classes.postContent, "instapaper_body")}>
        <PostBodyPrefix post={post} query={query}/>
        <AnalyticsContext pageSectionContext="postBody">
          {/* <CommentOnSelectionContentWrapper onClickComment={onClickCommentOnSelection}> */}
            {htmlWithAnchors &&
              <PostBody
                post={post}
                html={htmlWithAnchors}
                sideCommentMode={"hidden"}
              />
            }
          {/* </CommentOnSelectionContentWrapper> */}
        </AnalyticsContext>
      </ContentStyles>}
    </div>

  const betweenPostAndCommentsSection =
    <div className={classNames(classes.centralColumn, classes.betweenPostAndComments)}>
      <PostsPagePostFooter post={post} sequenceId={sequenceId} />
    </div>

  return <AnalyticsContext pageContext="postsPage" postId={post._id}>
    <PostsPageContext.Provider value={fullPost ?? null}>
    <RecombeeRecommendationsContextWrapper postId={post._id} recommId={recommId}>
    <ImageProvider>
    <SideCommentVisibilityContext.Provider value={sideCommentModeContext}>
    <div ref={readingProgressBarRef} className={classes.readingProgressBar}></div>
    {fullPost && showSplashPageHeader && <AgendraSplashHeader
      // We perform this seemingly redundant spread because `showSplashPageHeader` checks that `post.reviewWinner` exists,
      // and Typescript is only smart enough to narrow the type for you if you access the field directly like this
      post={{...fullPost, reviewWinner: fullPost.reviewWinner!}}
    />}
    {commentsTableOfContentsEnabled
      ? <Components.MultiToCLayout
          segments={[
            {centralColumn: header},
            {
              toc: tableOfContents,
              centralColumn: postBodySection,
            },
            {centralColumn: betweenPostAndCommentsSection}
          ]}
          tocRowMap={[1, 1, 1, 3]}
          showSplashPageHeader={showSplashPageHeader}
        />
      : <ToCColumn
          tableOfContents={tableOfContents}
          header={header}
        >
          {postBodySection}
          {betweenPostAndCommentsSection}
        </ToCColumn>
    }
    </SideCommentVisibilityContext.Provider>
    </ImageProvider>
    </RecombeeRecommendationsContextWrapper>
    </PostsPageContext.Provider>
  </AnalyticsContext>
}

const AgendraSplashHeaderComponent = registerComponent('AgendraSplashHeader', AgendraSplashHeaderInner, {styles: headerStyles});
const AgendraHomePageComponent = registerComponent('AgendraHomePage', AgendraHomePage, {styles});

declare global {
  interface ComponentTypes {
    AgendraSplashHeader: typeof AgendraSplashHeaderComponent
    AgendraHomePage: typeof AgendraHomePageComponent
  }
}
