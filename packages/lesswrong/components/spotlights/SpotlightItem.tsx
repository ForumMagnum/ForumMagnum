import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import classNames from 'classnames';
import React, { useState } from 'react';
import Spotlights from '../../lib/collections/spotlights/collection';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { isEAForum } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { postBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';


export const descriptionStyles = (theme: JssStyles) => ({
  ...postBodyStyles(theme),
  ...(!isEAForum ? theme.typography.body2 : {}),
  textShadow: `0 0 16px ${theme.palette.grey[0]}, 0 0 16px ${theme.palette.grey[0]}, 0 0 16px ${theme.palette.grey[0]}, 0 0 32px ${theme.palette.grey[0]}, 0 0 32px ${theme.palette.grey[0]}, 0 0 32px ${theme.palette.grey[0]}, 0 0 64px ${theme.palette.grey[0]}, 0 0 64px ${theme.palette.grey[0]}, 0 0 64px ${theme.palette.grey[0]}`,
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
    }
  },
  title: {
    ...theme.typography.headerStyle,
    fontSize: 20,
    ...(isEAForum ?
      {fontFamily: theme.typography.postStyle.fontFamily /* serifStack */} :
      {fontVariant: "small-caps"}
    ),
    lineHeight: "1.2em",
    display: "flex",
    alignItems: "center"
  },
  subtitle: {
    ...theme.typography.postStyle,
    fontSize: 15,
    color: theme.palette.grey[700],
    marginTop: -1,
    ...theme.typography.italic,
  },
  image: {
    '& img': {
      position: "absolute",
      top: 0,
      right: 0,
      height: "100%",
      borderTopRightRadius: theme.borderRadius.default,
      borderBottomRightRadius: theme.borderRadius.default,
    }
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

const getUrlFromDocument = (document: SpotlightDisplay_document, documentType: SpotlightDocumentType) => {
  switch (documentType) {
    case "Sequence":
      return `/s/${document._id}`;
    case "Post":
      return `/posts/${document._id}/${document.slug}`
  }
}


export const SpotlightItem = ({classes, spotlight, showAdminInfo, hideBanner, refetchAllSpotlights}: {
  spotlight: SpotlightDisplay,
  showAdminInfo?: boolean,
  hideBanner?: () => void,
  classes: ClassesType,
  // This is so that if a spotlight's position is updated (in SpotlightsPage), we refetch all of them to display them with their updated positions and in the correct order
  refetchAllSpotlights?: () => void,
}) => {
  const {
    MetaInfo, FormatDate, AnalyticsTracker, ContentItemBody, CloudinaryImage2, LWTooltip,
    WrappedSmartForm, SpotlightEditorStyles, SpotlightStartOrContinueReading, Typography
  } = Components
  
  const currentUser = useCurrentUser()

  const [edit, setEdit] = useState<boolean>(false)
  const [editDescription, setEditDescription] = useState<boolean>(false)

  const url = getUrlFromDocument(spotlight.document, spotlight.documentType)


  const duration = spotlight.duration

  const onUpdate = () => {
    setEdit(false);
    refetchAllSpotlights?.();
  };

  return <AnalyticsTracker eventType="spotlightItem" captureOnMount captureOnClick={false}>
    <div className={classes.root} id={spotlight._id}>
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
          <div className={classes.description}>
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
          </div>
          {spotlight.showAuthor && spotlight.document.user && <Typography variant='body2' className={classes.author}>
            by <Link className={classes.authorName} to={userGetProfileUrlFromSlug(spotlight.document.user.slug)}>{spotlight.document.user.displayName}</Link>
          </Typography>}
          <SpotlightStartOrContinueReading spotlight={spotlight} />
        </div>
        {spotlight.spotlightImageId && <div className={classes.image}>
          <CloudinaryImage2
            publicId={spotlight.spotlightImageId}
            darkPublicId={spotlight.spotlightDarkImageId}
          />
        </div>}
        {hideBanner && <div className={classes.closeButtonWrapper}>
          <LWTooltip title="Hide this item for the next month" placement="right">
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

const SpotlightItemComponent = registerComponent('SpotlightItem', SpotlightItem, {styles});

declare global {
  interface ComponentTypes {
    SpotlightItem: typeof SpotlightItemComponent
  }
}
