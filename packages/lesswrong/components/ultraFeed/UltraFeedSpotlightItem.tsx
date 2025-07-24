import classNames from 'classnames';
import React, { CSSProperties, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { getSpotlightUrl } from '../../lib/collections/spotlights/helpers';
import { useStyles, defineStyles } from '../hooks/useStyles';
import { descriptionStyles, getSpotlightDisplayTitle } from '../spotlights/SpotlightItem';
import { useUltraFeedObserver } from './UltraFeedObserver';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import FeedContentBody from "./FeedContentBody";
import CloudinaryImage2 from "../common/CloudinaryImage2";
import { useDialog } from '../common/withDialog';
import UltraFeedPostDialog from './UltraFeedPostDialog';
import UltraFeedItemFooter from './UltraFeedItemFooter';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';
import { SHOW_ALL_BREAKPOINT_VALUE } from './ultraFeedSettingsTypes';
import { isRegularClick } from '../posts/TableOfContents/TableOfContentsList';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { FeedPostMetaInfo, FeedSpotlightMetaInfo } from './ultraFeedTypes';

const SIDE_MARGIN = 150;

const buildFadeMask = (breakpoints: string[]) => {
  const mask = `linear-gradient(to right, ${breakpoints.join(",")})`;
  return {mask};
}

const buildVerticalFadeMask = (breakpoints: string[]) => {
  const mask = `linear-gradient(to bottom, ${breakpoints.join(",")})`;
  return {mask};
}

const generateVerticalFade = (theme: ThemeType, stops: Array<[number, number]>) => {
  const breakpoints = stops.map(([opacity, position]) => 
    `${theme.palette.inverseGreyAlpha(opacity)} ${position * 100}%`
  );
  return buildVerticalFadeMask(breakpoints);
}

const useUltraFeedSpotlightItemStyles = defineStyles(
  "UltraFeedSpotlightItem",
  (theme: ThemeType) => ({
    root: {
      background: theme.palette.panelBackground.default,
      maxWidth: SECTION_WIDTH,
      marginLeft: "auto",
      marginRight: "auto",
      width: SECTION_WIDTH,
      marginBottom: 12,
      boxShadow: theme.palette.boxShadow.default,
      borderRadius: theme.borderRadius.default,
      '&:hover': {
        boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
      },
      [theme.breakpoints.down('sm')]: {
        width: 'auto',
        marginBottom: 0,
        boxShadow: 'none',
        borderRadius: 0,
        paddingTop: 12,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
        overflow: "visible",
        '&:hover': {
          boxShadow: 'none',
        },
      },
    },
    rootWithFooter: {
      [theme.breakpoints.down('sm')]: {
        paddingBottom: 0,
      },
    },
    spotlightItem: {
      position: "relative",
      borderRadius: theme.borderRadius.default,
      overflow: "hidden",
      [theme.breakpoints.down('sm')]: {
        overflow: "visible",
        borderRadius: 0,
      },
    },
    contentContainer: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      background: theme.palette.panelBackground.default,
      [theme.breakpoints.down('sm')]: {
        overflow: "visible",
        background: 'transparent',
      },
    },
    spotlightFadeBackground: {
      background: "var(--spotlight-fade)",
    },
    content: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      position: "relative",
      zIndex: 2,
      paddingTop: 12,
      paddingLeft: 16,
      paddingRight: 16,
      minHeight: 100,
      [theme.breakpoints.down('sm')]: {
        padding: 0,
        minHeight: 'auto',
        display: 'flex',
        flexDirection: 'column',
      },
    },
    contentWithPaddingBottom: {
      paddingBottom: 12,
      [theme.breakpoints.down('sm')]: {
        paddingBottom: 16,
      },
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      maxWidth: `calc(100% - ${SIDE_MARGIN}px)`,
      marginBottom: 4,
      position: 'relative',
      zIndex: 3,
      [theme.breakpoints.down('sm')]: {
        maxWidth: '100%',
        gap: '4px',
        position: 'relative',
        order: 1,
        marginBottom: 12,
      },
    },
    titleContainer: {
      display: 'flex',
      alignItems: 'baseline',
    },
    title: {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontWeight: 600,
      opacity: 0.8,
      lineHeight: 1.15,
      textWrap: 'balance',
      cursor: 'pointer',
      '&:hover': {
        opacity: 0.9,
        textDecoration: 'none',
      },
      fontSize: '1.3rem',
      whiteSpace: 'normal',
      [theme.breakpoints.down('sm')]: {
        fontSize: 20.5,
      },
    },
    metaRow: {
      display: "flex",
      color: theme.palette.text.dim,
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: theme.typography.body2.fontSize,
      alignItems: 'baseline',
      columnGap: '16px',
      rowGap: '4px',
      marginBottom: '12px',
      [theme.breakpoints.down('sm')]: {
        fontSize: "1.3rem",
        columnGap: '8px',
        rowGap: '0px',
        flexWrap: 'wrap',
        '& > a, & > span': {
          whiteSpace: 'nowrap',
        },
        order: 3,
        marginTop: 24,
        marginBottom: 0,
      },
    },
    subtitleGroup: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      flexWrap: 'nowrap',
    },
    subtitle: {
      ...theme.typography.postStyle,
      ...theme.typography.italic,
      color: 'inherit',
      fontSize: 'inherit',
      fontFamily: 'inherit',
      [theme.breakpoints.down('sm')]: {
        fontSize: "1.3rem",
      },
    },
    curatedIcon: {
      "--icon-size": "16px",
      fontSize: "16px",
      color: theme.palette.ultraFeed.dim,
      opacity: 0.8,
      position: "relative",
      top: 2,
    },
    imageContainer: {
      position: "absolute",
      zIndex: 1,
      alignSelf: "stretch",
      display: "flex",
      justifyContent: "flex-end",
      top: 0,
      right: 0,
      width: "100%",
      height: "100%",
      margin: 0,
      [theme.breakpoints.down('sm')]: {
        position: "relative",
        width: 'auto',
        height: 'auto',
        top: 'auto',
        right: 'auto',
        margin: "-12px -16px -20px -16px",
        order: 2,
      },
    },
    imageContainerWithAuthor: {
      [theme.breakpoints.down('sm')]: {
        marginTop: -12,
      },
    },
    image: {
      objectFit: "cover",
      height: "100%",
      position: "absolute",
      top: 0,
      right: 0,
      borderTopRightRadius: theme.borderRadius.default,
      borderBottomRightRadius: theme.borderRadius.default,
      [theme.breakpoints.down('sm')]: {
        position: 'relative',
        width: "100%",
        height: "auto",
        top: 'auto',
        right: 'auto',
        maxWidth: "100%",
        objectPosition: "center center",
        maxHeight: 200,
        minHeight: 150,
        borderRadius: 0,
      },
    },
    imageVerticalFade: {
      [theme.breakpoints.down('sm')]: {
        ...generateVerticalFade(theme, [
          [0, 0],
          [0.1, 0.05],
          [0.5, 0.10],
          [0.9, 0.15],
          [1, 0.20],
          [1, 0.80],
          [0.9, 0.85],
          [0.5, 0.90],
          [0.1, 0.95],
          [0, 1],
        ]),
      },
    },
    imageFade: {
      [theme.breakpoints.up('md')]: {
        ...buildFadeMask([
          "transparent 0",
          `${theme.palette.text.alwaysWhite} 80%`,
          `${theme.palette.text.alwaysWhite} 100%`,
        ]),
      },
    },
    imageFadeCustom: {
      [theme.breakpoints.up('md')]: {
        ...buildFadeMask([
          "transparent 0",
          "transparent 30%",
          `${theme.palette.text.alwaysWhite} 90%`,
          `${theme.palette.text.alwaysWhite} 100%`,
        ]),
      },
    },
    descriptionArea: {
      zIndex: 3,
      display: "flex",
      flexDirection: "column",
      gap: '8px',
      maxWidth: `calc(100% - ${SIDE_MARGIN}px)`,
      [theme.breakpoints.down('sm')]: {
        maxWidth: '100%',
        position: 'relative',
        marginTop: 12,
        order: 4,
      },
    },
    descriptionWrapper: {
      cursor: 'pointer',
    },
    description: {
      ...descriptionStyles(theme),
      opacity: 0.9,
      position: "relative",
      [theme.breakpoints.down('sm')]: {
        fontSize: "1.3rem",
        position: 'static',
      },
    },
    splashImage: {
      filter: "brightness(1.2)",
      transform: "translateX(13%) scale(1.15)",
      [theme.breakpoints.down('sm')]: {
        transform: 'none',
      },
    },
    footer: {
      marginTop: 8,
      marginBottom: 12,
      position: 'relative',
      zIndex: 3,
      '& .UltraFeedItemFooter-bookmarkButton': {
        filter: `
            drop-shadow(0px 0px 2px ${theme.palette.background.default})
            drop-shadow(0px 0px 4px ${theme.palette.background.default})
            drop-shadow(0px 0px 8px ${theme.palette.background.default})
            drop-shadow(0px 0px 12px ${theme.palette.background.default})
            drop-shadow(0px 0px 20px ${theme.palette.background.default})
            drop-shadow(0px 0px 30px ${theme.palette.background.default})
          `,
        opacity: 1,
        color: `${theme.palette.grey[600]} !important`,
      },
      '& .SeeLessButton-root svg': {
        filter: `
            drop-shadow(0px 0px 4px ${theme.palette.background.default})
            drop-shadow(0px 0px 8px ${theme.palette.background.default})
            drop-shadow(0px 0px 16px ${theme.palette.background.default})
            drop-shadow(0px 0px 24px ${theme.palette.background.default})
            drop-shadow(0px 0px 40px ${theme.palette.background.default})
            drop-shadow(0px 0px 60px ${theme.palette.background.default})
          `,
        opacity: 1,
        color: `${theme.palette.grey[1000]} !important`,
      },
      [theme.breakpoints.down('sm')]: {
        marginTop: 12,
        marginBottom: 0,
        marginLeft: -16,
        marginRight: -16,
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 12,
        order: 5,
        '& .UltraFeedItemFooter-bookmarkButton': {
          filter: 'none',
        },
        '& .SeeLessButton-root svg': {
          filter: 'none',
          color: `${theme.palette.ultraFeed.dim} !important`,
          opacity: 0.7,
        },
      },
    },
  }),
  { stylePriority: -1 }
);


