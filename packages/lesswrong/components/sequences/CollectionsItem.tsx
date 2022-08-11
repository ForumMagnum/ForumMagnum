import classNames from 'classnames';
import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { CoreReadingCollection } from './LWCoreReading';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import { useCookies } from 'react-cookie';
import moment from 'moment';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 12,
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
    padding: '.25em',
    minHeight: '.75em',
    minWidth: '.75em',
    position: 'absolute',
    top: 0,
    right: 0
  },
  content: {
    padding: 16,
    paddingRight: 35,
    paddingBottom: 12
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
    width: 130,
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
  desktop: {
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },
  mobile: {
    [theme.breakpoints.up('sm')]: {
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

export const CollectionsItem = ({classes, showCloseIcon, collection}: {
  collection: CoreReadingCollection,
  showCloseIcon?: boolean,
  classes: ClassesType,
}) => {
  const { Typography, LinkCard, ContentStyles, ContentItemBody, LWTooltip, PostsPreviewTooltipSingle } = Components

  const { firstPost } = collection;
  
  const cookieName = `${HIDE_COLLECTION_ITEM_PREFIX}${collection.id}`;
  const [cookies, setCookie] = useCookies([cookieName]);

  if (cookies[cookieName]) {
    return null;
  }

  const hideBanner = () => setCookie(
    cookieName,
    "true", {
    expires: moment().add(30, 'days').toDate(),
  });

  return <div className={classNames(classes.root, {[classes.small]:collection.small})}>
    <LinkCard to={collection.url} className={classes.linkCard}>
      <div className={classes.content}>
        <Typography variant="title" className={classes.title}>
          <Link to={collection.url}>{collection.title}</Link>
        </Typography>
        {collection.subtitle && <div  className={classes.subtitle}>
          {collection.subtitle}
        </div>}
        <ContentStyles contentType="postHighlight" className={classes.description}>
          <div className={classes.desktop}>
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: collection.summary}}
              description={`sequence ${collection.id}`}
            />
          </div>
          <div className={classes.mobile}>
            {collection.mobileSummary && <ContentItemBody
              dangerouslySetInnerHTML={{__html: collection.mobileSummary}}
              description={`sequence ${collection.id}`}
            />}
          </div>
        </ContentStyles>
        {firstPost && <div className={classes.firstPost}>
          First Post: <LWTooltip title={<PostsPreviewTooltipSingle postId={firstPost.postId}/>} tooltip={false}>
            <Link to={firstPost.postUrl}>{firstPost.postTitle}</Link>
          </LWTooltip>
        </div>}
      </div>
      {collection.imageUrl && <img src={collection.imageUrl} className={classes.image} />}
      <Tooltip title="Hide this for the next month">
        <Button className={classes.closeButton} onClick={hideBanner}>
          <CloseIcon className={classes.closeIcon} />
        </Button>
      </Tooltip>
    </LinkCard>
  </div>
}

const CollectionsItemComponent = registerComponent('CollectionsItem', CollectionsItem, {styles});

declare global {
  interface ComponentTypes {
    CollectionsItem: typeof CollectionsItemComponent
  }
}

