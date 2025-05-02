import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface BookmarksViewTerms extends ViewTermsBase {
    view?: BookmarksViewName
    limit?: number
    userId?: string
  }
}

function myBookmarkedPosts(terms: BookmarksViewTerms, _: any, context: ResolverContext) {
  if (!context.currentUser?._id) {
    throw new Error("Cannot view bookmarks when not logged in");
  }

  return {
    selector: {
      userId: context.currentUser._id,
      collectionName: "Posts",
      cancelled: false,
    },
    options: {
      sort: {
        lastUpdated: -1,
      },
    },
  };
}

function myBookmarks(terms: BookmarksViewTerms, _: any, context: ResolverContext) {
  if (!context.currentUser?._id) {
    throw new Error("Cannot view bookmarks when not logged in");
  }

  return {
    selector: {
      userId: context.currentUser._id,
      cancelled: false,
    },
    options: {
      sort: {
        lastUpdated: -1,
      },
    },
  };
}

export const BookmarksViews = new CollectionViewSet('Bookmarks', {
  myBookmarkedPosts,
  myBookmarks,
});

const views = {
  myBookmarkedPosts,
  myBookmarks,
};

export default views;