const SpotlightContentWrapper = ({ isPost, url, handleContentClick, children }: {
  isPost: boolean;
  url: string;
  handleContentClick: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}) => {
  const classes = useStyles(useUltraFeedSpotlightItemStyles);
  
  if (isPost) {
    return (
      <div className={classes.descriptionWrapper} onClick={handleContentClick}>
        {children}
      </div>
    );
  }
  return (
    <Link to={url} className={classes.descriptionWrapper}>
      {children}
    </Link>
  );
};

const SpotlightTitle = ({ spotlight, isPost, url, handleContentClick, className }: {
  spotlight: SpotlightDisplay;
  isPost: boolean;
  url: string;
  handleContentClick: (event: React.MouseEvent) => void;
  className?: string;
}) => {
  const classes = useStyles(useUltraFeedSpotlightItemStyles);
  
  return (
    <div className={className}>
      <div className={classes.titleContainer}>
        {isPost ? (
          <a 
            href={url} 
            onClick={handleContentClick}
            className={classes.title}
          >
            {getSpotlightDisplayTitle(spotlight)}
          </a>
        ) : (
          <Link to={url} className={classes.title}>
            {getSpotlightDisplayTitle(spotlight)}
          </Link>
        )}
      </div>
    </div>
  );
};

const SpotlightMetaRow = ({ spotlight, spotlightDocument, post, showSubtitle, className }: {
  spotlight: SpotlightDisplay;
  spotlightDocument: any;
  post?: PostsListWithVotes;
  showSubtitle: boolean;
  className?: string;
}) => {
  const classes = useStyles(useUltraFeedSpotlightItemStyles);
  
  const subtitleComponent = spotlight.subtitleUrl ? <Link to={spotlight.subtitleUrl}>{spotlight.customSubtitle}</Link> : spotlight.customSubtitle;
    
  if (!spotlight.showAuthor && !spotlight.customSubtitle && !post?.contents?.wordCount) {
    return null;
  }
  
  return (
    <div className={className}>
      {spotlight.showAuthor && spotlightDocument?.user && (
        <Link to={userGetProfileUrlFromSlug(spotlightDocument?.user.slug)}>
          {spotlightDocument?.user.displayName}
        </Link>
      )}
      
      {post?.contents?.wordCount && (
        <span>{post.contents.wordCount} words</span>
      )}
      
      {spotlight.customSubtitle && showSubtitle && (
        <span className={classes.subtitleGroup}>
          <span className={classes.subtitle}>
            {subtitleComponent}
          </span>
          <LWTooltip title="This is a featured item">
            <ForumIcon icon="Star" className={classes.curatedIcon} />
          </LWTooltip>
        </span>
      )}
    </div>
  );
};

