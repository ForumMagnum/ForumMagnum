import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface BookmarksViewTerms extends ViewTermsBase {
    view?: BookmarksViewName
    limit?: number
    userId?: string
    documentId?: string
    collectionName?: "Posts" | "Comments"
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
      active: true,
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
      active: true,
    },
    options: {
      sort: {
        lastUpdated: -1,
      },
    },
  };
}

function userDocumentBookmark(terms: BookmarksViewTerms, _: any, context: ResolverContext) {
  const { userId, documentId, collectionName } = terms;

  if (!userId || !documentId || !collectionName) {
    throw new Error("Missing required parameters for userDocumentBookmark view: userId, documentId, collectionName");
  }

  return {
    selector: {
      userId,
      documentId,
      collectionName,
      active: true,
    },
    options: {
      sort: {},
    },
  };
}

export const BookmarksViews = new CollectionViewSet('Bookmarks', {
  myBookmarkedPosts,
  myBookmarks,
  userDocumentBookmark,
});

const views = {
  myBookmarkedPosts,
  myBookmarks,
  userDocumentBookmark,
};

export default views;
