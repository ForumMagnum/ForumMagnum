import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useHover } from "../common/withHover";
import { isEAForum } from "../../lib/instanceSettings";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const EACollectionCard = ({collection}: {collection: CollectionsBestOfFragment}) => {
  const {eventHandlers} = useHover({
    pageElementContext: "collectionCard",
    documentId: collection._id,
    documentSlug: collection.slug,
  });

  const title = collection.title;
  const author = collection.user;

  const imageId =
    // TODO JP-look-here
    collection.gridImageId || (isEAForum ? "Banner/yeldubyolqpl3vqqy0m6.jpg" : "sequences/vnyzzznenju0hzdv6pqb.jpg");
  const href = collectionGetPageUrl(collection);

  const {EASequenceOrCollectionCard} = Components;
  return (
    <AnalyticsContext documentSlug={collection?.slug ?? "unknown-slug"}>
      <EASequenceOrCollectionCard
        title={title}
        author={author}
        postCount={collection.postsCount}
        readCount={collection.readPostsCount}
        imageId={imageId}
        href={href}
        eventHandlers={eventHandlers}
      />
    </AnalyticsContext>
  );
}

const EACollectionCardComponent = registerComponent(
  "EACollectionCard",
  EACollectionCard,
);

declare global {
  interface ComponentTypes {
    EACollectionCard: typeof EACollectionCardComponent;
  }
}