const SpotlightImage = ({ spotlight, spotlightDocument, className }: {
  spotlight: SpotlightDisplay;
  spotlightDocument: any;
  className?: string;
}) => {
  const classes = useStyles(useUltraFeedSpotlightItemStyles);
  
  if (!spotlight.spotlightSplashImageUrl && !spotlight.spotlightImageId) {
    return null;
  }
  
  return (
    <div className={classNames(
      className,
      {[classes.imageContainerWithAuthor]: spotlight.showAuthor && spotlightDocument?.user}
    )}>
      {spotlight.spotlightSplashImageUrl && 
        <img 
          src={spotlight.spotlightSplashImageUrl} 
          className={classNames(
            classes.image, 
            classes.imageVerticalFade, 
            classes.imageFade,
            classes.splashImage
          )}
        />
      }
      {spotlight.spotlightImageId && 
        <CloudinaryImage2
          publicId={spotlight.spotlightImageId}
          darkPublicId={spotlight.spotlightDarkImageId}
          className={classNames(classes.image, classes.imageVerticalFade, {
            [classes.imageFade]: spotlight.imageFade && !spotlight.imageFadeColor,
            [classes.imageFadeCustom]: spotlight.imageFade && spotlight.imageFadeColor,
          })}
          imgProps={{w: "800"}}
          loading="lazy"
        />
      }
    </div>
  );
};

