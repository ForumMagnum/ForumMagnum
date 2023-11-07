import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import { isEAForum } from "../../lib/instanceSettings";
import Card from "@material-ui/core/Card";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    width: 450
  },
  title: {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    ...theme.typography.smallCaps,
    ...(isEAForum && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    paddingTop: 8,
    paddingBottom: 8,
  },
  author: {
    color: theme.palette.text.dim,
    ...(isEAForum && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  postCount: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[500],
    marginTop: 12,
    fontSize: "1rem",
  },
});

const CollectionsHoverOver = ({collection, classes}: {
  collection: CollectionsBestOfFragment,
  classes: ClassesType,
}) => {
  const {UsersName, ContentStyles, ContentItemTruncated} = Components;
  return (
    <Card className={classes.root}>
      <Link to={collectionGetPageUrl(collection)}>
        <div className={classes.title}>{collection.title}</div>
      </Link>
      {collection.user &&
        <div className={classes.author}>
          by <UsersName user={collection.user} />
        </div>
      }
      <ContentStyles contentType="postHighlight" className={classes.description}>
        <ContentItemTruncated
          maxLengthWords={100}
          graceWords={20}
          rawWordCount={collection.contents?.wordCount || 0}
          expanded={false}
          getTruncatedSuffix={() => null}
          dangerouslySetInnerHTML={{
            __html: collection.contents?.htmlHighlight || "",
          }}
          description={`collection ${collection._id}`}
        />
      </ContentStyles>
      <div className={classes.postCount}>
        {collection.readPostsCount}/{collection.postsCount} posts read
      </div>
    </Card>
  );
}

const CollectionsHoverOverComponent = registerComponent(
  "CollectionsHoverOver",
  CollectionsHoverOver,
  {styles},
);

declare global {
  interface ComponentTypes {
    CollectionsHoverOver: typeof CollectionsHoverOverComponent;
  }
}
