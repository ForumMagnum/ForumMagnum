import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { Link } from "../../lib/reactRouterWrapper";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import { FRIENDLY_HOVER_OVER_WIDTH } from "../common/FriendlyHoverOver";
import HoverOver from "@/components/common/HoverOver";
import UsersName from "@/components/users/UsersName";
import { ContentStyles } from "@/components/common/ContentStyles";
import ContentItemTruncated from "@/components/common/ContentItemTruncated";
import { Card } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    width: FRIENDLY_HOVER_OVER_WIDTH,
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "1.3rem",
    fontWeight: 700,
    lineHeight: "130%",
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    paddingTop: 8,
    paddingBottom: 8,
  },
  author: {
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 500,
    marginTop: 10,
    marginBottom: 10,
  },
});

const CollectionsTooltip = ({collection, children, classes}: {
  collection: CollectionsBestOfFragment,
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <HoverOver
      title={
        <Card className={classes.root}>
          <Link to={collectionGetPageUrl(collection)}>
            <div className={classes.title}>{collection.title}</div>
          </Link>
          <div className={classes.author}>
            <UsersName user={collection.user} />
            {" · "}
            {collection.readPostsCount}/{collection.postsCount} posts read
          </div>
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
        </Card>
      }
      tooltip={false}
      placement="bottom"
      clickable
    >
      {children}
    </HoverOver>
  );
}

const CollectionsTooltipComponent = registerComponent(
  "CollectionsTooltip",
  CollectionsTooltip,
  {styles},
);

declare global {
  interface ComponentTypes {
    CollectionsTooltip: typeof CollectionsTooltipComponent;
  }
}

export default CollectionsTooltipComponent;
