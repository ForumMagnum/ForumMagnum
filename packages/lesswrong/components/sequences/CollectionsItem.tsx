import classNames from 'classnames';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { commentBodyStyles } from '../../themes/stylePiping';
import { CoreReadingCollection } from './LWCoreReading';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import moment from 'moment';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_COLLECTION_ITEM_PREFIX } from '../../lib/cookies/cookies';

const styles = (theme: ThemeType) => ({
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
    ...theme.typography.smallCaps,
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

export const CollectionsItem = ({classes, showCloseIcon, collection}: {
  collection: CoreReadingCollection,
  showCloseIcon?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const {
    Typography, LinkCard, ContentStyles, ContentItemBody, PostsTooltip
  } = Components;

  const { firstPost } = collection;

  const cookieName = `${HIDE_COLLECTION_ITEM_PREFIX}${collection.id}`; //hiding in one place, hides everywhere
  const [cookies, setCookie] = useCookiesWithConsent([cookieName]);

  if (cookies[cookieName]) {
    return null;
  }

  const hideBanner = () => setCookie(
    cookieName,
    "true", {
    expires: moment().add(30, 'days').toDate(), //TODO: Figure out actual correct hiding behavior
    path: "/"
  });

  const description = <ContentItemBody
    dangerouslySetInnerHTML={{__html: collection.summary}}
    description={`sequence ${collection.id}`}
  />

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
          {collection.hideSummaryOnMobile ? <div className={classes.hideOnMobile}>
            {description}
          </div> : description}
        </ContentStyles>
        {firstPost && <div className={classes.firstPost}>
          First Post: <PostsTooltip inlineBlock postId={firstPost.postId}>
            <Link to={firstPost.postUrl}>{firstPost.postTitle}</Link>
          </PostsTooltip>
        </div>}
      </div>

      {collection.imageUrl && <img src={collection.imageUrl} className={classes.image} style={{width: collection.imageWidth || 130}}/>}

      {showCloseIcon && <Tooltip title="Hide this for the next month">
        <Button className={classes.closeButton} onClick={hideBanner}>
          <CloseIcon />
        </Button>
      </Tooltip>}
    </LinkCard>
  </div>
}

const CollectionsItemComponent = registerComponent('CollectionsItem', CollectionsItem, {styles});

declare global {
  interface ComponentTypes {
    CollectionsItem: typeof CollectionsItemComponent
  }
}

