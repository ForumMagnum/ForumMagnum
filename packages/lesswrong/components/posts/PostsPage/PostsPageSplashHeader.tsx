import classNames from 'classnames';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useMulti } from '../../../lib/crud/withMulti';
import { isLWorAF } from '../../../lib/instanceSettings';
import { Link } from '../../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { HashLink } from '../../common/HashLink';
import { SidebarsContext } from '../../common/SidebarsWrapper';
import { useObserver } from '../../hooks/useObserver';
import { getVotingSystemByName } from '../../../lib/voting/getVotingSystem';
import { useImageContext } from './ImageContext';
import { useHover } from '../../common/withHover';
import { hideScrollBars } from '../../../themes/styleUtils';
import { useCurrentUser } from '../../common/withUser';
import { Coordinates } from './ImageCropPreview';
import { userIsAdminOrMod } from '../../../lib/vulcan-users/permissions';

const styles = (theme: ThemeType) => ({
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
      background: `linear-gradient(180deg, ${theme.palette.panelBackground.translucent} 64px, transparent 40%, transparent 48%, ${theme.palette.panelBackground.default} 97%)`,
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
    ...theme.typography.postStyle,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    color: theme.palette.text.alwaysWhite,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '7vh',
    transition: 'transform .75s ease-in-out'
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 8,
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    width: 'fit-content',
    maxWidth: '350px',
    textAlign: 'left',
    marginLeft: 16,
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
    display: "flex",
    justifyContent: "flex-end"
  },
  audioPlayer: {
    padding: 8,
    marginLeft: 6,
    width: 480
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
      fontSize: '4rem',
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
    cursor: 'pointer',
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  reviewNavigationMobile: {
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

/// PostsPageSplashHeader: The metadata block at the top of a post page, with
/// title, author, voting, an actions menu, etc.
const PostsPageSplashHeader = ({post, showEmbeddedPlayer, toggleEmbeddedPlayer, classes}: {
  post: (PostsWithNavigation|PostsWithNavigationAndRevision) & { reviewWinner: ReviewWinnerAll },
  showEmbeddedPlayer?: boolean,
  toggleEmbeddedPlayer?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { UsersName, CommentBody, LWPopper, ImageCropPreview, SplashHeaderImageOptions, PostsAudioPlayerWrapper, LWPostsPageHeaderTopRight, FormatDate } = Components;
  
  const { selectedImageInfo } = useImageContext();
  const { setToCVisible } = useContext(SidebarsContext)!;
  const currentUser = useCurrentUser();
  
  const { anchorEl, hover, eventHandlers } = useHover();
  
  const [visible, setVisible] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState(post.reviewWinner.reviewWinnerArt?.splashArtImageUrl);
  const [cropPreviewEnabled, setCropPreviewEnabled] = useState(false);
  const [selectedReview, setSelectedReview] = useState<CommentsList | null>(null);
  const [imageFlipped, setImageFlipped] = useState(false);
  
  const toggleImageFlip = () => setImageFlipped(!imageFlipped);
  
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

  const setCropPreview = (coordinates?: Coordinates) => {
    if (imgRef.current && backgroundImgWrapperRef.current && backgroundImgCropPreviewRef.current) {
      if (coordinates) {
        const updatedMask = `
          linear-gradient(#000 0 0) ${coordinates.x}px ${coordinates.y}px/${coordinates.width}px ${coordinates.height}px,
          linear-gradient(rgba(0,0,0,0.4) 0 0)
        `;
        imgRef.current.style.mask = `${updatedMask} no-repeat`;
        imgRef.current.style.webkitMask = updatedMask;
        imgRef.current.style.webkitMaskRepeat = 'no-repeat';

        setCropPreviewEnabled(true);
      } else {
        imgRef.current.style.mask = '';
        imgRef.current.style.webkitMask = '';
        imgRef.current.style.webkitMaskRepeat = '';

        setCropPreviewEnabled(false);
      }
    }
  };
  
  const { results: reviews } = useMulti({
    terms: {
      view: "reviews",
      postId: post._id,
    },
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    limit: 5
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
      <Link className={classes.reviewNavigation} to="/leastwrong?sort=year">
        {/* Ranked #{post.reviewWinner.reviewRanking + 1} of {post.reviewWinner.competitorCount} posts in {post.reviewWinner.reviewYear} */}
        <FormatDate date={post.postedAt} format="MMMM DD, YYYY" tooltip={false}/>
        <em> (Ranked #{post.reviewWinner.reviewRanking + 1} of {post.reviewWinner.competitorCount} posts)</em>
      </Link>
      <Link className={classes.reviewNavigationMobile} to="/leastwrong?sort=year">
        <FormatDate date={post.postedAt} format="MMMM DD, YYYY" tooltip={false}/>
        <em> (#{post.reviewWinner.reviewRanking + 1} of {post.reviewWinner.competitorCount})</em>
      </Link>
    </div>
  );

  const imagePreviewAndCrop = (userIsAdminOrMod(currentUser) &&
    <div className={classes.rightSectionBelowBottomRow}>
      <div {...eventHandlers}>
        <div className={classes.changeImageBox}>Change image</div>
        <div className={classes.changeImageBox} onClick={toggleImageFlip}>Flip image</div>
        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start" clickable={true}>
          <div>
            <SplashHeaderImageOptions post={post} />
          </div>
        </LWPopper>
      </div>
      <div className={classes.rightSectionBelowBottomRow}>
        <ImageCropPreview imgRef={imgRef} setCropPreview={setCropPreview} flipped={imageFlipped} />
      </div>
    </div>
  );

  const audioPlayer = (
    <div className={classes.audioPlayerContainer}>
      <div className={classes.audioPlayer}>
        <PostsAudioPlayerWrapper post={post} showEmbeddedPlayer={!!showEmbeddedPlayer} />
      </div>
    </div>
  );

  const reviewContainer = (
    <div className={classes.reviewContainer} onMouseLeave={() => {
      setSelectedReview(null);
    }}>
      {selectedReview && <div className={classes.reviewPreviewContainer}>
        <div className={classes.reviewPreview}>
          <div className={classes.reviewPreviewAuthor}>
            <UsersName user={selectedReview.user} />
          </div>
          <div className={classes.reviewPreviewBody}>
            <CommentBody comment={selectedReview} />
          </div>
        </div>
      </div>}
      <div className={classes.reviews}>
        {reviews && reviews.length > 0 && reviews.map(review => <ReviewPill key={review._id} review={review} classes={classes} setReview={setSelectedReview} />)}
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
      <LWPostsPageHeaderTopRight post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} higherContrast={true} />
    </div>
    {audioPlayer}
    <div className={classes.rightSection}>
      {imagePreviewAndCrop}
    </div>
    {reviewContainer}
    {centralSection}
  </div>
}

const ReviewPill = ({review, classes, setReview}: {review: CommentsList, classes: ClassesType<typeof styles>, setReview: (r: CommentsList | null) => void}) => {
  return <HashLink to={`#${review._id}`}>
    <div className={classes.review} onMouseOver={() => setReview(review)}>
      <div className={classes.reviewScore}>
        {review.baseScore}
      </div>
      <div className={classes.reviewAuthor}>
        {review?.user?.displayName || "Anonymous"}
      </div>
    </div>
  </HashLink>
}

const PostsPageSplashHeaderComponent = registerComponent(
  'PostsPageSplashHeader', PostsPageSplashHeader, {styles}
);

declare global {
  interface ComponentTypes {
    PostsPageSplashHeader: typeof PostsPageSplashHeaderComponent,
  }
}
