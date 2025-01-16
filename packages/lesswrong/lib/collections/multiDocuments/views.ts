import { ensureCustomPgIndex } from "@/lib/collectionIndexUtils";
import { viewFieldAllowAny } from "@/lib/vulcan-lib/collections";
import { jsonArrayContainsSelector } from "@/lib/utils/viewUtils";
import { MultiDocuments } from "./collection";

declare global {
  interface LensBySlugViewTerms {
    view: 'lensBySlug',
    slug: string
  }

  interface SummariesByParentIdViewTerms {
    view: 'summariesByParentId',
    parentDocumentId: string
  }

  interface PingbackLensesViewTerms {
    view: 'pingbackLensPages',
    documentId?: string,
    excludedDocumentIds?: string[]
  }

  type MultiDocumentsViewTerms = Omit<ViewTermsBase, 'view'> & (LensBySlugViewTerms | SummariesByParentIdViewTerms | PingbackLensesViewTerms | {
    view?: undefined,
    slug?: undefined,
    parentDocumentId?: undefined,
    tagId?: undefined
  });
}

// TODO: replace this with a proper query that joins on tags to make sure we're not returning a lens for a deleted tag
MultiDocuments.addView("lensBySlug", function (terms: LensBySlugViewTerms) {
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

MultiDocuments.addView("summariesByParentId", function (terms: SummariesByParentIdViewTerms) {
  return {
    selector: {
      fieldName: 'summary',
      parentDocumentId: terms.parentDocumentId,
    },
    options: {
      sort: {
        index: 1
      },
    },
  };
});


MultiDocuments.addView("pingbackLensPages", (terms: PingbackLensesViewTerms) => {
  return {
    selector: {
      ...jsonArrayContainsSelector("pingbacks.Tags", terms.documentId),
      // _id: { $nin: terms.excludedDocumentIds ?? [] },
    },
  }
});
void ensureCustomPgIndex(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multi_documents_pingbacks ON "MultiDocuments" USING gin(pingbacks);`);
