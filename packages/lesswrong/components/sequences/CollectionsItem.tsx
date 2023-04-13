import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping';
import { CoreReadingCollection } from './LWCoreReading';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import moment from 'moment';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { useHideWithCookie } from '../hooks/useHideWithCookie';
import { registerCookie } from '../../lib/cookies/utils';

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

const HIDE_COLLECTION_ITEM_PREFIX = 'hide_collection_item_';
const HIDDEN_COLLECTIONS_COOKIE = registerCookie({
  name: "hidden_collections",
  type: "functional",
  description: "TODO",
});

export const CollectionsItem = ({classes, showCloseIcon, collection}: {
  collection: CoreReadingCollection,
  showCloseIcon?: boolean,
  classes: ClassesType,
}) => {
  const { Typography, LinkCard, ContentStyles, ContentItemBody, LWTooltip, PostsPreviewTooltipSingle } = Components

  const { firstPost } = collection;

  // BEGIN MIGRATION CODE
  // TODO do this separate from this component as part of a general migration when we deploy the cookie banner
  const [cookies, setCookie, removeCookie] = useCookiesWithConsent();

  useEffect(() => {
    migrateLegacyCookies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeExpiredCollections = (collections: Record<string, string>) => {
    const now = new Date().getTime();
    return Object.fromEntries(
      Object.entries(collections).filter(
        ([, expiryDate]) => new Date(expiryDate).getTime() > now
      )
    );
  };

  const migrateLegacyCookies = useCallback(() => {
    const legacyCookies = Object.keys(cookies).filter((key) =>
      key.startsWith(HIDE_COLLECTION_ITEM_PREFIX)
    );
  
    if (legacyCookies.length > 0) {
      const hiddenCollections = legacyCookies.reduce((acc, key) => {
        const collectionId = key.replace(HIDE_COLLECTION_ITEM_PREFIX, '');
        const expiryDate = cookies[key].expires
          ? new Date(cookies[key].expires).toISOString()
          : moment().add(30, 'days').toISOString();
        return { ...acc, [collectionId]: expiryDate };
      }, {});
  
      const currentHiddenCollections = cookies[HIDDEN_COLLECTIONS_COOKIE]
        ? JSON.parse(cookies[HIDDEN_COLLECTIONS_COOKIE])
        : {};
      const updatedHiddenCollections = {
        ...removeExpiredCollections(currentHiddenCollections),
        ...hiddenCollections,
      };
  
      setCookie(
        HIDDEN_COLLECTIONS_COOKIE,
        JSON.stringify(updatedHiddenCollections),
        {
          expires: moment().add(30, 'days').toDate(),
          path: '/',
        }
      );
  
      legacyCookies.forEach((legacyCookie) => removeCookie(legacyCookie));
    }
  }, [cookies, setCookie, removeCookie]);
  // END MIGRATION CODE

  const [isHidden, hideUntil] = useHideWithCookie(HIDDEN_COLLECTIONS_COOKIE, collection.id)

  if (isHidden) {
    return null;
  }

  const hideBanner = () => {
    hideUntil(moment().add(30, 'days').toDate());
  };

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
          First Post: <LWTooltip title={<PostsPreviewTooltipSingle postId={firstPost.postId}/>} tooltip={false}>
            <Link to={firstPost.postUrl}>{firstPost.postTitle}</Link>
          </LWTooltip>
        </div>}
      </div>
      
      {collection.imageUrl && <img src={collection.imageUrl} className={classes.image} style={{width: collection.imageWidth || 130}}/>}

      {showCloseIcon && <Tooltip title="Hide this for the next month">
        <Button className={classes.closeButton} onClick={hideBanner}>
          <CloseIcon className={classes.closeIcon} />
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

