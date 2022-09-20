import React, { useState } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import { useCookies } from 'react-cookie';
import moment from 'moment';
import {useTracking} from "../../lib/analyticsEvents";
import { userCanDo } from '../../lib/vulcan-users';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { useCurrentUser } from '../common/withUser';
import EditIcon from '@material-ui/icons/Edit';
import Spotlights from '../../lib/collections/spotlights/collection';

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

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 12,
    '&:hover $closeButton': {
      color: theme.palette.grey[100],
    },
    '& $editButtonIcon': {
      opacity: 0
    },
    '&:hover  $editButtonIcon': {
      opacity:.2
    }
  },
  linkCard: {
    boxShadow: theme.palette.boxShadow.default,
    background: theme.palette.panelBackground.default,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
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
    overflow: "hidden",
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
    ...theme.typography.postStyle,
    lineHeight: "1.65rem",
    '& p': {
      marginTop: '0.5em',
      marginBottom: '0.5em'
    },
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
  editButtonIcon: {
    width: 20,
    opacity: 0,
    [theme.breakpoints.down('sm')]: {
      color: "white",
      width: 16,
      opacity:.2
    },
    '&:hover': {
      opacity: .5
    }
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
  const { AnalyticsTracker, LinkCard, ContentItemBody, CloudinaryImage, LWTooltip, PostsPreviewTooltipSingle, WrappedSmartForm } = Components
  
  const currentUser = useCurrentUser()

  const [edit, setEdit] = useState<boolean>(false)

  const url = getUrlFromDocument(spotlight.document, spotlight.documentType)
  
  return <AnalyticsTracker eventType="spotlightItem" captureOnMount captureOnClick={false}>
    <div className={classes.root}>
      <LinkCard to={url} className={classes.linkCard}>
        <div className={classes.content}>
          <Link to={url} className={classes.title}>
            {spotlight.document.title}
          </Link>
          <div className={classes.description}>
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: spotlight.description?.html ?? ''}}
              description={`${spotlight.documentType} ${spotlight.document._id}`}
            />
          </div>
        </div>
        <div className={classes.image}>
          <CloudinaryImage publicId={spotlight.spotlightImageId} />
        </div>
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
      </LinkCard>
      {edit &&
        <WrappedSmartForm
          collection={Spotlights}
          documentId={spotlight._id}
          mutationFragment={getFragment('SpotlightEditQueryFragment')}
          queryFragment={getFragment('SpotlightEditQueryFragment')}
          successCallback={() => setEdit(false)}
        />
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

