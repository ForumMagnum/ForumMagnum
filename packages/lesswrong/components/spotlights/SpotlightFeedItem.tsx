import classNames from 'classnames';
import React, { CSSProperties, useCallback, useRef, useEffect, useState } from 'react';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { isBookUI } from '../../themes/forumTheme';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { getSpotlightUrl } from '../../lib/collections/spotlights/helpers';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useStyles, defineStyles } from '../hooks/useStyles';
import { descriptionStyles, getSpotlightDisplayTitle } from './SpotlightItem';
import { useUltraFeedObserver } from '../../components/ultraFeed/UltraFeedObserver';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import FeedContentBody from "../ultraFeed/FeedContentBody";
import CloudinaryImage2 from "../common/CloudinaryImage2";
import { useDialog } from '../common/withDialog';
import UltraFeedPostDialog from '../ultraFeed/UltraFeedPostDialog';
import UltraFeedItemFooter from '../ultraFeed/UltraFeedItemFooter';
import { FeedPostMetaInfo } from '../ultraFeed/ultraFeedTypes';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';

const SIDE_MARGIN = 150;

const buildFadeMask = (breakpoints: string[]) => {
  const mask = `linear-gradient(to right, ${breakpoints.join(",")})`;
  return {mask, "-webkit-mask-image": mask};
}

const buildVerticalFadeMask = (breakpoints: string[]) => {
  const mask = `linear-gradient(to bottom, ${breakpoints.join(",")})`;
  return {mask, "-webkit-mask-image": mask};
}

