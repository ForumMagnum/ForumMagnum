import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import type { CoreReadingCollection } from '../sequences/LWCoreReading';
import LinkCard from "../common/LinkCard";
import CloudinaryImage from "../common/CloudinaryImage";
import UsersName from "../users/UsersName";
import { Typography } from "../common/Typography";

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    maxWidth: 347,
    marginRight: 12,
    background: theme.palette.panelBackground.default,
    marginBottom: 12,
    "&:hover": {
      boxShadow: theme.palette.boxShadow.collectionsCardHover,
    },
  },
  card: {
    padding: theme.spacing.unit*2.5,
    display: "flex",
    height: 315,
    [theme.breakpoints.down('sm')]: {
      height: "auto",
    },
    [theme.breakpoints.down('xs')]: {
      height: "auto",
      padding: theme.spacing.unit*1.25,
    },
    flexWrap: "wrap",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  content: {
    borderTop: `solid 4px ${theme.palette.text.maxIntensity}`, // This gets overwritten by a color from the DB
    paddingTop: theme.spacing.unit*1.5
  },
  title: {
    fontFamily: theme.isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  mergeTitle: {
    display: "inline",
    marginRight: 10,
  },
  text: {
    ...theme.typography.postStyle,
  },
  author: {
    ...theme.typography.postStyle,
    marginBottom:theme.spacing.unit,
    display: "inline-block",
    ...(theme.isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  media: {
    '& img':{
      width:307,
      [theme.breakpoints.down('sm')]: {
        width: "100%",
        maxWidth:307,
        overflow: "hidden"
      },
    },
    
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  thumbnailImage: { // Used only on XS screens
    float: "left",
    position: "relative",
    marginRight: 15,

    '& img': {
      width: 50,
      height: 41,
    },
    
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
})

const CollectionsCard = ({ collection, url, mergeTitle=false, classes }: {
  collection: CoreReadingCollection,
  url: string,
  mergeTitle?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const cardContentStyle = {borderTopColor: collection.color}

  return <LinkCard className={classes.root} to={url}>
    <div className={classes.card}>
      <div className={classes.content} style={cardContentStyle}>
        {collection.imageId && <div className={classes.thumbnailImage}>
          <CloudinaryImage
            publicId={collection.imageId}
            width={50}
            height={41}
          />
        </div>}
        <Typography variant="title" className={classNames(classes.title, {[classes.mergeTitle]: mergeTitle})}>
          <Link to={url}>{collection.title}</Link>
        </Typography>
        <Typography variant="subheading" className={classes.author}>
          by <UsersName documentId={collection.userId}/>
        </Typography>
        <Typography variant="body2" className={classes.text}>
          {collection.summary}
        </Typography>
      </div>
      {collection.imageId && <div className={classes.media}>
        <CloudinaryImage publicId={collection.imageId} width={307} height={86} />
      </div>}
    </div>
  </LinkCard>
}

export default registerComponent(
  "CollectionsCard", CollectionsCard, { styles }
);


