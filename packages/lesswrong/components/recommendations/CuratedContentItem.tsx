import classNames from 'classnames';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping';
import { CoreReadingCollection } from './LWCoreReading';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import { useCookies } from 'react-cookie';
import moment from 'moment';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 12,
    '&:hover $closeButton': {
      color: theme.palette.grey[100],
    }
  },
  linkCard: {
    display: "flex",
    boxShadow: theme.palette.boxShadow.default,
    background: theme.palette.panelBackground.default,
    justifyContent: "space-between",
    width: "100%",
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
    right: 0
  },
  content: {
    padding: 16,
    paddingRight: 35,
    paddingBottom: 12,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
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
  },
  title: {
    ...theme.typography.headerStyle,
    fontSize: 20,
    fontVariant: "small-caps"
  },
  subtitle: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    display: "inline-block",
    opacity: .6
  },
  image: {
    objectFit: "cover",
    [theme.breakpoints.down('xs')]: {
      width: 96
    }
  },
  small: {
    width: 'calc(50% - 8px)',
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    }
  },
  hideOnMobile: {
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },
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

const HIDE_COLLECTION_ITEM_PREFIX = 'hide_collection_item_';

export const CuratedContentItem = ({classes, content}: {
  content: CuratedContent,
  classes: ClassesType,
}) => {
  const {Typography, LinkCard, ContentStyles, ContentItemBody, LWTooltip, PostsPreviewTooltipSingle} = Components
  
  
  
}

const CuratedContentItemComponent = registerComponent('CuratedContentItem', CuratedContentItem, {styles});

declare global {
  interface ComponentTypes {
    CuratedContentItem: typeof CuratedContentItemComponent
  }
}

