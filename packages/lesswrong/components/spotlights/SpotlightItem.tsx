import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import classNames from 'classnames';
import React, { useState } from 'react';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { isEAForum, isLWorAF } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { postBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { getSpotlightUrl } from '../../lib/collections/spotlights/helpers';


export const descriptionStyles = (theme: JssStyles) => ({
  ...postBodyStyles(theme),
  ...(!isEAForum ? theme.typography.body2 : {}),
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

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 12,
    boxShadow: theme.palette.boxShadow.default,
    // TODO these were added to fix an urgent bug, hence the forum gating. Maybe they could be un-gated
    ...(isEAForum && {
      maxWidth: SECTION_WIDTH,
      marginLeft: "auto",
      marginRight: "auto",
      [theme.breakpoints.up('md')]: {
        width: SECTION_WIDTH // TODO: replace this hacky solution with a more comprehensive refactoring of SingleColumnSection.
        // (SingleColumnLayout should probably be replaced by grid-css in Layout.tsx)
      }
    })
  },
  spotlightItem: {
    position: "relative",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    },
    '&:hover $editButtonIcon': {
      opacity: .2
    },
    '&:hover $closeButton': {
      color: theme.palette.grey[100],
    }
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
    padding: 16,
    paddingRight: 35,
    display: "flex",
    // overflow: "hidden",
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 150,
    position: "relative",
    zIndex: theme.zIndexes.spotlightItem,
    // Drop shadow that helps the text stand out from the background image
    textShadow: `
      0px 0px 10px ${theme.palette.background.default},
      0px 0px 20px ${theme.palette.background.default}
    `,
    [theme.breakpoints.up('sm')]: {
      minHeight: 100
    },
    [theme.breakpoints.down('xs')]: {
      marginRight: 100
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
    ...(isEAForum ? {
      fontSize: 13,
      fontFamily: theme.palette.fonts.sansSerifStack,
      color: theme.palette.grey[700],
      marginTop: 8,
    } : {}),
  },
  title: {
    ...theme.typography.headerStyle,
    fontSize: 20,
    ...(isEAForum ?
      {fontWeight: 600} :
      {fontVariant: "small-caps"}
    ),
    lineHeight: "1.2em",
    display: "flex",
    alignItems: "center"
  },
  subtitle: {
    ...theme.typography.postStyle,
    color: theme.palette.grey[700],
    ...theme.typography.italic,
    ...(isEAForum ? {
      fontSize: 13,
      fontFamily: theme.palette.fonts.sansSerifStack,
      marginTop: 8,
    } : {
      fontSize: 15,
      marginTop: -1,
    }),
  },
  startOrContinue: {
    marginTop: isEAForum ? 16 : 4,
  },
  image: {
    height: "100%",
    position: "absolute",
    top: 0,
    right: 0,
    borderTopRightRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
    // TODO these were added to fix an urgent bug, hence the forum gating. Maybe they could be un-gated
    ...(isEAForum && {width: "100%", objectFit: "cover"}),
  },
  imageFade: {
    mask: "linear-gradient(to right, transparent 0,rgb(255, 255, 255) 80%,#fff 100%)",
    "-webkit-mask-image": "linear-gradient(to right, transparent 0,rgb(255, 255, 255) 80%,#fff 100%)",
  },
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
  }
});

export const SpotlightItem = ({
  spotlight,
  showAdminInfo,
  hideBanner,
  refetchAllSpotlights,
  className,
  classes,
}: {
  spotlight: SpotlightDisplay,
  showAdminInfo?: boolean,
  hideBanner?: () => void,
  // This is so that if a spotlight's position is updated (in SpotlightsPage), we refetch all of them to display them with their updated positions and in the correct order
  refetchAllSpotlights?: () => void,
  className?: string,
  classes: ClassesType,
}) => {
  const {
    MetaInfo, FormatDate, AnalyticsTracker, ContentItemBody, CloudinaryImage2, LWTooltip,
    WrappedSmartForm, SpotlightEditorStyles, SpotlightStartOrContinueReading, Typography
  } = Components
  
  const currentUser = useCurrentUser()

  const [edit, setEdit] = useState<boolean>(false)
  const [editDescription, setEditDescription] = useState<boolean>(false)

  const url = getSpotlightUrl(spotlight);

  const duration = spotlight.duration

  const onUpdate = () => {
    setEdit(false);
    refetchAllSpotlights?.();
  };
  
  return <AnalyticsTracker eventType="spotlightItem" captureOnMount captureOnClick={false}>
    <div className={classNames(classes.root, className)} id={spotlight._id}>
      <div className={classes.spotlightItem}>
        <div className={classNames(classes.content, {[classes.postPadding]: spotlight.documentType === "Post"})}>
          <div className={classes.title}>
            <Link to={url}>
              {spotlight.customTitle ?? spotlight.document.title}
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
          {(spotlight.description?.html || isLWorAF) && <div className={classes.description}>
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
          {spotlight.showAuthor && spotlight.document.user && <Typography variant='body2' className={classes.author}>
            by <Link className={classes.authorName} to={userGetProfileUrlFromSlug(spotlight.document.user.slug)}>{spotlight.document.user.displayName}</Link>
          </Typography>}
          <SpotlightStartOrContinueReading spotlight={spotlight} className={classes.startOrContinue} />
        </div>
        {spotlight.spotlightImageId && <CloudinaryImage2
          publicId={spotlight.spotlightImageId}
          darkPublicId={spotlight.spotlightDarkImageId}
          className={classNames(classes.image, {
            [classes.imageFade]: spotlight.imageFade,
          })}
        />}
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
          <div className={classes.metaData}>
            {spotlight.draft && <MetaInfo>[Draft]</MetaInfo>}
            <MetaInfo>{spotlight.position}</MetaInfo>
            <MetaInfo><FormatDate date={spotlight.lastPromotedAt} format="YYYY-MM-DD"/></MetaInfo>
            <LWTooltip title={`This will be on the frontpage for ${duration} days when it rotates in`}>
              <MetaInfo>{duration} days</MetaInfo>
            </LWTooltip>
          </div>
        }
      </>}
    </div>
  </AnalyticsTracker>
}

const SpotlightItemComponent = registerComponent('SpotlightItem', SpotlightItem, {
  styles,
  stylePriority: -1,
});

declare global {
  interface ComponentTypes {
    SpotlightItem: typeof SpotlightItemComponent
  }
}
