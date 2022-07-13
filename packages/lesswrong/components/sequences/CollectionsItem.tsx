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
    background: "white",
    boxShadow: theme.palette.boxShadow.default,
    justifyContent: "space-between",
    minHeight: 140,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    }
  },
  content: {
    padding: 16
  },
  titleAuthor: {
    display: "flex",
    justifyContent: "space-between"
  },
  text: {
    ...theme.typography.postStyle,
  },
  subtitle: {
    ...theme.typography.postStyle,
    display: "inline-block",
    fontStyle: "italic",
    paddingBottom: 12
  },
  ui: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    fontSize: "1rem",
    padding: 16,
    width: 160,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  image: {
    width: 140,
    objectFit: "cover"
  }
});

export const CollectionsItem = ({classes, collection}: {
  collection: CollectionsMinimumInfo,
  classes: ClassesType,
}) => {
  const { CloudinaryImage, Typography, LinkCard } = Components
  const url = `/${collection.slug}`
  return <div className={classes.root}>
    <LinkCard to={url} className={classes.linkCard}>
      {collection.gridImageId && <img src={collection.gridImageId} className={classes.image} />}
      <div className={classes.content}>
        <Typography variant="title" className={classes.title}>
          <Link to={url}>{collection.title}</Link>
        </Typography>
        <div  className={classes.subtitle}>
          {collection.subtitle}
        </div>
        <Typography variant="body2" className={classes.text}>
          {collection.summary}
        </Typography>
      </div>
      {/* {collection.imageUrl && <img src={collection.imageUrl} className={classes.imageRight} />} */}

      <div className={classes.ui}>
        <div>0/300</div>
        <div>read</div>
      </div>
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

