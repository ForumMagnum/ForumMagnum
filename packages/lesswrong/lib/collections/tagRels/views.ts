import { TagRels } from './collection';
import { ensureIndex, ensurePgIndex } from '../../collectionUtils';

declare global {
  interface TagRelsViewTerms extends ViewTermsBase {
    view?: TagRelsViewName
    tagId?: string
    postId?: string
  }
}


TagRels.addDefaultView((terms: TagRelsViewTerms) => {
  return {
    selector: {
      deleted: false,
    },
    options: {
      sort: {baseScore: -1},
    },
  };
});

TagRels.addView('postsWithTag', (terms: TagRelsViewTerms) => {
  return {
    selector: {
      tagId: terms.tagId,
      baseScore: {$gt: 0},
    },
  }
});

TagRels.addView('tagsOnPost', (terms: TagRelsViewTerms) => {
  return {
    selector: {
      postId: terms.postId,
      baseScore: {$gt: 0},
    },
  }
});

ensureIndex(TagRels, {postId:1});
ensureIndex(TagRels, {tagId:1});

ensurePgIndex(TagRels, "tagsOnPost", "USING BTREE (((json->'deleted')::boolean), (json->>'postId'), ((json->'baseScore')::float))");
