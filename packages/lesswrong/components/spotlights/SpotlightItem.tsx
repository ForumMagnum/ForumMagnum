import Button from '@/lib/vendor/@material-ui/core/src/Button';
import EditIcon from '@/lib/vendor/@material-ui/icons/src/Edit';
import PublishIcon from '@/lib/vendor/@material-ui/icons/src/Publish';
import MoreVertIcon from '@/lib/vendor/@material-ui/icons/src/MoreVert';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import classNames from 'classnames';
import React, { CSSProperties, useCallback, useState } from 'react';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { postBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { getSpotlightUrl } from '../../lib/collections/spotlights/helpers';
import { useUpdate } from '../../lib/crud/withUpdate';
import { usePublishAndDeDuplicateSpotlight } from './withPublishAndDeDuplicateSpotlight';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useSingle } from '@/lib/crud/withSingle';
import { SpotlightForm } from './SpotlightForm';
import MetaInfo from "../common/MetaInfo";
import FormatDate from "../common/FormatDate";
import AnalyticsTracker from "../common/AnalyticsTracker";
import ContentItemBody from "../common/ContentItemBody";
import CloudinaryImage2 from "../common/CloudinaryImage2";
import SpotlightEditorStyles from "./SpotlightEditorStyles";
import SpotlightStartOrContinueReading from "./SpotlightStartOrContinueReading";
import { Typography } from "../common/Typography";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import CommentsNodeInner from "../comments/CommentsNode";
import { getClassName } from '../hooks/useStyles';
import { type commentFrameStyles } from '../comments/CommentFrame';
import { type commentsItemStyles } from '../comments/CommentsItem/CommentsItem';

const TEXT_WIDTH = 350;

export const descriptionStyles = (theme: ThemeType) => ({
  ...postBodyStyles(theme),
  ...(isBookUI ? theme.typography.body2 : {}),
  lineHeight: '1.65rem',
  '& p': {
    marginTop: ".5em",
    marginBottom: ".5em",
    '&:first-child': {
      marginTop: 0,
    },
    'style~&': {
      marginTop: 0,
    },
    '&:last-child': {
      marginBottom: 0,
    }
  },
})

