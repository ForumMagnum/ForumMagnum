import { useCallback, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "../routeUtil";
import type { ToCData } from "../tableOfContents";
import qs from "qs";
import omit from "lodash/omit";

export const MAIN_TAB_ID = 'main-tab';

export interface DocumentContributorWithStats {
  user: UsersMinimumInfo | null;
  currentAttributionCharCount: number;
  contributionScore: number;
}

export interface DocumentContributorsInfo {
  contributors: DocumentContributorWithStats[];
  totalCount: number;
}

export type TagLens = MultiDocumentMinimumInfo & {
  contents: TagFragment_description | TagRevisionFragment_description | RevisionDisplay | null;
  tableOfContents: ToCData | null;
  contributors: DocumentContributorsInfo | null;
  preview: string | null;
  originalLensDocument: MultiDocumentContentDisplay | MultiDocumentWithContributors | null;
  arbitalLinkedPages: ArbitalLinkedPagesFragment | null;
}

interface TagLensInfo {
  selectedLens?: TagLens;
  selectedLensId: string;
  updateSelectedLens: (lensId: string) => void;
  getSelectedLensUrlPath: (lensId: string) => string;
  lenses: TagLens[];
}

function getDefaultLens(tag: TagPageWithArbitalContentFragment | TagPageRevisionWithArbitalContentFragment | TagPageWithArbitalContentAndLensRevisionFragment | TagHistoryFragment): TagLens {
  return {
    _id: MAIN_TAB_ID,
    collectionName: 'Tags',
    fieldName: 'description',
    index: 0,
    contents: tag.description,
    tableOfContents: tag.tableOfContents,
    contributors: 'contributors' in tag ? tag.contributors : null,
    parentDocumentId: tag._id,
    title: tag.name,
    preview: null,
    tabTitle: 'Main',
    tabSubtitle: null,
    slug: 'main',
    oldSlugs: [],
    userId: tag.userId,
    deleted: false,
    createdAt: tag.createdAt,
    legacyData: {},
    originalLensDocument: null,
    arbitalLinkedPages: 'arbitalLinkedPages' in tag ? tag.arbitalLinkedPages : null,

    baseScore: tag.baseScore,
    extendedScore: tag.extendedScore,
    score: tag.score,
    afBaseScore: tag.afBaseScore,
    afExtendedScore: tag.afExtendedScore,
    voteCount: tag.voteCount,
    currentUserVote: tag.currentUserVote,
    currentUserExtendedVote: tag.currentUserExtendedVote,
  }
}

export function addDefaultLensToLenses(
  tag: TagPageWithArbitalContentFragment | TagPageRevisionWithArbitalContentFragment | TagPageWithArbitalContentAndLensRevisionFragment | TagHistoryFragment | null,
  lenses: MultiDocumentContentDisplay[] | MultiDocumentWithContributors[] | MultiDocumentWithContributorsRevision[] | undefined,
): TagLens[] {
  if (!tag || !lenses) return [];
  return [
    getDefaultLens(tag),
    ...lenses.map(lens => ({
      ...lens,
      index: lens.index + 1,
      title: lens.title ?? tag.name,
      contributors: 'contributors' in lens ? lens.contributors : null,
      arbitalLinkedPages: 'arbitalLinkedPages' in lens ? lens.arbitalLinkedPages : null,
      originalLensDocument: lens,
    }))
  ];
}

export function useTagLenses(tag: TagPageWithArbitalContentFragment | TagPageRevisionWithArbitalContentFragment | TagPageWithArbitalContentAndLensRevisionFragment | null): TagLensInfo {
  const { query, location } = useLocation();
  const queryLens = query.lens ?? query.l;
  const navigate = useNavigate();

  const availableLenses = useMemo(() => addDefaultLensToLenses(tag, tag?.lenses), [tag]);

  const querySelectedLens = useMemo(() =>
    availableLenses.find(lens => lens.slug === queryLens || lens.oldSlugs.includes(queryLens) || lens.legacyData?.arbitalPageId === queryLens),
    [availableLenses, queryLens]
  );

  const selectedLensId = querySelectedLens?._id ?? MAIN_TAB_ID;

  const selectedLens = useMemo(() =>
    availableLenses.find(lens => lens._id === selectedLensId),
    [selectedLensId, availableLenses]
  );

  const getSelectedLensLocation = useCallback((lensId: string) => {
    const selectedLensSlug = availableLenses.find(lens => lens._id === lensId)?.slug;
    if (!selectedLensSlug) return location;

    const defaultLens = availableLenses.find(lens => lens._id === MAIN_TAB_ID);
    const navigatingToDefaultLens = selectedLensSlug === defaultLens?.slug;
    const queryWithoutLensAndVersion = omit(query, ["l", "lens", "version"]);
    const newSearch = navigatingToDefaultLens
      ? qs.stringify(queryWithoutLensAndVersion)
      : qs.stringify({ lens: selectedLensSlug, ...queryWithoutLensAndVersion });

    return { pathname: location.pathname, search: newSearch, hash: location.hash };
  }, [availableLenses, location, query]);

  const updateSelectedLens = useCallback((lensId: string) => {
    const newLocation = getSelectedLensLocation(lensId);
    navigate(newLocation);
  }, [getSelectedLensLocation, navigate]);

  // For a given lensId, return the path that would would be navigated to if the user clicked on the lens
  const getSelectedLensUrlPath = useCallback((lensId: string) => {
    const location = getSelectedLensLocation(lensId);
    const searchPart = location.search ? `?${location.search}` : '';
    return `${location.pathname}${searchPart}${location.hash}`;
  }, [getSelectedLensLocation]);

  useEffect(() => {
    if (queryLens && tag && !querySelectedLens) {
      // If the lens doesn't exist, reset the search query
      navigate(
        { ...location, search: qs.stringify(omit(query, ["l", "lens"])) },
        { replace: true }
      );
    }
  }, [query, availableLenses, navigate, location, querySelectedLens, tag, queryLens]);

  return {
    selectedLens,
    selectedLensId,
    updateSelectedLens,
    getSelectedLensUrlPath,
    lenses: availableLenses,
  };
}
