import { MultiDocuments } from "./collection";

declare global {
  interface LensBySlugViewTerms {
    view: 'lensBySlug',
    slug: string
  }

  type MultiDocumentsViewTerms = Omit<ViewTermsBase, 'view'> & (LensBySlugViewTerms | {
    view?: undefined,
    slug?: undefined
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
