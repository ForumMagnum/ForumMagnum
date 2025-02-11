import { tagGetUrl } from "../tags/helpers";

export const getSpotlightUrl = <T extends { document: SpotlightDisplay_document | SpotlightHeaderEventSubtitle_document }>(spotlight: T): string => {
  const { document } = spotlight;
  switch (document.__typename) {
    case "Sequence":
      return `/s/${document._id}`;
    case "Post":
      return `/posts/${document._id}/${document.slug}`;
    case "Tag":
      return tagGetUrl(document);
  }
};
