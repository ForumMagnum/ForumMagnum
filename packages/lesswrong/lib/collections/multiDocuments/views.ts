import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { viewFieldAllowAny, jsonArrayContainsSelector } from "@/lib/utils/viewConstants";
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';
import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";

declare global {
  interface MultiDocumentsViewTerms extends ViewTermsBase {
    view: MultiDocumentsViewName | 'default'
    slug?: string,
    documentId?: string,
    parentDocumentId?: string,
    excludedDocumentIds?: string[]
  }
}

function defaultView(terms: MultiDocumentsViewTerms, _: ApolloClient<NormalizedCacheObject>, context?: ResolverContext) {
  const currentUser = context?.currentUser ?? null;

  return {
    selector: {
      ...(terms.excludedDocumentIds ? { _id: { $nin: terms.excludedDocumentIds } } : {}),
      ...(!userIsAdminOrMod(currentUser) ? { deleted: false } : {}),
    },
  };
}

function lensBySlug(terms: MultiDocumentsViewTerms) {
  return {
    selector: {
      $or: [
        { slug: terms.slug },
        { oldSlugs: terms.slug },
      ],
      collectionName: "Tags",
      fieldName: "description",
    },
  };
}

function summariesByParentId(terms: MultiDocumentsViewTerms) {
  return {
    selector: {
      fieldName: 'summary',
      parentDocumentId: terms.parentDocumentId,
      deleted: viewFieldAllowAny,
    },
    options: {
      sort: {
        index: 1
      },
    },
  };
}

function pingbackLensPages(terms: MultiDocumentsViewTerms) {
  return {
    selector: {
      $or: [
        jsonArrayContainsSelector("pingbacks.Tags", terms.documentId),
        jsonArrayContainsSelector("pingbacks.MultiDocuments", terms.documentId),
      ],
      fieldName: 'description',
    },
  };
}

export const MultiDocumentsViews = new CollectionViewSet('MultiDocuments', {
  lensBySlug,
  summariesByParentId,
  pingbackLensPages
}, defaultView);
