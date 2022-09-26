import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import { useCookies } from 'react-cookie';
import moment from 'moment';
import {useTracking} from "../../lib/analyticsEvents";

type CuratedContentDocType = "Sequence"|"Collection"|"Post"

export interface CuratedContent {
  documentType: CuratedContentDocType,
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
    overflow: "hidden",
    '&:hover $closeButton': {
      color: theme.palette.grey[100],
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
    zIndex: theme.zIndexes.curatedContentItemCloseButton,
  },
  content: {
    padding: 16,
    paddingRight: 35,
    paddingBottom: 8,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 150,
    position: "relative",
    zIndex: theme.zIndexes.curatedContentItem,
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
    position: "absolute",
    top: 0,
    right: 0,
    height: "100%",
  },
  firstPost: {
    ...theme.typography.body2,
    padding: 16,
    paddingTop: 10,
    paddingBottom: 12,
    fontSize: "1.1rem",
    ...theme.typography.commentStyle,
    position: "relative",
    zIndex: theme.zIndexes.curatedContentItemCloseButton,
    color: theme.palette.grey[500],
    '& a': {
      color: theme.palette.primary.main
    }
  }
});

const getUrlFromDocument = (document: any, documentType: CuratedContentDocType) => {
  switch (documentType) {
    case "Sequence":
      return `/s/${document._id}`;
    case "Collection":
      return `/${document.slug}`
    case "Post":
      return `/posts/${document._id}/${document.slug}`
  }
}

const HIDE_COLLECTION_ITEM_PREFIX = 'hide_collection_item_';

export const CuratedContentItem = ({classes, content}: {
  content: CuratedContent,
  classes: ClassesType,
}) => {
  const { AnalyticsTracker, LinkCard, ContentItemBody, LWTooltip, PostsPreviewTooltipSingle} = Components
  
  const { captureEvent } = useTracking()
  const url = getUrlFromDocument(content.document, content.documentType)
  
  const cookieName = `${HIDE_COLLECTION_ITEM_PREFIX}${content.document._id}`; //hiding in one place, hides everywhere
  const [cookies, setCookie] = useCookies([cookieName]);
  
  const hideBanner = () => {
    setCookie(
      cookieName,
      "true", {
        expires: moment().add(30, 'days').toDate(), //TODO: Figure out actual correct hiding behavior
        path: "/"
      });
    captureEvent("spotlightItemHideItemClicked", { document: content.document})
  }
  
  if (cookies[cookieName]) {
    return null;
  }

  return <AnalyticsTracker eventType="spotlightItem" captureOnMount captureOnClick={false}>
    <div className={classes.root}>
      <LinkCard to={url} className={classes.linkCard}>
        <div className={classes.content}>
          <Link to={url} className={classes.title}>
            {content.document.title}
          </Link>
          <div className={classes.description}>
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: content.description}}
              description={`${content.documentType} ${content.document._id}`}
            />
          </div>
        </div>
        {content.imageUrl && <img src={content.imageUrl} className={classes.image}/>}
        {content.firstPost && <div className={classes.firstPost}>
          First Post: <LWTooltip title={<PostsPreviewTooltipSingle postId={content.firstPost._id}/>} tooltip={false}>
          <Link to={content.firstPost.url}>{content.firstPost.title}</Link>
        </LWTooltip>
        </div>}
        <Tooltip title="Hide this item for the next month">
          <Button className={classes.closeButton} onClick={hideBanner}>
            <CloseIcon className={classes.closeIcon} />
          </Button>
        </Tooltip>
      </LinkCard>
    </div>
  </AnalyticsTracker>
}

const CuratedContentItemComponent = registerComponent('CuratedContentItem', CuratedContentItem, {styles});

declare global {
  interface ComponentTypes {
    CuratedContentItem: typeof CuratedContentItemComponent
  }
}

