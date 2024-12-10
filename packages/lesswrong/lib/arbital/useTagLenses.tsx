import { useCallback, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "../routeUtil";
import type { ToCData } from "../tableOfContents";
import qs from "qs";

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
  originalLensDocument: MultiDocumentEdit | null;
  arbitalLinkedPages: ArbitalLinkedPagesFragment | null;
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
    originalLensDocument: null,
    arbitalLinkedPages: tag.arbitalLinkedPages,
  }
}

// TODO: get rid of this and use the lens slug when we fix the import to get the correct alias from lens.lensId's pageInfo
function getImputedSlug(lens: MultiDocumentEdit) {
  const slugComponents = lens.tabTitle.split(' ');

  if (lens.tabSubtitle) {
    slugComponents.push(...lens.tabSubtitle.split(' '));
  }

  return slugComponents.join('_').toLowerCase();
}

export function getAvailableLenses(tag: TagPageFragment|TagPageWithRevisionFragment|TagHistoryFragment|null) {
  if (!tag) return [];
  return [
    getDefaultLens(tag),
    ...tag.lenses.map(lens => ({
      ...lens,
      index: lens.index + 1,
      title: lens.title ?? tag.name,
      slug: getImputedSlug(lens),
      originalLensDocument: lens,
    }))
  ];
}

export function useTagLenses(tag: TagPageFragment | TagPageWithRevisionFragment | null): TagLensInfo {
  const { query, location } = useLocation();
  const navigate = useNavigate();
  const availableLenses = useMemo(() => getAvailableLenses(tag), [tag]);

  const querySelectedLens = useMemo(() =>
    availableLenses.find(lens => lens.slug === query.lens),
    [availableLenses, query.lens]
  );

  const [selectedLensId, setSelectedLensId] = useState<string>(querySelectedLens?._id ?? MAIN_TAB_ID);

  const selectedLens = useMemo(() =>
    availableLenses.find(lens => lens._id === selectedLensId),
    [selectedLensId, availableLenses]
  );

  const updateSelectedLens = useCallback((lensId: string) => {
    setSelectedLensId(lensId);
    const selectedLensSlug = availableLenses.find(lens => lens._id === lensId)?.slug;
    if (selectedLensSlug) {
      const defaultLens = availableLenses.find(lens => lens._id === MAIN_TAB_ID);
      const navigatingToDefaultLens = selectedLensSlug === defaultLens?.slug;
      const newSearch = navigatingToDefaultLens
       ? ''
       : `?${qs.stringify({ lens: selectedLensSlug })}`;

      navigate({ ...location, search: newSearch });
    }
  }, [availableLenses, location, navigate]);

  useEffect(() => {
    if (query.lens) {
      if (querySelectedLens) {
        setSelectedLensId(querySelectedLens._id);
      } else {
        // If the lens doesn't exist, reset the search query
        navigate({ ...location, search: '' }, { replace: true });
      }
    }
  }, [query.lens, availableLenses, navigate, location, querySelectedLens]);

  return {
    selectedLens,
    selectedLensId,
    updateSelectedLens,
    lenses: availableLenses,
  };
}