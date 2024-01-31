import React, { FC, MouseEvent, useContext, useEffect, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetAnswerCountStr, postGetCommentCount, postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils'
import { getUrlClass } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { isServer } from '../../../lib/executionEnvironment';
import moment from 'moment';
import { isLWorAF } from '../../../lib/instanceSettings';
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import { PODCAST_TOOLTIP_SEEN_COOKIE } from '../../../lib/cookies/cookies';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import { useObserver } from '../../hooks/useObserver';
import { useMulti } from '../../../lib/crud/withMulti';
import { useHover } from '../../common/withHover';
import { Link } from '../../../lib/reactRouterWrapper';
import { HashLink } from '../../common/HashLink';
import { SidebarsContext } from '../../common/SidebarsWrapper';
import { PostsAudioPlayerWrapper } from './PostsAudioPlayerWrapper';

const styles = (theme: ThemeType) => ({
// JSS styles

  root: {
    zIndex: theme.zIndexes.postsPageSplashHeader,
    height: '100vh',
    marginTop: 'calc(-50px - 64px)',
    paddingTop: 64,
    backgroundImage: `url("https://res.cloudinary.com/lesswrong-2-0/image/upload/v1705983138/ohabryka_Beautiful_aquarelle_painting_of_the_Mississipi_river_c_b3c80db9-a731-4b16-af11-3ed6281ba167_xru9ka.png")`,
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
      background: 'linear-gradient(0deg, white 3%, transparent 48%)',
      pointerEvents: 'none'
    },
    transition: 'opacity 0.2s ease-in-out',
    opacity: 1,
    [theme.breakpoints.down('sm')]: {
      marginTop: '-64px',
      // Cancels out padding for mobile views
      marginLeft: -8,
      marginRight: -8
    },
  },
  fadeOut: {
    opacity: 0,
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
    maxWidth: '600px',
  },
  narrowLeftElements: {
    maxWidth: '350px',
    textAlign: 'left',
    padding: 8,
    whiteSpace: 'nowrap',
    ...theme.typography.commentStyle,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'flex-start',
    height: 'min-content',
    padding: 8,
    opacity: 0.76
  },
  title: {
    color: 'rgba(0,0,0,0.75)',
    fontSize: '5.5rem',
    fontWeight: '600',
    margin: '0px',
    lineHeight: '1',
    maxWidth: '75vw',
    textWrap: 'balance',
    [theme.breakpoints.down('xs')]: {
      fontSize: '2.5rem',
      maxWidth: '90vw'
    }
  },
  titleSmaller: {
    fontSize: '3.8rem',
    [theme.breakpoints.down('xs')]: {
      fontSize: '2rem'
    }
  },
  postActionsButton: {
    backgroundColor: theme.palette.tag.coreTagBackground,
    marginLeft: 4,
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
    color: 'rgba(0,0,0,0.65)',
  },
  reviews: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexWrap: 'wrap-reverse',
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
    color: 'white'
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    border: `1px solid ${theme.palette.panelBackground.reviewGold}`,
    padding: '8px',
    width: '650px',
    maxWidth: '70vw',
    whiteSpace: 'normal',
    textAlign: 'left',
    borderRadius: '8px',
    marginLeft: 'auto',
    marginRight: 'auto',
    overflow: 'scroll',
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
const PostsPageSplashHeader = ({post, answers = [], dialogueResponses = [], showEmbeddedPlayer, toggleEmbeddedPlayer, hideMenu, hideTags, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  answers?: CommentsList[],
  dialogueResponses?: CommentsList[],
  showEmbeddedPlayer?: boolean,
  toggleEmbeddedPlayer?: () => void,
  hideMenu?: boolean,
  hideTags?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { FooterTagList, UsersName, CommentBody, PostActionsButton, LWTooltip, ForumIcon, PostsAudioPlayerWrapper } = Components;
  const [visible, setVisible] = React.useState(true);
  const {setToCVisible} = useContext(SidebarsContext)!;
  const transitionHeader = (headerVisibile: boolean) => {
    setToCVisible(!headerVisibile);
    setVisible(headerVisibile);
  }
  const observerRef = useObserver<HTMLDivElement>({onEnter: () => transitionHeader(true), onExit: () => transitionHeader(false), threshold: 0.95});
  const { loading, results: reviews, loadMoreProps } = useMulti({
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

  const audioIcon = <LWTooltip title={'Listen to this post'} className={classNames(classes.togglePodcastContainer, {[classes.nonhumanAudio]: nonhumanAudio})}>
    <a href="#" onClick={toggleEmbeddedPlayer}>
      <ForumIcon icon="VolumeUp" className={classNames(classes.audioIcon, {[classes.audioIconOn]: showEmbeddedPlayer})} />
    </a>
  </LWTooltip>

  console.log("do we have toggleEmbeddedPlayer?", toggleEmbeddedPlayer)

  return <div className={classNames(classes.root, {[classes.fadeOut]: !visible})} ref={observerRef}>
    <div className={classes.top}>
      <div className={classes.leftSection}>
        <div className={classes.narrowLeftElements}>
          <Link className={classes.reviewNavigation} to="/best-of-lesswrong">
            Ranked #2 of 3220 posts in the 2021 Review
          </Link>
          <Link className={classes.reviewNavigationMobile} to="/best-of-lesswrong">
            #2 in 2021 Review
          </Link>
        </div>
        {toggleEmbeddedPlayer && audioIcon}
        <PostsAudioPlayerWrapper post={post} showEmbeddedPlayer={!!showEmbeddedPlayer} />
      </div>
      <span className={classes.rightSection}>
        {!post.shortform && !post.isEvent && !hideTags && <AnalyticsContext pageSectionContext="tagHeader">
          <FooterTagList post={post} hideScore useAltAddTagButton hideAddTag={false} />
          <PostActionsButton post={post} className={classes.postActionsButton} autoPlace/>
        </AnalyticsContext>}
      </span>
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
      
      <h1 className={classNames(classes.title, {[classes.titleSmaller]: post.title.length > 80})}>
        {post.title}
      </h1>
      <div className={classes.author}>
        <UsersName user={post.user} />
      </div>
    </div>
  </div>
}

const ReviewPill = ({review, classes, setReview}: {review: CommentsList, classes: ClassesType, setReview: (r:CommentsList | null) => void}) => {
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
