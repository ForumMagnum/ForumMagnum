import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment NewRelatedPostRel on PostRelation {
    # Core fields
    _id
    parentPostId
    childPostId
  }
`);

registerFragment(`
  fragment ChildRelatedPostRelList on PostRelation {
    # Core fields
    _id
    parentPost {
      ...PostsBase
    }
    childPost {
      ...PostsBase
    }
  }
`);
