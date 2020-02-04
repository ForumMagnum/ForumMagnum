import { TagRels } from './collection';
import { ensureIndex } from '../../collectionUtils';

TagRels.addDefaultView(terms => {
  return {
    selector: {
      deleted: false,
    },
    options: {
      sort: {baseScore: -1},
    },
  };
});

TagRels.addView('postsWithTag', terms => {
  return {
    selector: {
      tagId: terms.tagId,
      baseScore: {$gt: 0},
    },
  }
});

TagRels.addView('tagsOnPost', terms => {
  return {
    selector: {
      postId: terms.postId,
      baseScore: {$gt: 0},
    },
  }
});

ensureIndex(TagRels, {postId:1});
ensureIndex(TagRels, {tagId:1});