const UltraFeedSpotlightItem = ({
  spotlight,
  post,
  index,
  showSubtitle=true,
  className,
  spotlightMetaInfo,
}: {
  spotlight: SpotlightDisplay,
  post?: PostsListWithVotes,
  index: number,
  showSubtitle?: boolean,
  className?: string,
  spotlightMetaInfo: FeedSpotlightMetaInfo,
}) => {
  const classes = useStyles(useUltraFeedSpotlightItemStyles);
  const { observe } = useUltraFeedObserver();
  const { openDialog } = useDialog();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const currentTime = useCurrentTime();
  
  const postMetaInfo: FeedPostMetaInfo = useMemo(() => ({
    displayStatus: 'expanded' as const,
    sources: ['spotlights'] as const,
    lastServed: currentTime,
    lastViewed: null,
    lastInteracted: null,
  }), [currentTime]);

  const handleContentClick = useCallback((event: React.MouseEvent) => {
    if (isRegularClick(event) && post) {
      event.preventDefault();
      openDialog({
        name: "UltraFeedPostDialog",
        closeOnNavigate: true,
        contents: ({ onClose }) => (
          <UltraFeedPostDialog
            partialPost={post}
            postMetaInfo={postMetaInfo}
            onClose={onClose}
          />
        )
      });
    }
  }, [openDialog, post, postMetaInfo]);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement && spotlight) {
      observe(currentElement, {
        documentId: spotlight._id,
        documentType: 'spotlight',
        feedCardIndex: index,
        servedEventId: spotlightMetaInfo.servedEventId,
      });
    }
  }, [observe, spotlight, index, spotlightMetaInfo.servedEventId]);

  if (!spotlight) {
    return null;
  }

  const url = getSpotlightUrl(spotlight);
  const spotlightDocument = spotlight.post ?? spotlight.sequence ?? spotlight.tag;
  const isPost = spotlight.documentType === 'Post' && !!post;

  const style: React.CSSProperties & { [key: `--${string}`]: string | null } = {
    "--spotlight-fade": spotlight.imageFadeColor,
  }

  const replyConfig = {
    isReplying,
    onReplyClick: () => setIsReplying(!isReplying),
    onReplySubmit: () => setIsReplying(false),
    onReplyCancel: () => setIsReplying(false),
  };

  return (
    <AnalyticsContext ultraFeedElementType="feedSpotlight" spotlightId={spotlight._id} feedCardIndex={index}>
      <div
        ref={elementRef}
        id={spotlight._id}
        style={style}
        className={classNames(classes.root, className, { [classes.rootWithFooter]: isPost, })}
      >
        <div className={classNames(classes.spotlightItem, {
          [classes.spotlightFadeBackground]: !!spotlight.imageFadeColor,
        })}>
          <div className={classes.contentContainer}>
            <div className={classNames(classes.content, {
              [classes.contentWithPaddingBottom]: !isPost
            })}>
              <SpotlightTitle
                spotlight={spotlight}
                isPost={isPost}
                url={url}
                handleContentClick={handleContentClick}
                className={classes.header}
              />
              
              <SpotlightImage
                spotlight={spotlight}
                spotlightDocument={spotlightDocument}
                className={classes.imageContainer}
              />
              
              <SpotlightMetaRow
                spotlight={spotlight}
                spotlightDocument={spotlightDocument}
                post={post}
                showSubtitle={showSubtitle}
                className={classes.metaRow}
              />
              
              <div className={classes.descriptionArea}>
                <SpotlightContentWrapper isPost={isPost} url={url} handleContentClick={handleContentClick}>
                  <FeedContentBody
                    html={spotlight.description?.html ?? ''}
                    initialWordCount={SHOW_ALL_BREAKPOINT_VALUE}
                    maxWordCount={SHOW_ALL_BREAKPOINT_VALUE}
                    hideSuffix
                    className={classes.description}
                  />
                </SpotlightContentWrapper>
              </div>
              
              {isPost && post && <div className={classes.footer}>
                  <UltraFeedItemFooter
                    document={post}
                    collectionName="Posts"
                    metaInfo={postMetaInfo}
                    replyConfig={replyConfig}
                    hideReacts={true}
                  />
                </div>}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  )
}

export default UltraFeedSpotlightItem;
