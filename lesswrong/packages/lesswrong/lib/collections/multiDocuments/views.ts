import { ensureCustomPgIndex, ensureIndex } from "@/lib/collectionIndexUtils";
import { jsonArrayContainsSelector } from "@/lib/utils/viewUtils";
import { MultiDocuments } from "./collection";
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
import { viewFieldAllowAny } from "@/lib/vulcan-lib/collections.ts";

declare global {
  interface MultiDocumentsViewTerms extends ViewTermsBase {
    view?: MultiDocumentsViewName
    slug?: string,
    documentId?: string,
    parentDocumentId?: string,
    excludedDocumentIds?: string[]
  }
}

MultiDocuments.addDefaultView(function (terms: MultiDocumentsViewTerms, _, context?: ResolverContext) {
  const currentUser = context?.currentUser ?? null;

  return {
    selector: {
      ...(terms.excludedDocumentIds ? { _id: { $nin: terms.excludedDocumentIds } } : {}),
      ...(!userIsAdminOrMod(currentUser) ? { deleted: false } : {}),
    },
  };
});

MultiDocuments.addView("lensBySlug", function (terms: MultiDocumentsViewTerms) {
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
});

MultiDocuments.addView("summariesByParentId", function (terms: MultiDocumentsViewTerms) {
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
});

MultiDocuments.addView("pingbackLensPages", (terms: MultiDocumentsViewTerms) => {
  return {
    selector: {
      $or: [
        jsonArrayContainsSelector("pingbacks.Tags", terms.documentId),
        jsonArrayContainsSelector("pingbacks.MultiDocuments", terms.documentId),
      ],
      fieldName: 'description',
    },
  }
});
void ensureCustomPgIndex(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multi_documents_pingbacks ON "MultiDocuments" USING gin(pingbacks);`);