const useSpotlightFeedItemStyles = defineStyles(
  "SpotlightFeedItem",
  (theme: ThemeType) => ({
    root: {
      background: theme.palette.panelBackground.default,
      maxWidth: SECTION_WIDTH,
      marginLeft: "auto",
      marginRight: "auto",
      [theme.breakpoints.up("md")]: {
        width: SECTION_WIDTH,
        marginBottom: 12,
        boxShadow: theme.palette.boxShadow.default,
        borderRadius: theme.borderRadius.default,
        '&:hover': {
          boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
        },
      },
      [theme.breakpoints.down('sm')]: {
        paddingTop: 24,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
      },
    },
    spotlightItem: {
      position: "relative",
      borderRadius: theme.borderRadius.default,
      overflow: "hidden",
    },
    contentContainer: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      [theme.breakpoints.up('md')]: {
        background: theme.palette.panelBackground.default,
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
      [theme.breakpoints.up('md')]: {
        paddingTop: 12,
        paddingLeft: 16,
        paddingRight: 16,
        minHeight: 100,
      },
    },
    contentWithPaddingBottom: {
      [theme.breakpoints.up('md')]: {
        paddingBottom: 12,
      },
      [theme.breakpoints.down('sm')]: {
        paddingBottom: 16,
      },
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      marginBottom: 12,
      [theme.breakpoints.up('md')]: {
        maxWidth: `calc(100% - ${SIDE_MARGIN}px)`,
      },
    },
    titleContainer: {
      display: 'flex',
      alignItems: 'center',
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
        fontSize: "1.6rem",
      },
    },
    metaRow: {
      display: "flex",
      color: theme.palette.text.dim,
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: theme.typography.body2.fontSize,
      alignItems: 'baseline',
      gap: '16px',
      [theme.breakpoints.down('sm')]: {
        fontSize: "1.3rem",
      },
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
      "--icon-size": "14px",
      fontSize: "14px",
      color: theme.palette.ultraFeed.dim,
      opacity: 0.8,
      position: "relative",
      top: 2,
    },
    imageContainer: {
      position: "relative",
      zIndex: 1,
      alignSelf: "stretch",
      display: "flex",
      justifyContent: "flex-end",
      [theme.breakpoints.down('sm')]: {
        margin: "-20px -16px -16px -16px",
      },
      [theme.breakpoints.up('md')]: {
        position: "absolute",
        top: 0,
        right: 0,
        width: "100%",
        height: "100%",
        margin: 0,
      },
    },
    imageContainerWithAuthor: {
      [theme.breakpoints.down('sm')]: {
        marginTop: -20,
      },
    },
    image: {
      objectFit: "cover",
      [theme.breakpoints.down('sm')]: {
        maxWidth: "100%",
        height: "auto",
        objectPosition: "right center",
        maxHeight: 250,
        borderRadius: `${theme.borderRadius.default}px 0 0 ${theme.borderRadius.default}px`,
      },
      [theme.breakpoints.up('md')]: {
        height: "100%",
        position: "absolute",
        top: 0,
        right: 0,
        borderTopRightRadius: theme.borderRadius.default,
        borderBottomRightRadius: theme.borderRadius.default,
      },
    },
    imageVerticalFade: {
      [theme.breakpoints.down('sm')]: {
        ...buildVerticalFadeMask([
          "transparent 0",
          `${theme.palette.text.alwaysWhite} 20%`,
          `${theme.palette.text.alwaysWhite} 80%`,
          "transparent 100%",
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
      [theme.breakpoints.up('md')]: {
        maxWidth: `calc(100% - ${SIDE_MARGIN}px)`,
      },
    },
    descriptionWrapper: {
      cursor: 'pointer',
    },
    description: {
      ...descriptionStyles(theme),
      opacity: 0.9,
      [theme.breakpoints.down('sm')]: {
        fontSize: "1.3rem",
      },
      [theme.breakpoints.up('md')]: {
        position: "relative",
      },
    },
    splashImage: {
      filter: "brightness(1.2)",
      [theme.breakpoints.up('md')]: {
        transform: "translateX(13%) scale(1.15)",
      },
    },
    footer: {
      marginTop: 12,
      marginBottom: 12,
      [theme.breakpoints.down('sm')]: {
        marginTop: 16,
      },
      [theme.breakpoints.up('md')]: {
        position: 'relative',
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
      },
    },
  }),
  { stylePriority: -1 }
);

const SpotlightFeedItem = ({
  spotlight,
  post,
  index,
  showSubtitle=true,
  className,
}: {
  spotlight: SpotlightDisplay,
  post?: PostsListWithVotes,
  index: number,
  showSubtitle?: boolean,
  className?: string,
}) => {
  const classes = useStyles(useSpotlightFeedItemStyles);
  const { observe } = useUltraFeedObserver();
  const { openDialog } = useDialog();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isReplying, setIsReplying] = useState(false);

  const handleContentClick = useCallback((event: React.MouseEvent) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      if (post) {
        event.preventDefault();
        openDialog({
          name: "UltraFeedPostDialog",
          closeOnNavigate: true,
          contents: ({ onClose }) => (
            <UltraFeedPostDialog
              partialPost={post}
              postMetaInfo={{
                displayStatus: 'expanded',
                sources: ['spotlights'],
                lastServed: new Date(),
                lastViewed: null,
                lastInteracted: null,
              }}
              onClose={onClose}
            />
          )
        });
      }
    }
  }, [openDialog, post]);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement && spotlight) {
      observe(currentElement, {
        documentId: spotlight._id,
        documentType: 'spotlight'
      });
    }
  }, [observe, spotlight]);

  if (!spotlight) {
    return null;
  }

  const url = getSpotlightUrl(spotlight);
  const spotlightDocument = spotlight.post ?? spotlight.sequence ?? spotlight.tag;
  const isPost = spotlight.documentType === 'Post' && !!post;

  const style = {
    "--spotlight-fade": spotlight.imageFadeColor,
  } as CSSProperties;
  const subtitleComponent = spotlight.subtitleUrl 
    ? <Link to={spotlight.subtitleUrl}>{spotlight.customSubtitle}</Link> 
    : spotlight.customSubtitle;

  const replyConfig = {
    isReplying,
    onReplyClick: () => setIsReplying(!isReplying),
    onReplySubmit: () => setIsReplying(false),
    onReplyCancel: () => setIsReplying(false),
  };

  // Calculate word count for the description
  const descriptionWordCount = spotlight.description?.html 
    ? Math.ceil(spotlight.description.html.length / 5) // Rough estimate
    : 0;

  return (
    <AnalyticsContext ultraFeedElementType="feedSpotlight" spotlightId={spotlight._id} ultraFeedCardIndex={index}>
    <div
      ref={elementRef}
      id={spotlight._id}
      style={style}
      className={classNames(classes.root, className)}
    >
      <div className={classNames(classes.spotlightItem, {
        [classes.spotlightFadeBackground]: !!spotlight.imageFadeColor,
      })}>
        <div className={classes.contentContainer}>
          <div className={classNames(classes.content, {
            [classes.contentWithPaddingBottom]: !isPost
          })}>
            <div className={classes.header}>
              <div className={classes.titleContainer}>
                <Link 
                  to={url}
                  onClick={isPost ? handleContentClick : undefined}
                  className={classes.title}
                >
                  {getSpotlightDisplayTitle(spotlight)}
                </Link>
              </div>
              {(spotlight.showAuthor || spotlight.customSubtitle || post?.contents?.wordCount) && (
                <div className={classes.metaRow}>
                  {spotlight.showAuthor && spotlightDocument?.user && (
                    <Link to={userGetProfileUrlFromSlug(spotlightDocument?.user.slug)}>
                      {spotlightDocument?.user.displayName}
                    </Link>
                  )}
                  {post?.contents?.wordCount && (
                    <span>{post.contents.wordCount} words</span>
                  )}
                  {spotlight.customSubtitle && showSubtitle && 
                    <span className={classes.subtitle}>
                      {subtitleComponent}
                    </span>
                  }
                  {spotlight.customSubtitle && showSubtitle && (
                    <LWTooltip title="This is a featured item">
                      <ForumIcon icon="Star" className={classes.curatedIcon} />
                    </LWTooltip>
                  )}
                </div>
              )}
            </div>
            
            {(spotlight.description?.html || isBookUI) && 
              <div className={classes.descriptionArea}>
                {isPost ? (
                  <div className={classes.descriptionWrapper} onClick={handleContentClick}>
                    <FeedContentBody
                      html={spotlight.description?.html ?? ''}
                      wordCount={descriptionWordCount}
                      initialWordCount={descriptionWordCount}
                      maxWordCount={descriptionWordCount}
                      hideSuffix
                      className={classes.description}
                    />
                  </div>
                ) : (
                  <Link to={url} className={classes.descriptionWrapper}>
                    <FeedContentBody
                      html={spotlight.description?.html ?? ''}
                      wordCount={descriptionWordCount}
                      initialWordCount={descriptionWordCount}
                      maxWordCount={descriptionWordCount}
                      hideSuffix
                      className={classes.description}
                    />
                  </Link>
                )}
              </div>
            }
            {isPost && post && (
              <div className={classes.footer}>
                <UltraFeedItemFooter
                  document={post}
                  collectionName="Posts"
                  metaInfo={{
                    displayStatus: 'expanded',
                    sources: ['spotlights'],
                    lastServed: new Date(),
                    lastViewed: null,
                    lastInteracted: null,
                  }}
                  replyConfig={replyConfig}
                  hideReacts={true}
                />
              </div>
            )}
          </div>
            
          <div className={classNames(
            classes.imageContainer, 
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
        </div>
      </div>
    </div>
    </AnalyticsContext>
  )
}

export default registerComponent('SpotlightFeedItem', SpotlightFeedItem);




