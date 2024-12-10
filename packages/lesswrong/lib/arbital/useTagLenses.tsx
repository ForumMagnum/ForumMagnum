import { useCallback, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "../routeUtil";
import type { ToCData } from "../tableOfContents";
import qs from "qs";
import omit from "lodash/omit";

export const MAIN_TAB_ID = 'main-tab';

export interface TagLens {
  _id: string;
  collectionName: string;
  fieldName: string;
  index: number;
  contents: TagFragment_description | TagRevisionFragment_description | RevisionDisplay | null;
  tableOfContents: ToCData | null;
  parentDocumentId: string;
  title: string;
  preview: string | null;
  tabTitle: string;
  tabSubtitle: string | null;
  slug: string;
  userId: string;
  legacyData: AnyBecauseHard;
  originalLensDocument: MultiDocumentEdit | null;
}

interface TagLensInfo {
  selectedLens?: TagLens;
  selectedLensId: string;
  updateSelectedLens: (lensId: string) => void;
  lenses: TagLens[];
}

function getDefaultLens(tag: TagPageFragment|TagPageWithRevisionFragment|TagHistoryFragment): TagLens {
  return {
    _id: MAIN_TAB_ID,
    collectionName: 'Tags',
    fieldName: 'description',
    index: 0,
    contents: tag.description,
    tableOfContents: tag.tableOfContents,
    parentDocumentId: tag._id,
    title: tag.name,
    preview: null,
    tabTitle: 'Main',
    tabSubtitle: null,
    slug: 'main',
    userId: tag.userId,
    legacyData: {},
    originalLensDocument: null,
  }
}

export function getAvailableLenses(tag: TagPageFragment|TagPageWithRevisionFragment|TagHistoryFragment|null) {
  if (!tag) return [];
  return [
    getDefaultLens(tag),
    ...tag.lenses.map(lens => ({
      ...lens,
      index: lens.index + 1,
      title: lens.title ?? tag.name,
      originalLensDocument: lens,
    }))
  ];
}

export function useTagLenses(tag: TagPageFragment | TagPageWithRevisionFragment | null): TagLensInfo {
  const { query, location } = useLocation();
  const navigate = useNavigate();
  const availableLenses = useMemo(() => getAvailableLenses(tag), [tag]);

  const querySelectedLens = useMemo(() =>
    // TODO: maybe we also want to check the oldSlugs?
    availableLenses.find(lens => lens.slug === query.lens || lens.legacyData?.arbitalPageId === query.lens),
    [availableLenses, query.lens]
  );

  const selectedLensId = querySelectedLens?._id ?? MAIN_TAB_ID;

  const selectedLens = useMemo(() =>
    availableLenses.find(lens => lens._id === selectedLensId),
    [selectedLensId, availableLenses]
  );

  const updateSelectedLens = useCallback((lensId: string) => {
    const selectedLensSlug = availableLenses.find(lens => lens._id === lensId)?.slug;
    if (selectedLensSlug) {
      const defaultLens = availableLenses.find(lens => lens._id === MAIN_TAB_ID);
      const navigatingToDefaultLens = selectedLensSlug === defaultLens?.slug;
      const queryWithoutLens = omit(query, "lens");
      const newSearch = navigatingToDefaultLens
       ? qs.stringify(queryWithoutLens)
       : qs.stringify({ lens: selectedLensSlug, ...queryWithoutLens });

      navigate({ ...location, search: newSearch });
    }
  }, [availableLenses, location, navigate, query]);

  useEffect(() => {
    if (query.lens && tag && !querySelectedLens) {
      // If the lens doesn't exist, reset the search query
      navigate(
        { ...location, search: qs.stringify(omit(query, "lens")) },
        { replace: true }
      );
    }
  }, [query, availableLenses, navigate, location, querySelectedLens, tag]);

  return {
    selectedLens,
    selectedLensId,
    updateSelectedLens,
    lenses: availableLenses,
  };
}
