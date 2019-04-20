import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment NewRelatedPostRel on PostRelation {
    # Core fields
    _id
    type
    sourcePostId
    targetPostId
  }
`);

registerFragment(`
  fragment ChildRelatedPostRelList on PostRelation {
    # Core fields
    _id
    type
    sourcePost {
      ...PostsBase
    }
    targetPost {
      ...PostsBase
    }
  }
`);
