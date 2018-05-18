import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment SunshineVoteFragment on Vote {
    ...VoteFragment
    userId
    documentId
    collectionName
    documentUserSlug
  }
`);
