import { registerFragment } from '../../vulcan-lib';

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
