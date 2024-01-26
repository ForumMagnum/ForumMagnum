export const getSpotlightUrl = ({document, documentType}: SpotlightHeaderEventSubtitle) => {
  switch (documentType) {
    case "Sequence":
      return `/s/${document._id}`;
    case "Post":
      return `/posts/${document._id}/${document.slug}`;
  }
}
