import { tagGetUrl } from "../tags/helpers";

export const getSpotlightUrl = <T extends SpotlightDisplay | SpotlightHeaderEventSubtitle>(spotlight: T): string => {
  const { post, sequence, tag } = spotlight;
  if (post) {
    return `/posts/${post._id}/${post.slug}`;
  } else if (sequence) {
    return `/s/${sequence._id}`;
  } else if (tag) {
    return tagGetUrl(tag);
  } else {
    // eslint-disable-next-line no-console
    console.error("Invalid spotlight", spotlight);
    return "";
  }
};
