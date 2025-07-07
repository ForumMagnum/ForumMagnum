import classNames from 'classnames';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { commentBodyStyles } from '../../themes/stylePiping';
import { CoreReadingCollection } from './LWCoreReading';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import moment from 'moment';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_COLLECTION_ITEM_PREFIX } from '../../lib/cookies/cookies';
import { TooltipSpan } from '../common/FMTooltip';
import { Typography } from "../common/Typography";
import LinkCard from "../common/LinkCard";
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";

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
  closeButtonWrapper: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  closeButton: {
    padding: '.5em',
    minHeight: '.75em',
    minWidth: '.75em',
    color: theme.palette.grey[300],
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

      {showCloseIcon && <TooltipSpan title="Hide this for the next month" className={classes.closeButtonWrapper}>
        <Button onClick={hideBanner} className={classes.closeButton}>
          <CloseIcon />
        </Button>
      </TooltipSpan>}
    </LinkCard>
  </div>
}

export default registerComponent('CollectionsItem', CollectionsItem, {styles});



