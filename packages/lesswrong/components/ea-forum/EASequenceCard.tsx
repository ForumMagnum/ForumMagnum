import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { isEAForum } from "../../lib/instanceSettings";
import { sequenceGetPageUrl } from "../../lib/collections/sequences/helpers";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { slugify } from "@/lib/utils/slugify";

const EASequenceCard = ({sequence, className}: {
  sequence: SequencesPageFragment,
  className?: string,
}) => {
  // Note: this is not a real slug, it's just so we can recognise the sequence
  // in the analytics, without risking any weirdness due to titles having spaces
  // in them.
  const slug = slugify(sequence?.title ?? "unknown-slug");

  const {eventHandlers} = useHover({
    eventProps: {
      pageElementContext: "sequenceCard",
      documentId: sequence._id,
      documentSlug: slug,
    },
  });

  const title = sequence.title;
  const author = sequence.user;

  const imageId =
    sequence.gridImageId ||
    sequence.bannerImageId ||
    (isEAForum ? "Banner/yeldubyolqpl3vqqy0m6.jpg" : "sequences/vnyzzznenju0hzdv6pqb.jpg");
  const href = sequenceGetPageUrl(sequence);

  const TitleWrapper = useCallback(({children}: {children: ReactNode}) => {
    const {SequencesTooltip} = Components;
    return (
      <SequencesTooltip sequence={sequence} placement="bottom">
        {children}
      </SequencesTooltip>
    );
  }, [sequence]);

  const {EASequenceOrCollectionCard} = Components;
  return (
    <AnalyticsContext documentSlug={slug}>
      <EASequenceOrCollectionCard
        title={title}
        author={author}
        TitleWrapper={TitleWrapper}
        postCount={sequence.postsCount}
        readCount={sequence.readPostsCount}
        imageId={imageId}
        href={href}
        eventHandlers={eventHandlers}
        className={className}
      />
    </AnalyticsContext>
  );
};

const EASequenceCardComponent = registerComponent(
  "EASequenceCard",
  EASequenceCard,
);

declare global {
  interface ComponentTypes {
    EASequenceCard: typeof EASequenceCardComponent;
  }
}
