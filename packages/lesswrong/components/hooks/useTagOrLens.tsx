import { useMulti, UseMultiOptions } from "@/lib/crud/withMulti";
import { useTagBySlug } from "../tagging/useTag";
import { hasWikiLenses } from "@/lib/betas";

export function useTagOrLens<TagFragmentTypeName extends FragmentTypesByCollection['Tags']>(
  slug: string,
  tagFragmentName: TagFragmentTypeName,
  tagQueryOptions: Partial<UseMultiOptions<TagFragmentTypeName, "Tags">>
): {
  tag: FragmentTypes[TagFragmentTypeName]|null,
  loadingTag: boolean,
  tagError: any,
  refetchTag: () => Promise<void>,
  lens: MultiDocumentParentDocument|null,
  loadingLens: boolean,
  lensError: any
} {
  const { tag, loading: loadingTag, error: tagError, refetch: refetchTag } = useTagBySlug(slug, tagFragmentName, tagQueryOptions);

  const { results: lensWithParentTag, loading: loadingLens, error: lensError } = useMulti({
    collectionName: 'MultiDocuments',
    fragmentName: 'MultiDocumentParentDocument',
    terms: {
      view: 'lensBySlug',
      slug: slug,
    },
    // Having a limit of 1 makes this fail if we have copies of this lens for deleted tags which don't get returned for permissions reasons
    // so we get as many as we can and assume that we'll only ever actually get at most one back
    skip: !hasWikiLenses || !slug,
  });

  return {
    tag,
    loadingTag,
    tagError,
    refetchTag,
    lens: lensWithParentTag?.[0] ?? null,
    loadingLens,
    lensError,
  };
}

