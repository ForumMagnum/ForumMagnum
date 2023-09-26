export const getSpotlightUrl = ({document, documentType}: SpotlightDisplay) => {
  switch (documentType) {
    case "Sequence":
      return `/s/${document._id}`;
    case "Post":
      return `/posts/${document._id}/${document.slug}`;
  }
}
