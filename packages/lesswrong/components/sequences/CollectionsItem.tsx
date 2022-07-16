import classNames from 'classnames';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { CoreReadingCollection } from './LWCoreReading';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 14,
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
  content: {
    padding: 16,
    paddingRight: 35,
    paddingBottom: 12
  },
  description: {
    marginTop: 14,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    '& p': {
      marginTop: '0.5em',
      marginBottom: '0.5em'
    },
  },
  title: {
    ...theme.typography.headerStyle,
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  subtitle: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    display: "inline-block",
    opacity: .6
  },
  image: {
    width: 115,
    objectFit: "cover"
  },
  small: {
    width: 'calc(50% - 8px)',
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    }
  }
});

export const CollectionsItem = ({classes, collection}: {
  collection: CollectionsItemFragment,
  classes: ClassesType,
}) => {
  const { Typography, LinkCard, ContentStyles, ContentItemBody } = Components

  const url = `/${collection.slug}`
  return <div className={classNames(classes.root, {[classes.small]:collection.small})}>
  <LinkCard to={url} className={classes.linkCard}>
    <div className={classes.content}>
      <Typography variant="title" className={classes.title}>
        <Link to={url}>{collection.title}</Link>
      </Typography>
      {collection.subtitle && <div  className={classes.subtitle}>
        {collection.subtitle}
      </div>}
      <ContentStyles contentType="postHighlight" className={classes.description}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: collection.summary}}
          description={`sequence ${collection._id}`}
        />
      </ContentStyles>
    </div>
    {collection.imageUrl && <img src={collection.imageUrl} className={classes.image} />}
  </LinkCard>
</div>






























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
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: collection.summary}}
            description={`sequence ${collection.id}`}
          />
        </ContentStyles>
      </div>
      {collection.imageUrl && <img src={collection.imageUrl} className={classes.image} />}
    </LinkCard>
  </div>
}

const CollectionsItemComponent = registerComponent('CollectionsItem', CollectionsItem, {styles});

declare global {
  interface ComponentTypes {
    CollectionsItem: typeof CollectionsItemComponent
  }
}

