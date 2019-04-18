import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment NewRelatedPostRel on PostRelation {
    # Core fields
    _id
    sourcePostId
    targetPostId
  }
`);

registerFragment(`
  fragment ChildRelatedPostRelList on PostRelation {
    # Core fields
    _id
    sourcePost {
      ...PostsBase
    }
    targetPost {
      ...PostsBase
    }
  }
`);
