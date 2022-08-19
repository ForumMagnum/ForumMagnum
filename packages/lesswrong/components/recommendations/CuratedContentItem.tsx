import classNames from 'classnames';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import { useCookies } from 'react-cookie';
import moment from 'moment';
import { string } from 'prop-types';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';

type CuratedContentDocType = "Sequence"|"Collection"

export interface CuratedContent {
  documentType: CuratedContentDocType,
  document: {
    _id: string,
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

  // title: string,
  // subtitle?: string,
  // id: string,
  // userId: string,
  // summary: string,
  // hideSummaryOnMobile?: boolean,
  // imageId?: string,
  // imageWidth?: number,
  // imageUrl?: string,
  // color: string,
  // big?: boolean,
  // url: string,
  // firstPost?: {
  //   postId: string,
  //   postTitle: string,
  //   postUrl: string
  // }
}

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 12,
    overflow: "hidden"
    // '&:hover $closeButton': {
    //   color: theme.palette.grey[100],
    // }
  },
  linkCard: {
    // display: "flex",
    boxShadow: theme.palette.boxShadow.default,
    background: theme.palette.panelBackground.default,
    // justifyContent: "space-between",
    // width: "100%",
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    }
  },
  // closeButton: {
  //   padding: '.5em',
  //   minHeight: '.75em',
  //   minWidth: '.75em',
  //   position: 'absolute',
  //   color: theme.palette.grey[300],
  //   top: 0,
  //   right: 0
  // },
  content: {
    padding: 16,
    paddingRight: 35,
    paddingBottom: 12,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 150,
    position: "relative",
    zIndex: theme.zIndexes.curatedContentItem,
    [theme.breakpoints.down('xs')]: {
      marginRight: 100
    }
    // height: 150
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
  // subtitle: {
  //   ...theme.typography.body2,
  //   ...theme.typography.postStyle,
  //   display: "inline-block",
  //   opacity: .6
  // },
  image: {
    position: "absolute",
    top: 0,
    right: 0,
    height: "100%",
  },
  // small: {
  //   width: 'calc(50% - 8px)',
  //   [theme.breakpoints.down('sm')]: {
  //     width: "100%"
  //   }
  // },
  // hideOnMobile: {
  //   [theme.breakpoints.down('xs')]: {
  //     display: "none"
  //   }
  // },
  firstPost: {
    ...theme.typography.body2,
    fontSize: "1rem",
    ...commentBodyStyles(theme),
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
  }
}

const HIDE_COLLECTION_ITEM_PREFIX = 'hide_collection_item_';

export const CuratedContentItem = ({classes, content}: {
  content: CuratedContent,
  classes: ClassesType,
}) => {
  const { LinkCard, ContentItemBody, LWTooltip, PostsPreviewTooltipSingle} = Components
  
  const url = getUrlFromDocument(content.document, content.documentType) 

  return <div className={classes.root}>
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
        {content.firstPost && <div className={classes.firstPost}>
          First Post: <LWTooltip title={<PostsPreviewTooltipSingle postId={content.firstPost._id}/>} tooltip={false}>
            <Link to={content.firstPost.url}>{content.firstPost.title}</Link>
          </LWTooltip>
        </div>}
      </div>
      {content.imageUrl && <img src={content.imageUrl} className={classes.image}/>}
    </LinkCard>
  </div>
}

const CuratedContentItemComponent = registerComponent('CuratedContentItem', CuratedContentItem, {styles});

declare global {
  interface ComponentTypes {
    CuratedContentItem: typeof CuratedContentItemComponent
  }
}

