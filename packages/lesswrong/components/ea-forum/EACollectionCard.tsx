import React, { useCallback, ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { forumSelect } from "../../lib/forumTypeUtils";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import CollectionsTooltip from "../collections/CollectionsTooltip";
import EASequenceOrCollectionCard from "./EASequenceOrCollectionCard";

const defaultImageId = forumSelect({
  EAForum: "Banner/yeldubyolqpl3vqqy0m6.jpg",
  default: "sequences/vnyzzznenju0hzdv6pqb.jpg",
});

const getCardDetails = ({
  _id,
  title,
  user,
  gridImageId,
}: CollectionsBestOfFragment) => {
  // Add special case short names for the EA handbook
  if (_id === "MobebwWs2o86cS9Rd") {
    return {
      title: "The EA Handbook",
      author: user
        ? {
          ...user,
          displayName: "CEA",
        }
        : null,
      imageId: "268969264-1881a4b1-01d3-4d79-9481-e6b3eae202fc",
    };
  }

  return {
    title,
    author: user,
    imageId: gridImageId || defaultImageId,
  };
}

const EACollectionCard = ({collection}: {collection: CollectionsBestOfFragment}) => {
  const {eventHandlers} = useHover({
    eventProps: {
      pageElementContext: "collectionCard",
      documentId: collection._id,
      documentSlug: collection.slug,
    },
  });

  const {title, author, imageId} = getCardDetails(collection);
  const href = collectionGetPageUrl(collection);

  const TitleWrapper = useCallback(({children}: {children: ReactNode}) => {
    return (
      <CollectionsTooltip collection={collection}>
        {children}
      </CollectionsTooltip>
    );
  }, [collection]);
  return (
    <AnalyticsContext documentSlug={collection.slug}>
      <EASequenceOrCollectionCard
        title={title}
        author={author}
        TitleWrapper={TitleWrapper}
        postCount={collection.postsCount}
        readCount={collection.readPostsCount}
        imageId={imageId}
        href={href}
        eventHandlers={eventHandlers}
      />
    </AnalyticsContext>
  );
}

export default registerComponent(
  "EACollectionCard",
  EACollectionCard,
);