const buildFadeMask = (breakpoints: string[]) => {
  const mask = `linear-gradient(to right, ${breakpoints.join(",")})`;
  return {mask, "-webkit-mask-image": mask};
}

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 12,
    boxShadow: theme.palette.boxShadow.default,
    maxWidth: SECTION_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
    [theme.breakpoints.up('md')]: {
      width: SECTION_WIDTH // TODO: replace this hacky solution with a more comprehensive refactoring of SingleColumnSection.
      // (SingleColumnLayout should probably be replaced by grid-css in Layout.tsx)
    }
  },
  spotlightItem: {
    position: "relative",
    borderRadius: theme.borderRadius.default,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    },
    '&:hover $adminButtonIcon': {
      opacity: .2
    },
    '&:hover $closeButton': {
      ...(isFriendlyUI ? {
        color: theme.palette.grey[100],
        background: theme.palette.panelBackground.default,
      } : {
        // This button is on top of an image that doesn't invert in dark mode, so
        // we can't use palette-colors that invert
        color: theme.palette.type==="dark" ? "rgba(0,0,0,.7)" : theme.palette.grey[400],
        background: theme.palette.type==="dark" ? "white" : theme.palette.panelBackground.default,
      }),
    }
  },
  contentContainer: {
    position: "relative",
    background: theme.palette.panelBackground.default,
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
    padding: 16,
    paddingRight: 35,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 150,
    position: "relative",
    zIndex: theme.zIndexes.spotlightItem,
    // Drop shadow that helps the text stand out from the background image
    textShadow: isFriendlyUI ? undefined : `
      0px 0px 10px ${theme.palette.background.default},
      0px 0px 20px ${theme.palette.background.default}
    `,
    [theme.breakpoints.up('sm')]: {
      minHeight: 100
    },
    [theme.breakpoints.down('xs')]: {
      marginRight: 50
    },
    '& br': {
      [theme.breakpoints.down('sm')]: {
        display: "none"
      }
    }
  },
  postPadding: {
    paddingBottom: 12
  },
  description: {
    marginTop: 7,
    marginBottom: 10,
    ...descriptionStyles(theme),
    position: "relative",
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
    ...(isFriendlyUI ? {
      fontSize: 13,
      fontWeight: 500,
      fontFamily: theme.palette.fonts.sansSerifStack,
      color: theme.palette.text.alwaysWhite,
      marginTop: 8,
      maxWidth: TEXT_WIDTH,
      "& a": {
        color: theme.palette.text.alwaysWhite,
        textDecoration: "underline",
        "&:hover": {
          opacity: 0.8,
          color: `${theme.palette.text.alwaysWhite} !important`,
        },
        "&:visited": {
          color: theme.palette.text.alwaysWhite,
        },
      },
    } : {}),
  },
  title: {
    ...theme.typography.postStyle,
    ...(isFriendlyUI
      ? {
        fontSize: 22,
        fontWeight: 700,
        color: theme.palette.text.alwaysWhite,
      }
      : {
        fontSize: 20,
        fontVariant: "small-caps",
        lineHeight: "1.2em",
      }
    ),
    display: "flex",
    alignItems: "center"
  },
  subtitle: {
    ...theme.typography.postStyle,
    ...theme.typography.italic,
    ...(isFriendlyUI ? {
      fontSize: 13,
      fontWeight: 500,
      fontFamily: theme.palette.fonts.sansSerifStack,
      color: theme.palette.text.alwaysWhite,
      marginTop: 8,
      maxWidth: TEXT_WIDTH,
    } : {
      color: theme.palette.grey[700],
      fontSize: 15,
      marginTop: -1,
    }),
  },
  startOrContinue: isFriendlyUI
    ? {
      marginTop: 0,
      [theme.breakpoints.down("xs")]: {
        marginTop: 8,
      },
    }
    : {
      marginTop: 4,
    },
  image: {
    height: "100%",
    position: "absolute",
    top: 0,
    right: 0,
    ...(isFriendlyUI
      ? {
          borderRadius: theme.borderRadius.default,
          width: "100%",
          objectFit: "cover",
        }
      : {
          borderTopRightRadius: theme.borderRadius.default,
          borderBottomRightRadius: theme.borderRadius.default,
        }),
  },
  imageFade: buildFadeMask([
    "transparent 0",
    `${theme.palette.text.alwaysWhite} 80%`,
    `${theme.palette.text.alwaysWhite} 100%`,
  ]),
  imageFadeCustom: buildFadeMask([
    "transparent 0",
    "transparent 30%",
    `${theme.palette.text.alwaysWhite} 90%`,
    `${theme.palette.text.alwaysWhite} 100%`,
  ]),
  author: {
    marginTop: 4,
    color: theme.palette.grey[600],
  },
  authorName: {
    color: theme.palette.primary.main,
  },
  editAllButton: {
    [theme.breakpoints.up('md')]: {
      position: "absolute",
      top: 6,
      right: -28,
    },
    [theme.breakpoints.down('sm')]: {
      position: "absolute",
      top: 4,
      right: 8
    },
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
  adminButtonIcon: {
    width: 18,
    opacity: 0,
    cursor: "pointer",
    zIndex: theme.zIndexes.spotlightItemCloseButton,
    [theme.breakpoints.down('sm')]: {
      color: theme.palette.background.pageActiveAreaBackground,
      width: 16,
      opacity:.2
    },
    '&:hover': {
      opacity: .5
    }
  },
  editDescriptionButton: {
    marginLeft: 8
  },
  editDescription: {
    '& .form-input': {
      margin: 0
    },
    '& .EditorFormComponent-commentEditorHeight': {
      minHeight: "unset"
    },
    '& .EditorFormComponent-commentEditorHeight .ck.ck-content': {
      minHeight: "unset"
    },
    '& .ck.ck-content.ck-editor__editable': {
      ...descriptionStyles(theme) 
    },
    '& .EditorFormComponent-ckEditorStyles .ck.ck-content': {
      marginLeft: 0,
    },
    '& .ck.ck-editor__editable_inline': {
      padding: 0,
      border: "none !important",
    },
    '& .form-submit button': {
      position: "absolute",
      bottom: -38,
      right: 0,
      marginLeft: 12
    }
  },
  form: {
    borderTop: theme.palette.border.faint,
    background: theme.palette.background.translucentBackground,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8
  },
  metaData: {
    textAlign: "right",
    paddingTop: 6,
    paddingBottom: 12
  },
  splashImage: {
    transform: "translateX(13%) scale(1.15)", // splash images aren't quite designed for this context and need this adjustment. Scale 1.15 to deal with a few random images that had weird whitespace.
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
  reviews: {
    width: "100%",
    maxWidth: SECTION_WIDTH,
    borderTop: theme.palette.border.extraFaint,
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down('xs')]: {
      display: "none",
    }
  },
  review: {
    [`&& ${getClassName<typeof commentFrameStyles>("CommentFrame", "node")}`]: {
      border: "none",
      margin: 0,
    },
    '& .SingleLineComment-commentInfo': {
      paddingLeft: 13,
      backgroundColor: theme.palette.background.translucentBackgroundHeavy,
      borderRadius: 0
    },
    [`& .${getClassName<typeof commentsItemStyles>("CommentsItem", "root")}`]: {
      borderBottom: theme.palette.border.extraFaint,
      backgroundColor: theme.palette.background.pageActiveAreaBackground,
      '&:last-child': {
        borderTop: theme.palette.border.extraFaint,
      }
    },
    [`& .${getClassName<typeof commentFrameStyles>("CommentFrame", "commentsNodeRoot")}`]: {
      backgroundColor: 'unset',
    },
  }
});

