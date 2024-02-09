import classNames from 'classnames';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useMulti } from '../../../lib/crud/withMulti';
import { isLWorAF } from '../../../lib/instanceSettings';
import { Link } from '../../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { HashLink } from '../../common/HashLink';
import { SidebarsContext } from '../../common/SidebarsWrapper';
import { useObserver } from '../../hooks/useObserver';
import { getVotingSystemByName } from '../../../lib/voting/votingSystems';
import { useImageContext, ReviewWinnerImageInfo } from './ImageContext';
import { useHover } from '../../common/withHover';
import { requireCssVar } from '../../../themes/cssVars';
import { hideScrollBars } from '../../../themes/styleUtils';
import { useCurrentUser } from '../../common/withUser';
import { Coordinates } from './ImageCropPreview';

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
    ...theme.typography.postStyle,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      // background: 'linear-gradient(0deg, white 3%, transparent 48%)',
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
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
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
      background: `linear-gradient(0deg, ${theme.palette.panelBackground.default} 3%, transparent 48%)`,
      pointerEvents: 'none'
    },
    transition: 'opacity 0.5s ease-in-out',
    opacity: 1,
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

  // These fade effects (for the title/author "fading out" vertically) also rely on the `transition` properties in the `title` and `author` classes
  fadeIn: {
    '& .PostsPageSplashHeader-title, .PostsPageSplashHeader-author, .PostsPageSplasheHeader-reviews': {
      transitionDelay: '0s',
      transitionTimingFunction: 'ease-out',
    },
  },
  fadeOut: {
    opacity: 0,
    '& .PostsPageSplashHeader-reviews': {
      opacity: 0,
      transform: 'translateY(-130px)',
      transitionTimingFunction: 'ease-in',
    },
    '& .PostsPageSplashHeader-title': {
      opacity: 0,
      transform: 'translateY(-100px)',
      transitionTimingFunction: 'ease-in',
    },
    '& .PostsPageSplashHeader-author': {
      opacity: 0,
      transform: 'translateY(-70px)',
      transitionTimingFunction: 'ease-in',
    },
  },
  centralSection: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    color: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '7vh',
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
  },
  changeImageBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: theme.palette.panelBackground.reviewGold,
    color: 'white',
    cursor: 'pointer',
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
    transition: 'opacity .5s, transform .5s'
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
    color: 'white',
    cursor: 'pointer',
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  reviewNavigationMobile: {
    backgroundColor: theme.palette.panelBackground.reviewGold,
    padding: 6, 
    borderRadius: 4,
    color: 'white',
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    }
  },
  author: {
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
    color: 'white',
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
      display: 'none',
    },
  },
});

