import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import classNames from 'classnames';
import React, { useState } from 'react';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { postBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { getSpotlightUrl } from '../../lib/collections/spotlights/helpers';
import { useLocation } from '../../lib/routeUtil';


export const descriptionStyles = (theme: ThemeType) => ({
  ...postBodyStyles(theme),
  // ...(isBookUI ? theme.typography.body2 : {}),
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

const pageTransitionWidth = 1500

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: SECTION_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
  },
  fullPageDisplay: {
    [`@media(min-width: ${pageTransitionWidth}px)`]: {
      position: "absolute", // or 'absolute' depending on your layout needs
      top: "50vh",
      transform: "translateY(-50%)",
      right: `calc((100vw - ${SECTION_WIDTH + 800}px) / 2)`, // Adjusts right margin based on viewport width
      width: '25vw',
      maxWidth: '425px', // Example max-width, adjust as needed
    },
  },
  listDisplay: {

  },
  spotlightItem: {
    position: "relative",
    borderRadius: theme.borderRadius.default,
    '&:hover $editButtonIcon': {
      opacity: .2
    },
    '&:hover $closeButton': {
      color: theme.palette.grey[100],
    },
    marginBottom: 24,
    [`@media(max-width: ${pageTransitionWidth}px)`]: {
      background: theme.palette.panelBackground.translucent3,
      padding: 16,
      paddingBottom: 12,
      marginTop: 8,
      marginBottom: 12,
    },
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
    color: theme.palette.grey[300],
    zIndex: theme.zIndexes.spotlightItemCloseButton,
  },
  content: {
    // padding: 16,
    paddingRight: 35,
    display: "flex",
    // overflow: "hidden",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    zIndex: theme.zIndexes.spotlightItem,
    // Drop shadow that helps the text stand out from the background image
    textShadow: `
      0px 0px 30px ${theme.palette.background.default},
      0px 0px 50px ${theme.palette.background.default}
    `,
    '& br': {
      [theme.breakpoints.down('sm')]: {
        display: "none"
      }
    }
  },
  description: {
    marginTop: 7,
    marginBottom: 10,
    ...descriptionStyles(theme),
    position: "relative",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
    [`@media(max-width: ${pageTransitionWidth}px)`]: {
      fontSize: "1.2rem"
    },
  },
  title: {
    ...theme.typography.headerStyle,
    fontSize: 24,
    marginBottom: 6,
    ...(isFriendlyUI ?
      {fontWeight: 600} :
      {fontVariant: "small-caps"}
    ),
    lineHeight: "1.2em",
    display: "flex",
    alignItems: "center",
    '& a:hover': {
      opacity: 'unset'
    },
    [`@media(max-width: ${pageTransitionWidth}px)`]: {
      fontSize: 20
    }
  },
  subtitle: {
    ...theme.typography.postStyle,
    fontStyle: "italic",
    color: theme.palette.grey[700],
    // ...theme.typography.italic,
    ...(isFriendlyUI ? {
      fontSize: 13,
      fontFamily: theme.palette.fonts.sansSerifStack,
      marginTop: 8,
    } : {
      fontSize: 15,
      marginTop: -1,
    }),
  },
  startOrContinue: {
    marginTop: isFriendlyUI ? 16 : 4,
  },
  image: {
    height: "100%",
    position: "absolute",
    top: 0,
    right: 0,
    borderTopRightRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
    // TODO these were added to fix an urgent bug, hence the forum gating. Maybe they could be un-gated
    ...(isFriendlyUI && {width: "100%", objectFit: "cover"}),
  },
  imageFade: {
    mask: `linear-gradient(to right, transparent 0, ${theme.palette.text.alwaysWhite} 80%, ${theme.palette.text.alwaysWhite} 100%)`,
    "-webkit-mask-image": `linear-gradient(to right, transparent 0, ${theme.palette.text.alwaysWhite} 80%, ${theme.palette.text.alwaysWhite} 100%)`,
  },
  author: {
    ...theme.typography.postStyle,
    color: theme.palette.primary.main,
    fontSize: "1.2rem",
  },
  contextInfo: {
    ...theme.typography.postStyle,
    color: theme.palette.grey[700],
    fontSize: "1.2rem",
    fontVariant: "small-caps",
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
  editAllButtonIcon: {
    width: 20
  },
  editButtonIcon: {
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
  backgroundImage: {
    position: "absolute",
    top: -74,
    right: -200,
    [`@media(min-width: ${pageTransitionWidth}px)`]: {
      right: -200,
    },
    maxHeight: "100vh",
    width: '70vw',
    '-webkit-mask-image': `radial-gradient(ellipse at center center, ${theme.palette.text.alwaysBlack} 8%, transparent 65%)`,
    zIndex: -1,
    objectFit: "cover",
    [theme.breakpoints.down('sm')]: {
      objectFit: "contain",
      width: '85vw',
    }
  },
  backgroundFade: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100vh",
    backgroundImage: `linear-gradient(to right, #f8f4ee 55%, transparent 90%)`,
    zIndex: theme.zIndexes.spotlightItemBackground,
    [`@media(min-width: ${pageTransitionWidth}px)`]: {
      backgroundImage: `linear-gradient(to bottom, transparent 20%, #f8f4ee 45%)`,
    },
    [theme.breakpoints.down('sm')]: {
      backgroundImage: "none",
    }
  },
  dividerBullet: {
    margin: "0 8px",
    color: theme.palette.grey[500]
  }
});

export const FullPageSpotlight = ({
  spotlight,
  showAdminInfo,
  hideBanner,
  refetchAllSpotlights,
  className,
  classes,
  listDisplay
}: {
  spotlight: SpotlightDisplay,
  showAdminInfo?: boolean,
  hideBanner?: () => void,
  // This is so that if a spotlight's position is updated (in SpotlightsPage), we refetch all of them to display them with their updated positions and in the correct order
  refetchAllSpotlights?: () => void,
  className?: string,
  classes: ClassesType,
  listDisplay?: boolean
}) => {
  const {
    MetaInfo, Row, AnalyticsTracker, ContentItemBody, UsersNameDisplay, LWTooltip,
    WrappedSmartForm, SpotlightEditorStyles, SpotlightStartOrContinueReading, Typography
  } = Components
  
  const currentUser = useCurrentUser()
  const { pathname } = useLocation()

  const [edit, setEdit] = useState<boolean>(false)
  const [editDescription, setEditDescription] = useState<boolean>(false)

  const url = getSpotlightUrl(spotlight);

  const duration = spotlight.duration

  const onUpdate = () => {
    setEdit(false);
    refetchAllSpotlights?.();
  };
  
  return <AnalyticsTracker eventType="spotlightItem" captureOnMount captureOnClick={false}>
    <>
      {spotlight.spotlightSplashImageUrl && <>
        <img src={spotlight.spotlightSplashImageUrl} className={classes.backgroundImage} />
        <div className={classes.backgroundFade} />
      </>}
      <div className={classNames(classes.root, className, {[classes.listDisplay]: listDisplay, [classes.fullPageDisplay]: !listDisplay})} id={spotlight._id}>
        <div className={classes.spotlightItem}>
          <div className={classNames(classes.content)}>
            <div className={classes.title}>
              <Link to={url}>
                <span dangerouslySetInnerHTML={{__html:spotlight.customTitle ?? spotlight.document.title}}/>
              </Link>
              <span className={classes.editDescriptionButton}>
                {showAdminInfo && userCanDo(currentUser, 'spotlights.edit.all') && <LWTooltip title="Edit Spotlight">
                  <EditIcon className={classes.editButtonIcon} onClick={() => setEditDescription(!editDescription)}/>
                </LWTooltip>}
              </span>
            </div>
            {spotlight.customSubtitle && <div className={classes.subtitle}>
              {spotlight.customSubtitle}
            </div>}
            {(spotlight.description?.html || isBookUI) && <div className={classes.description}>
              {editDescription ? 
                <div className={classes.editDescription}>
                  <WrappedSmartForm
                    collectionName="Spotlights"
                    fields={['description']}
                    documentId={spotlight._id}
                    mutationFragment={getFragment('SpotlightEditQueryFragment')}
                    queryFragment={getFragment('SpotlightEditQueryFragment')}
                    successCallback={() => setEditDescription(false)}
                  />
                </div>
                :
                <ContentItemBody
                  dangerouslySetInnerHTML={{__html: spotlight.description?.html ?? ''}}
                  description={`${spotlight.documentType} ${spotlight.document._id}`}
                />
              }
            </div>}
            <Row justifyContent='flex-start'>
              {spotlight.showAuthor && spotlight.document.user &&
                <div className={classes.author}><UsersNameDisplay user={spotlight.document.user} /></div>
              }
              {spotlight.contextInfo && spotlight.showAuthor && <div className={classes.dividerBullet}>•</div>}
              {spotlight.contextInfo && <div className={classes.contextInfo}><div dangerouslySetInnerHTML={{__html: spotlight.contextInfo}} /></div>
              }

            </Row>
            <SpotlightStartOrContinueReading spotlight={spotlight} className={classes.startOrContinue} />
          </div>
          {hideBanner && <div className={classes.closeButtonWrapper}>
            <LWTooltip title="Hide this spotlight" placement="right">
              <Button className={classes.closeButton} onClick={hideBanner}>
                <CloseIcon className={classes.closeIcon} />
              </Button>
            </LWTooltip>
          </div>}
          <div className={classes.editAllButton}>
            {showAdminInfo && userCanDo(currentUser, 'spotlights.edit.all') && <LWTooltip title="Edit Spotlight">
              <MoreVertIcon className={classNames(classes.editButtonIcon, classes.editAllButtonIcon)} onClick={() => setEdit(!edit)}/>
            </LWTooltip>}
          </div>
        </div>
        {showAdminInfo && <>
          {edit ? <div className={classes.form}>
              <SpotlightEditorStyles>
              <WrappedSmartForm
                collectionName="Spotlights"
                documentId={spotlight._id}
                mutationFragment={getFragment('SpotlightEditQueryFragment')}
                queryFragment={getFragment('SpotlightEditQueryFragment')}
                successCallback={onUpdate}
              />
              </SpotlightEditorStyles>
            </div>
            :
            null
            // <div className={classes.metaData}>
            //   {spotlight.draft && <MetaInfo>[Draft]</MetaInfo>}
            //   <MetaInfo>{spotlight.position}</MetaInfo>
            //   <MetaInfo><FormatDate date={spotlight.lastPromotedAt} format="YYYY-MM-DD"/></MetaInfo>
            //   <LWTooltip title={`This will be on the frontpage for ${duration} days when it rotates in`}>
            //     <MetaInfo>{duration} days</MetaInfo>
            //   </LWTooltip>
            // </div>
          }
        </>}
      </div>
    </>
  </AnalyticsTracker>
}

const FullPageSpotlightComponent = registerComponent('FullPageSpotlight', FullPageSpotlight, {styles});

declare global {
  interface ComponentTypes {
    FullPageSpotlight: typeof FullPageSpotlightComponent
  }
}
