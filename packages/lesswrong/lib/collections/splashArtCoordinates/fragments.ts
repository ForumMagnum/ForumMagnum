import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment PodcastSelect on splashArtCoordinates {
    _id
    postId
    imageId
    splashArtImageUrl
    logTime
    xCoordinate
    yCoordinate
    width
    height
  }
`);
