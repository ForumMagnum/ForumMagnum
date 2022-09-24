import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import classNames from 'classnames';
import React, { useState } from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import Spotlights from '../../lib/collections/spotlights/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';

export interface SpotlightContent {
  documentType: SpotlightDocumentType,
  document: {
    _id?: string,
    title: string,
    slug?: string
  },
  imageUrl: string,
  description: string,
  firstPost?: {
    _id: string,
    title: string,
    url: string
  }
}

export const descriptionStyles = theme => ({
  fontFamily: `${theme.typography.postStyle.fontFamily} !important`,
  '& p': {
    marginTop: '0.5em !important',
    marginBottom: '0.5em !important'
  },
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 12,
    boxShadow: theme.palette.boxShadow.default,
  },
  spotlightItem: {
    position: "relative",
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
    paddingBottom: 0,
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
  description: {
    marginTop: 14,
    ...theme.typography.body2,
    ...descriptionStyles(theme),
    position: "relative",
    lineHeight: '1.65rem',
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },
  title: {
    ...theme.typography.headerStyle,
    fontSize: 20,
    fontVariant: "small-caps",
    lineHeight: "1.2em",
    display: "flex",
    alignItems: "center"
  },
  image: {
    '& img': {
      position: "absolute",
      top: 0,
      right: 0,
      height: "100%",  
    }
  },
  firstPost: {
    ...theme.typography.body2,
    padding: 16,
    paddingTop: 10,
    paddingBottom: 12,
    fontSize: "1.1rem",
    ...theme.typography.commentStyle,
    position: "relative",
    zIndex: theme.zIndexes.spotlightItemCloseButton,
    color: theme.palette.grey[500],
    '& a': {
      color: theme.palette.primary.main
    }
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
    '& .form-submit button': {
      position: "absolute",
      bottom: 0,
      right: 0,
      background: theme.palette.background.translucentBackground,
      marginLeft: 12,
      opacity: .5,
      '&:hover': {
        opacity: 1
      }
    }
  },
  form: {
    background: theme.palette.background.translucentBackground,
    padding: 16
  }
});

const getUrlFromDocument = (document: SpotlightContent['document'], documentType: SpotlightDocumentType) => {
  switch (documentType) {
    case "Sequence":
      return `/s/${document._id}`;
    case "Collection":
      return `/${document.slug}`
    case "Post":
      return `/posts/${document._id}/${document.slug}`
  }
}


export const SpotlightItem = ({classes, spotlight, hideBanner, refetchAllSpotlights}: {
  spotlight: SpotlightDisplay,
  hideBanner?: () => void,
  classes: ClassesType,
  // This is so that if a spotlight's position is updated (in SpotlightsPage), we refetch all of them to display them with their updated positions and in the correct order
  refetchAllSpotlights?: () => void,
}) => {
  const { AnalyticsTracker, ContentItemBody, CloudinaryImage, LWTooltip, PostsPreviewTooltipSingle, WrappedSmartForm, SpotlightEditorStyles } = Components
  
  const currentUser = useCurrentUser()

  const [edit, setEdit] = useState<boolean>(false)
  const [editDescription, setEditDescription] = useState<boolean>(false)

  const url = getUrlFromDocument(spotlight.document, spotlight.documentType)

  // Note: the firstPostUrl won't reliably generate a good reading experience for all
  // possible Collection type spotlights, although it happens to work for the existing 5 collections 
  // on LessWrong. (if the first post of a collection has a canonical sequence that's not 
  // in that collection it wouldn't provide the right 'next post')

  // But, also, the real proper fix here is to integrate continue reading here.
  const firstPostUrl = spotlight.firstPost && postGetPageUrl(spotlight.firstPost, false, spotlight.documentType === "Sequence" ? spotlight.documentId : undefined)

  const onUpdate = () => {
    setEdit(false);
    refetchAllSpotlights?.();
  };
  
  return <AnalyticsTracker eventType="spotlightItem" captureOnMount captureOnClick={false}>
    <div className={classes.root}>
      <div className={classes.spotlightItem}>
        <div className={classes.content}>
          <div className={classes.title}>
            <Link to={url}>
              {spotlight.document.title}
            </Link>
            <span className={classes.editDescriptionButton}>
              {userCanDo(currentUser, 'spotlights.edit.all') && <LWTooltip title="Edit Spotlight">
                <EditIcon className={classes.editButtonIcon} onClick={() => setEditDescription(!editDescription)}/>
              </LWTooltip>}
            </span>
          </div>
          <div className={classes.description}>
            {editDescription ? 
              <div className={classes.editDescription}>
                <WrappedSmartForm
                  collection={Spotlights}
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
        </div>
        {spotlight.spotlightImageId && <div className={classes.image}>
          <CloudinaryImage publicId={spotlight.spotlightImageId} />
        </div>}
        {firstPostUrl && <div className={classes.firstPost}>
          First Post: <LWTooltip title={<PostsPreviewTooltipSingle postId={spotlight.firstPost._id}/>} tooltip={false}>
            <Link to={firstPostUrl}>{spotlight.firstPost.title}</Link>
          </LWTooltip>
        </div>}
        {hideBanner && <div className={classes.closeButtonWrapper}>
          <LWTooltip title="Hide this item for the next month" placement="right">
            <Button className={classes.closeButton} onClick={hideBanner}>
              <CloseIcon className={classes.closeIcon} />
            </Button>
          </LWTooltip>
        </div>}
        <div className={classes.editAllButton}>
          {userCanDo(currentUser, 'spotlights.edit.all') && <LWTooltip title="Edit Spotlight">
            <MoreVertIcon className={classNames(classes.editButtonIcon, classes.editAllButtonIcon)} onClick={() => setEdit(!edit)}/>
          </LWTooltip>}
        </div>
      </div>
      {edit && <div className={classes.form}>
        <SpotlightEditorStyles>
          <WrappedSmartForm
            collection={Spotlights}
            documentId={spotlight._id}
            mutationFragment={getFragment('SpotlightEditQueryFragment')}
            queryFragment={getFragment('SpotlightEditQueryFragment')}
            successCallback={onUpdate}
          />
        </SpotlightEditorStyles>
      </div>
      }
    </div>
  </AnalyticsTracker>
}

const SpotlightItemComponent = registerComponent('SpotlightItem', SpotlightItem, {styles});

declare global {
  interface ComponentTypes {
    SpotlightItem: typeof SpotlightItemComponent
  }
}

