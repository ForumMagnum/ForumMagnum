import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface TagRelsViewTerms extends ViewTermsBase {
    view?: TagRelsViewName
    tagId?: string
    postId?: string
  }
}

function defaultView(terms: TagRelsViewTerms) {
  return {
    selector: {
      deleted: false,
    },
    options: {
      sort: {baseScore: -1},
    },
  };
}

function postsWithTag(terms: TagRelsViewTerms) {
  return {
    selector: {
      tagId: terms.tagId,
      baseScore: {$gt: 0},
    },
  }
}

function tagsOnPost(terms: TagRelsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      baseScore: {$gt: 0},
    },
  }
}

export const TagRelsViews = new CollectionViewSet('TagRels', {
  postsWithTag,
  tagsOnPost
}, defaultView);
