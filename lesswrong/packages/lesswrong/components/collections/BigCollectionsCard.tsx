import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import type { CoreReadingCollection } from '../sequences/LWCoreReading';
import { isFriendlyUI } from '../../themes/forumTheme';
import LinkCard from "@/components/common/LinkCard";
import UsersName from "@/components/users/UsersName";
import { Typography } from "@/components/common/Typography";
import CloudinaryImage from "@/components/common/CloudinaryImage";

const styles = (theme: ThemeType) => ({
  root: {
    width:"100%",
    background: theme.palette.panelBackground.default,
    marginBottom: 12,
    [theme.breakpoints.down('sm')]: {
      maxWidth: 347,
      marginRight: 12,
    },
    "&:hover": {
      boxShadow: theme.palette.boxShadow.collectionsCardHover,
    },
  },
  card: {
    padding:theme.spacing.unit*2.5,
    display:"flex",
    height:318,
    flexWrap: "wrap",
    justifyContent: "space-between",
    [theme.breakpoints.down('sm')]: {
      height: "auto",
    },
  },
  content: {
    marginLeft: 33,
    marginBottom:theme.spacing.unit*2,
    width: "100%",
    maxWidth: 307,
    borderTop: `solid 4px ${theme.palette.text.maxIntensity}`, // This color gets overwritten by a content-specific color from the database
    paddingTop: theme.spacing.unit,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
    }
  },
  text: {
    ...theme.typography.postStyle
  },
  author: {
    ...theme.typography.postStyle,
    marginBottom:theme.spacing.unit,
    ...(isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  media: {
    height:271,
    width:326,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      maxWidth: 326,
      height: 90,
      order:2,
      overflow: "hidden"
    },
    '& img': {
      width:326,
      [theme.breakpoints.down('sm')]: {
        width: "100%",
        maxWidth: 326,
      }
    }
  }
})

const BigCollectionsCard = ({ collection, url, classes }: {
  collection: CoreReadingCollection,
  url: string,
  classes: ClassesType<typeof styles>,
}) => {
  const cardContentStyle = {borderTopColor: collection.color}

  return <LinkCard className={classes.root} to={url}>
    <div className={classes.card}>
      {collection.imageId && <div className={classes.media}>
        <CloudinaryImage publicId={collection.imageId} width={326} height={280} />
      </div>}
      <div className={classes.content} style={cardContentStyle}>
        <Typography variant="title">
          <Link to={url}>{collection.title}</Link>
        </Typography>
        <Typography variant="subheading" className={classes.author}>
          by <UsersName documentId={collection.userId}/>
        </Typography>
        <Typography variant="body2" className={classes.text}>
          {collection.summary}
        </Typography>
      </div>
    </div>
  </LinkCard>
}

const BigCollectionsCardComponent = registerComponent(
  "BigCollectionsCard", BigCollectionsCard, { styles }
);

declare global {
  interface ComponentTypes {
    BigCollectionsCard: typeof BigCollectionsCardComponent
  }
}

export default BigCollectionsCardComponent;
