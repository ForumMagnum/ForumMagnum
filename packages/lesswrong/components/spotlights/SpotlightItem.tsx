import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import React, { useState } from 'react';
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
    position: "relative",
    background: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.default,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    },
    '&:hover $closeButton': {
      color: theme.palette.grey[100],
    },
    '& $editButtonIcon': {
      opacity: 0
    },
    '&:hover  $editButtonIcon': {
      opacity:1
    }
  },
  closeButton: {
    padding: '.5em',
    minHeight: '.75em',
    minWidth: '.75em',
    position: 'absolute',
    color: theme.palette.grey[300],
    top: 0,
    right: 0,
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
    lineHeight: "1.2em"
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
  editButton: {
    [theme.breakpoints.up('md')]: {
      position: "absolute",
      bottom: 6,
      right: -28,
    },
    [theme.breakpoints.down('sm')]: {
      position: "absolute",
      bottom: 4,
      right: 8
    },
  },
  editDescriptionButton: {

  },
  editButtonIcon: {
    width: 20,
    opacity: 0,
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


export const SpotlightItem = ({classes, spotlight, hideBanner}: {
  spotlight: SpotlightDisplay,
  hideBanner?: () => void,
  classes: ClassesType,
}) => {
  const { AnalyticsTracker, ContentItemBody, CloudinaryImage, LWTooltip, PostsPreviewTooltipSingle, WrappedSmartForm, SpotlightEditorStyles } = Components
  
  const currentUser = useCurrentUser()

  const [edit, setEdit] = useState<boolean>(false)
  const [editDescription, setEditDescription] = useState<boolean>(false)

  const url = getUrlFromDocument(spotlight.document, spotlight.documentType)
  
  return <AnalyticsTracker eventType="spotlightItem" captureOnMount captureOnClick={false}>
    <div>
      <div className={classes.root}>
        <div className={classes.content}>
          <Link to={url} className={classes.title}>
            {spotlight.document.title}
          </Link>
          <div className={classes.description}>
            {editDescription ? 
              <div className={classes.editDescription}>
                <WrappedSmartForm
                  collection={Spotlights}
                  fields={['description']}
                  documentId={spotlight._id}
                  mutationFragment={getFragment('SpotlightEditQueryFragment')}
                  queryFragment={getFragment('SpotlightEditQueryFragment')}
                  successCallback={() => setEdit(false)}
                />
              </div>
              :
              <div>
                {/* <div className={classes.overflow}> */}
                  <ContentItemBody
                    dangerouslySetInnerHTML={{__html: spotlight.description?.html ?? ''}}
                    description={`${spotlight.documentType} ${spotlight.document._id}`}
                  />
                {/* </div> */}
                <div className={classes.editButton}>
                  {userCanDo(currentUser, 'spotlights.edit.all') && <LWTooltip title="Edit Spotlight">
                    <EditIcon className={classes.editButtonIcon} onClick={() => setEditDescription(!edit)}/>
                  </LWTooltip>}
                </div>
              </div>
            }
          </div>
        </div>
        {spotlight.spotlightImageId && <div className={classes.image}>
          <CloudinaryImage publicId={spotlight.spotlightImageId} />
        </div>}
        {spotlight.firstPost && <div className={classes.firstPost}>
          First Post: <LWTooltip title={<PostsPreviewTooltipSingle postId={spotlight.firstPost._id}/>} tooltip={false}>
          <Link to={spotlight.firstPost.url}>{spotlight.firstPost.title}</Link>
        </LWTooltip>
        </div>}
        {hideBanner && <LWTooltip title="Hide this item for the next month" placement="right">
          <Button className={classes.closeButton} onClick={hideBanner}>
            <CloseIcon className={classes.closeIcon} />
          </Button>
        </LWTooltip>}
        <div className={classes.editButton}>
          {userCanDo(currentUser, 'spotlights.edit.all') && <LWTooltip title="Edit Spotlight">
            <EditIcon className={classes.editButtonIcon} onClick={() => setEdit(!edit)}/>
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
            successCallback={() => setEdit(false)}
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