/// PostsPageSplashHeader: The metadata block at the top of a post page, with
/// title, author, voting, an actions menu, etc.
const PostsPageSplashHeader = ({post, showEmbeddedPlayer, toggleEmbeddedPlayer, classes}: {
  post: (PostsWithNavigation|PostsWithNavigationAndRevision)&{reviewWinner: ReviewWinnerAll},
  showEmbeddedPlayer?: boolean,
  toggleEmbeddedPlayer?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { FooterTagList, UsersName, CommentBody, PostActionsButton, LWTooltip, LWPopper, ImageCropPreview, ForumIcon, SplashHeaderImageOptions, PostsAudioPlayerWrapper, PostsSplashPageHeaderVote } = Components;
  const { selectedImageInfo } = useImageContext();
  const currentUser = useCurrentUser();
  const [visible, setVisible] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState('');
  const { setToCVisible } = useContext(SidebarsContext)!;
  
  const [cropPreviewEnabled, setCropPreviewEnabled] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const backgroundImgWrapperRef = useRef<HTMLDivElement>(null);
  const backgroundImgCropPreviewRef = useRef<HTMLDivElement>(null);

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

  const transitionHeader = (headerVisibile: boolean) => {
    setToCVisible(!headerVisibile);
    setVisible(headerVisibile);
  }
  const observerRef = useObserver<HTMLDivElement>({onEnter: () => transitionHeader(true), onExit: () => transitionHeader(false), threshold: 0.95});
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
  const [selectedReview, setSelectedReview] = React.useState<CommentsList | null>(null);

  const nonhumanAudio = post.podcastEpisodeId === null && isLWorAF

  const audioIcon = <LWTooltip title={'Listen to this post'} className={classNames(classes.togglePodcastContainer, {[classes.nonhumanAudio]: nonhumanAudio, [classes.audioIconOn]: showEmbeddedPlayer})}>
    <a href="#" onClick={toggleEmbeddedPlayer}>
      <ForumIcon icon="VolumeUp" className={classNames(classes.audioIcon, {})} />
    </a>
  </LWTooltip>

  const votingSystem = getVotingSystemByName(post.votingSystem ?? 'default');
  const postActionsButton = <PostActionsButton post={post} className={classes.postActionsButton} flip />;

  const default_images = ["https://res.cloudinary.com/lesswrong-2-0/image/upload/v1705983138/ohabryka_Beautiful_aquarelle_painting_of_the_Mississipi_river_c_b3c80db9-a731-4b16-af11-3ed6281ba167_xru9ka.png", "https://cl.imagineapi.dev/assets/0ca0fb1c-ea90-4b60-bebe-eb38bf5b2746/0ca0fb1c-ea90-4b60-bebe-eb38bf5b2746.png", "https://cl.imagineapi.dev/assets/e3d92e0f-71c1-4f44-b0f9-cbaae23b24dd/e3d92e0f-71c1-4f44-b0f9-cbaae23b24dd.png"]

  // TODO: get rid of default images!
  const images: ReviewWinnerImageInfo[] = post.reviewWinnerArt ? 
    post.reviewWinnerArt.map(image => ({
      postId: post._id,
      imageId: image._id,
      splashArtImageUrl: image.splashArtImageUrl,
      splashArtImagePrompt: image.splashArtImagePrompt
    })) : 
    default_images.map(url => ({
      postId: post._id,
      imageId: "fix this!",
      splashArtImageUrl: url,
      splashArtImagePrompt: null
    }))

    useEffect(() => {
      const postLastSavedImage = post.reviewWinner.reviewWinnerArt?.splashArtImageUrl;

      const newBackgroundImage =
        selectedImageInfo?.splashArtImageUrl ||
        postLastSavedImage ||
        images[0].splashArtImageUrl;
      setBackgroundImage(newBackgroundImage);
    }, [post, selectedImageInfo, images]); 

  const { anchorEl, hover, eventHandlers } = useHover();

  // TODO: uncomment currentUser.isAdmin
  return <div className={classNames(classes.root, {[classes.fadeOut]: !visible})} ref={observerRef} >
    {
      /* 
       * We have two copies of the image to implement crop preview functionality using masking and z-indexes
       * The important bits are that when the crop element is enabled, it "dims" everything outside of the picker
       * Also, when the picker is moved over the title/author/etc, they don't show up in the preview, just the underlying image
       * This doesn't work with the Layout header, but we don't care that much /shrug
       */
    }
    <div ref={backgroundImgWrapperRef} className={classNames(classes.backgroundImageWrapper, { [classes.cropPreviewEnabledForeground]: cropPreviewEnabled })}>
      <img ref={imgRef} src={backgroundImage} className={classes.backgroundImage} alt="Background Image" />
    </div>
    <div ref={backgroundImgCropPreviewRef} className={classNames(classes.backgroundImageWrapper, { [classes.cropPreviewEnabledBackground]: cropPreviewEnabled })}>
      <img ref={imgRef} src={backgroundImage} className={classes.backgroundImageCropPreview} alt="Background Image" />
    </div>
    <div className={classes.top}>
      <div className={classes.leftSection}>
        <Link className={classes.reviewNavigation} to="/best-of-lesswrong">
          Ranked #{post.reviewWinner.reviewRanking} of {post.reviewWinner.competitorCount} posts in the {post.reviewWinner.reviewYear} Review
        </Link>
        <Link className={classes.reviewNavigationMobile} to="/best-of-lesswrong">
          #{post.reviewWinner?.reviewRanking} in 2021 Review
        </Link>
        {toggleEmbeddedPlayer && audioIcon}
      </div>
      <div className={classes.rightSection}>
        <AnalyticsContext pageSectionContext="tagHeader">
          <div className={classes.rightSectionTopRow}>
            <FooterTagList post={post} hideScore useAltAddTagButton hideAddTag={false} appendElement={postActionsButton}/>
          </div>
        </AnalyticsContext>
        <div className={classes.rightSectionBottomRow}>
          <PostsSplashPageHeaderVote post={post} votingSystem={votingSystem} />
        </div>
        {currentUser && <div className={classes.rightSectionBelowBottomRow}> 
        {/* && currentUser.isAdmin */}
          <div {...eventHandlers}>
            <div className={classes.changeImageBox}>Change image</div>
            <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start" clickable={true}>
              <div>
                <SplashHeaderImageOptions images={images} post={post}/>
              </div>
            </LWPopper>
          </div>
          <div className={classes.rightSectionBelowBottomRow}>
            <ImageCropPreview reviewWinner={post.reviewWinner} imgRef={imgRef} setCropPreview={setCropPreview} />
          </div>
        </div>}
      </div>
    </div>

    <div className={classes.audioPlayerContainer}>
      <div className={classes.audioPlayer}>
        <PostsAudioPlayerWrapper post={post} showEmbeddedPlayer={!!showEmbeddedPlayer} />
      </div>
    </div>

    <div className={classes.reviewContainer} onMouseLeave={(e) => {
      setSelectedReview(null)
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
      <div className={classes.reviews} >
        {reviews && reviews.length > 0 && reviews.map(review => <ReviewPill key={review._id} review={review} classes={classes} setReview={setSelectedReview}/>)}
      </div>
    </div>
    
    <div className={classes.centralSection}>
      <h1 className={classNames(classes.title, { [classes.titleSmaller]: post.title.length > 80 })}>
        {post.title}
      </h1>
      <div className={classes.author}>
        <UsersName user={post.user} />
      </div>
    </div>
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
