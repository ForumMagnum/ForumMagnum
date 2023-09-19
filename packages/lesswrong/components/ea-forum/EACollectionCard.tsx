import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useHover } from "../common/withHover";
import { forumSelect } from "../../lib/forumTypeUtils";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const defaultImageId = forumSelect({
  EAForum: "Banner/yeldubyolqpl3vqqy0m6.jpg",
  default: "sequences/vnyzzznenju0hzdv6pqb.jpg",
});

const getTitleAndAuthor = ({_id, title, user}: CollectionsBestOfFragment) => {
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
    };
  }

  return {title, author: user};
}

const EACollectionCard = ({collection}: {collection: CollectionsBestOfFragment}) => {
  const {eventHandlers} = useHover({
    pageElementContext: "collectionCard",
    documentId: collection._id,
    documentSlug: collection.slug,
  });

  const {title, author} = getTitleAndAuthor(collection);

  const imageId = collection.gridImageId || defaultImageId;
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
