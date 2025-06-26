import classNames from 'classnames';
import React, { CSSProperties, useCallback, useState, useRef, useEffect } from 'react';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { getSpotlightUrl } from '../../lib/collections/spotlights/helpers';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useStyles, defineStyles } from '../hooks/useStyles';
import { descriptionStyles, getSpotlightDisplayTitle } from './SpotlightItem';
import { useUltraFeedObserver } from '../../components/ultraFeed/UltraFeedObserver';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { ContentItemBody } from "../contents/ContentItemBody";
import CloudinaryImage2 from "../common/CloudinaryImage2";
import { Typography } from "../common/Typography";
import StarIcon from "@/lib/vendor/@material-ui/icons/src/Star";
import LWTooltip from "../common/LWTooltip";

const buildVerticalFadeMask = (breakpoints: string[]) => {
  const mask = `linear-gradient(to bottom, ${breakpoints.join(",")})`;
  return {mask, "-webkit-mask-image": mask};
}

const useSpotlightFeedItemStyles = defineStyles(
  "SpotlightFeedItem",
  (theme: ThemeType) => ({
    root: {
      background: theme.palette.panelBackground.default,
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 16,
      paddingRight: 16,
      maxWidth: SECTION_WIDTH,
      marginLeft: "auto",
      marginRight: "auto",
      [theme.breakpoints.up("md")]: {
        width: SECTION_WIDTH,
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
    },
    spotlightFadeBackground: {
      background: "var(--spotlight-fade)",
    },
    closeButtonWrapper: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
    closeButton: {
      padding: '.5em',
      minHeight: '.75em',
      minWidth: '.75em',
      color: isFriendlyUI ? theme.palette.text.alwaysWhite : theme.palette.grey[300],
      zIndex: theme.zIndexes.spotlightItemCloseButton,
    },
    hideButton: {
      cursor: "pointer",
      position: "absolute",
      top: 12,
      right: 12,
      width: 20,
      height: 20,
      color: theme.palette.text.alwaysWhite,
      "&:hover": {
        opacity: 0.8,
      },
    },
    content: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      position: "relative",
      zIndex: 2,
    },
    titleArea: {
      marginBottom: 15,
      zIndex: 3,
    },
    title: {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: "1.6rem",
      opacity: 0.8,
      fontWeight: 600,
      lineHeight: 1.1,
      display: "flex",
      alignItems: "center",
      marginBottom: 8,
      textWrap: 'balance',
    },
    starIcon: {
      width: 20,
      height: 20,
      marginRight: 8,
      color: theme.palette.grey[800],
      opacity: 1,
      position: 'relative',
      top: 3,
    },
    subtitle: {
      ...theme.typography.postStyle,
      ...theme.typography.italic,
      color: theme.palette.grey[700],
      fontSize: "1.1rem",
      marginTop: -1,
    },
    imageContainer: {
      margin: "-20px -16px -20px -16px",
      position: "relative",
      zIndex: 1,
      alignSelf: "stretch",
      display: "flex",
      justifyContent: "flex-end",
    },
    imageContainerWithAuthor: {
      marginTop: -20,
    },
    image: {
      maxWidth: "100%",
      height: "auto",
      objectFit: "cover",
      objectPosition: "right center",
      maxHeight: 250,
      borderRadius: `${theme.borderRadius.default}px 0 0 ${theme.borderRadius.default}px`,
    },
    imageVerticalFade: buildVerticalFadeMask([
      "transparent 0",
      `${theme.palette.text.alwaysWhite} 20%`,
      `${theme.palette.text.alwaysWhite} 80%`,
      "transparent 100%",
    ]),
    descriptionArea: {
      marginTop: 5,
      zIndex: 3,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    description: {
      ...descriptionStyles(theme),
      fontSize: "1.3rem",
      opacity: 0.9,
    },
    postPadding: {
      paddingBottom: 12
    },
    author: {
      // marginTop: 4,
      color: theme.palette.grey[600],
      marginBottom: 4,
    },
    authorName: {
      color: theme.palette.primary.main,
    },
    draftButton: {
      [theme.breakpoints.up('md')]: {
        position: "absolute",
        top: 35,
        right: -28,
      },
      [theme.breakpoints.down('sm')]: {
        position: "absolute",
        top: 33,
        right: 8
      },
    },
    deleteButton: {
      [theme.breakpoints.up('md')]: {
        position: "absolute",
        bottom: 0,
        right: -28,
      },
      [theme.breakpoints.down('sm')]: {
        position: "absolute",
        bottom: 0,
        right: 8
      },
    },
    editAllButtonIcon: {
      width: 20
    },
    metaData: {
      textAlign: "right",
      paddingTop: 6,
      paddingBottom: 12
    },
    splashImage: {
      filter: "brightness(1.2)",
    },
    splashImageContainer: {
      position: "absolute",
      top: 0,
      right: 0,
      width: "100%",
      height: "100%",
      overflow: "hidden",
      [theme.breakpoints.down('xs')]: {
        height: "100% !important",
      }
    },
    reverseIcon: {
      transform: "rotate(180deg)",
    },
  }),
  { stylePriority: -1 }
);

const SpotlightFeedItem = ({
  spotlight,
  index,
  showSubtitle=true,
  className,
}: {
  spotlight: SpotlightDisplay,
  index: number,
  showSubtitle?: boolean,
  className?: string,
}) => {
  const classes = useStyles(useSpotlightFeedItemStyles);
  const { observe } = useUltraFeedObserver();
  const elementRef = useRef<HTMLDivElement | null>(null);

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

  const style = {
    "--spotlight-fade": spotlight.imageFadeColor,
  } as CSSProperties;
  const subtitleComponent = spotlight.subtitleUrl ? <Link to={spotlight.subtitleUrl}>{spotlight.customSubtitle}</Link> : spotlight.customSubtitle

  const spotlightDocument = spotlight.post ?? spotlight.sequence ?? spotlight.tag;

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
          <div className={classes.content}>
            <div className={classes.titleArea}>
              <div className={classes.title}>
                <LWTooltip title="This is a featured item" placement="top">
                  <StarIcon className={classes.starIcon} />
                </LWTooltip>
                <Link to={url}>
                  {getSpotlightDisplayTitle(spotlight)}
                </Link>
              </div>
              {spotlight.showAuthor && spotlightDocument?.user && 
                <Typography variant='body2' className={classes.author}>
                  by <Link className={classes.authorName} to={userGetProfileUrlFromSlug(spotlightDocument?.user.slug)}>
                    {spotlightDocument?.user.displayName}
                  </Link>
                </Typography>
              }
              {spotlight.customSubtitle && showSubtitle && 
                <div className={classes.subtitle}>
                  {subtitleComponent}
                </div>
              }
            </div>
            
            <div className={classNames(
              classes.imageContainer, 
              {[classes.imageContainerWithAuthor]: spotlight.showAuthor && spotlightDocument?.user}
            )}>
              {spotlight.spotlightSplashImageUrl && 
                <img 
                  src={spotlight.spotlightSplashImageUrl} 
                  className={classNames(classes.image, classes.imageVerticalFade, classes.splashImage)}
                />
              }
              {spotlight.spotlightImageId && 
                <CloudinaryImage2
                  publicId={spotlight.spotlightImageId}
                  darkPublicId={spotlight.spotlightDarkImageId}
                  className={classNames(classes.image, classes.imageVerticalFade)}
                  imgProps={{w: "800"}}
                  loading="lazy"
                />
              }
            </div>
            
            <div className={classes.descriptionArea}>
              {(spotlight.description?.html || isBookUI) && 
                <div className={classes.description}>
                  <ContentItemBody
                    dangerouslySetInnerHTML={{__html: spotlight.description?.html ?? ''}}
                    description={`${spotlight.documentType} ${spotlightDocument?._id}`}
                  />
                </div>
              }
              
            </div>
          </div>
        </div>
      </div>
    </div>
    </AnalyticsContext>
  )
}

export default registerComponent('SpotlightFeedItem', SpotlightFeedItem);




