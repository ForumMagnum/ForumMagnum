import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { CoreReadingCollection } from './LWCoreReading';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 16,
  },
  linkCard: {
    display: "flex",
    boxShadow: theme.palette.boxShadow.default,
    justifyContent: "space-between",
    minHeight: 140,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    }
  },
  content: {
    background: theme.palette.panelBackground.default,
    padding: 16,
    paddingRight: 50,
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle
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
    opacity: .6,
    paddingBottom: 16,
  },
  image: {
    width: 140,
    objectFit: "cover"
  }
});

export const CollectionsItem = ({classes, collection}: {
  collection: CollectionsItemFragment,
  classes: ClassesType,
}) => {
  const { Typography, LinkCard, ContentStyles, ContentItemBody } = Components
  const url = `/${collection.slug}`
  return <div className={classes.root}>
    <LinkCard to={url} className={classes.linkCard}>
      <div className={classes.content}>
        <Typography variant="title" className={classes.title}>
          <Link to={url}>{collection.title}</Link>
        </Typography>
        <div  className={classes.subtitle}>
          {collection.subtitle}
        </div>
        <ContentStyles contentType="postHighlight" className={classes.description}>
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: collection.highlight?.html}}
            description={`sequence ${collection._id}`}
          />
        </ContentStyles>
      </div>
      {collection.libraryImageUrl && <img src={collection.libraryImageUrl} className={classes.image} />}
    </LinkCard>
  </div>
}

// return <LinkCard className={classes.root} to={url}>
// <div className={classes.card}>
//   <div className={classes.content} style={cardContentStyle}>
//     <div className={classes.thumbnailImage}>

//     </div>


//   </div>
//   <div className={classes.media}>
//     <CloudinaryImage publicId={collection.imageId} width={307} height={86} />
//   </div>
// </div>
// </LinkCard>

const CollectionsItemComponent = registerComponent('CollectionsItem', CollectionsItem, {styles});

declare global {
  interface ComponentTypes {
    CollectionsItem: typeof CollectionsItemComponent
  }
}

