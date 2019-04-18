import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment NewRelatedPostRel on RelatedPostRel {
    # Core fields
    _id
    parentPostId
    childPostId
  }
`);

registerFragment(`
  fragment ChildRelatedPostRelList on RelatedPostRel {
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