export function getSpotlightDisplayTitle(spotlight: SpotlightDisplay): string {
  const { customTitle, post, sequence, tag } = spotlight;
  if (customTitle) return customTitle;

  if (post) return post.title;
  if (sequence) return sequence.title;
  if (tag) return tag.name;

  // We should never reach this
  return "";
}

function getSpotlightDisplayReviews(spotlight: SpotlightDisplay) {
  if (spotlight.post) {
    return spotlight.post.reviews;
  }
  return [];
}

export const SpotlightItem = ({
  spotlight,
  showAdminInfo,
  hideBanner,
  showSubtitle=true,
  refetchAllSpotlights,
  isDraftProcessing,
  className,
  classes,
  children,
}: {
  spotlight: SpotlightDisplay,
  showAdminInfo?: boolean,
  hideBanner?: () => void,
  showSubtitle?: boolean,
  // This is so that if a spotlight's position is updated (in SpotlightsPage), we refetch all of them to display them with their updated positions and in the correct order
  refetchAllSpotlights?: () => void,
  isDraftProcessing?: boolean,
  className?: string,
  classes: ClassesType<typeof styles>,
  children?: React.ReactNode,
}) => {
  const currentUser = useCurrentUser()

  const [edit, setEdit] = useState<boolean>(false)
  const [editDescription, setEditDescription] = useState<boolean>(false)

  const url = getSpotlightUrl(spotlight);

  const duration = spotlight.duration

  const onUpdate = useCallback(() => {
    setEdit(false);
    refetchAllSpotlights?.();
  }, [refetchAllSpotlights]);

  const { document: editableSpotlight } = useSingle({
    collectionName: "Spotlights",
    fragmentName: "SpotlightEditQueryFragment",
    documentId: spotlight._id,
    skip: !(edit || editDescription),
  });

  const { mutate: updateSpotlight } = useUpdate({
    collectionName: "Spotlights",
    fragmentName: "SpotlightDisplay",
  });

  const { publishAndDeDuplicateSpotlight } = usePublishAndDeDuplicateSpotlight({
    fragmentName: "SpotlightDisplay",
  });

  const toggleDraft = useCallback(async () => {
    if (!currentUser || !userCanDo(currentUser, 'spotlights.edit.all')) {
      return;
    }
    if (!spotlight.draft) {
      await updateSpotlight({
        selector: { _id: spotlight._id },
        data: { draft: !spotlight.draft }
      });
    } else {
      await publishAndDeDuplicateSpotlight({spotlightId: spotlight._id})
    }
    refetchAllSpotlights?.();
  }, [currentUser, spotlight._id, spotlight.draft, updateSpotlight, publishAndDeDuplicateSpotlight, refetchAllSpotlights]);

  const handleUndraftSpotlight = async () => {
    if (isDraftProcessing && spotlight.draft) {
      await publishAndDeDuplicateSpotlight({spotlightId: spotlight._id})
      refetchAllSpotlights?.()
    }
  }

  const deleteDraft = useCallback(async () => {
    if (!currentUser || !userCanDo(currentUser, 'spotlights.edit.all')) {
      return;
    }
    await updateSpotlight({
      selector: { _id: spotlight._id },
      data: { deletedDraft: true }
    });
    refetchAllSpotlights?.();
  }, [currentUser, spotlight._id, refetchAllSpotlights, updateSpotlight]);

  // Define fade color with a CSS variable to be accessed in the styles
  const style = {
    "--spotlight-fade": spotlight.imageFadeColor,
  } as CSSProperties;
  const subtitleComponent = spotlight.subtitleUrl ? <Link to={spotlight.subtitleUrl}>{spotlight.customSubtitle}</Link> : spotlight.customSubtitle

  const spotlightDocument = spotlight.post ?? spotlight.sequence ?? spotlight.tag;
  const spotlightReviews = getSpotlightDisplayReviews(spotlight);

  return <AnalyticsContext pageElementContext="spotlightItem">
      <AnalyticsTracker eventType="spotlightItem" captureOnMount captureOnClick={false}>
        <div
          id={spotlight._id}
          style={style}
          className={classNames(classes.root, className)}
      >
        <div className={classNames(classes.spotlightItem, {
          [classes.spotlightFadeBackground]: !!spotlight.imageFadeColor,
        })}>
          <div className={classes.contentContainer}>
            <div className={classNames(classes.content, {[classes.postPadding]: spotlight.documentType === "Post"})}>
              <div className={classes.title}>
                <Link to={url}>
                  {getSpotlightDisplayTitle(spotlight)}
                </Link>
                <span className={classes.editDescriptionButton}>
                  {showAdminInfo && userCanDo(currentUser, 'spotlights.edit.all') && <LWTooltip title="Edit Spotlight">
                    <EditIcon className={classes.adminButtonIcon} onClick={() => setEditDescription(!editDescription)}/>
                  </LWTooltip>}
                </span>
              </div>
              {spotlight.customSubtitle && showSubtitle && <div className={classes.subtitle}>
                {subtitleComponent}
              </div>}
              {(spotlight.description?.html || isBookUI) && <div className={classes.description}>
                {(editDescription && editableSpotlight) ? 
                  <div className={classes.editDescription}>
                    <SpotlightForm
                      initialData={editableSpotlight}
                      descriptionOnly
                      onSuccess={() => { setEditDescription(false); void handleUndraftSpotlight() }}
                    />
                  </div>
                  :
                  <ContentItemBody
                    dangerouslySetInnerHTML={{__html: spotlight.description?.html ?? ''}}
                    description={`${spotlight.documentType} ${spotlightDocument?._id}`}
                  />
                }
              </div>}
              {spotlight.showAuthor && spotlightDocument?.user && <Typography variant='body2' className={classes.author}>
                by <Link className={classes.authorName} to={userGetProfileUrlFromSlug(spotlightDocument?.user.slug)}>{spotlightDocument?.user.displayName}</Link>
              </Typography>}
              <SpotlightStartOrContinueReading spotlight={spotlight} className={classes.startOrContinue} />
            </div>
            {/* note: if the height of SingleLineComment ends up changing, this will need to be updated */}
            {spotlight.spotlightSplashImageUrl && <div className={classes.splashImageContainer} style={{height: `calc(100% + ${(spotlightReviews.length ?? 0) * 30}px)`}}>
              <img src={spotlight.spotlightSplashImageUrl} className={classNames(classes.image, classes.imageFade, classes.splashImage)}/>
            </div>}
            {spotlight.spotlightImageId && <CloudinaryImage2
              publicId={spotlight.spotlightImageId}
              darkPublicId={spotlight.spotlightDarkImageId}
              className={classNames(classes.image, {
                [classes.imageFade]: spotlight.imageFade && !spotlight.imageFadeColor,
                [classes.imageFadeCustom]: spotlight.imageFade && spotlight.imageFadeColor,
              })}
              imgProps={{w: "500"}}
              loading="lazy"
            />}
          </div>
          <div className={classes.reviews}>
            {spotlightReviews.map(review => <div key={review._id} className={classes.review}>
              <CommentsNodeInner comment={review} treeOptions={{
                singleLineCollapse: true,
                forceSingleLine: true,
                hideSingleLineMeta: true,
                post: spotlight.post ?? undefined,
              }} nestingLevel={1}/>
            </div>)}
          </div>
          {hideBanner && (
            isFriendlyUI
              ? (
                <ForumIcon
                  icon="Close"
                  onClick={hideBanner}
                  className={classes.hideButton}
                />
              )
              : (
                <div className={classes.closeButtonWrapper}>
                  <LWTooltip title="Hide this spotlight" placement="right">
                    <Button className={classes.closeButton} onClick={hideBanner}>
                      <ForumIcon icon="Close" />
                    </Button>
                  </LWTooltip>
                </div>
              )
            )
          }
          <div className={classes.editAllButton}>
            {userCanDo(currentUser, 'spotlights.edit.all') && <LWTooltip title="Edit Spotlight">
              <MoreVertIcon className={classNames(classes.adminButtonIcon, classes.editAllButtonIcon)} onClick={() => setEdit(!edit)}/>
            </LWTooltip>}
          </div>
          <div className={classes.draftButton}>
            {showAdminInfo && userCanDo(currentUser, 'spotlights.edit.all') && 
              <LWTooltip title={spotlight.draft ? "Undraft, and archive duplicates" : "Draft"}>
                <PublishIcon className={classNames(classes.adminButtonIcon, classes.editAllButtonIcon, 
                  !spotlight.draft && classes.reverseIcon)} onClick={() => toggleDraft()}/>
              </LWTooltip>
            }
          </div>
          {spotlight.draft && <div className={classes.deleteButton}>
            {showAdminInfo && userCanDo(currentUser, 'spotlights.edit.all') && <LWTooltip title="Archive">
              <CloseIcon className={classNames(classes.adminButtonIcon, classes.editAllButtonIcon)} onClick={() => deleteDraft()}/>
            </LWTooltip>}
          </div>}
        </div>
        {(edit && editableSpotlight) && <div className={classes.form}>
              <SpotlightEditorStyles>
              <SpotlightForm
                initialData={editableSpotlight}
                onSuccess={onUpdate}
              />
              </SpotlightEditorStyles>
            </div>
        }
        {!edit && showAdminInfo &&  <div className={classes.metaData}>
              {spotlight.draft && <MetaInfo>[Draft]</MetaInfo>}
              <MetaInfo>{spotlight.position}</MetaInfo>
              <MetaInfo><FormatDate date={spotlight.lastPromotedAt} format="YYYY-MM-DD"/></MetaInfo>
              <LWTooltip title={`This will be on the frontpage for ${duration} days when it rotates in`}>
                <MetaInfo>{duration} days</MetaInfo>
              </LWTooltip>
            </div>
        }
      </div>
    </AnalyticsTracker>
  </AnalyticsContext>
}

export default registerComponent('SpotlightItem', SpotlightItem, {
  styles,
  stylePriority: -1,
});


