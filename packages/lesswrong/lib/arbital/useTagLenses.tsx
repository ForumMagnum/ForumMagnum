import { useCallback, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "../routeUtil";
import type { ToCData } from "../tableOfContents";
import qs from "qs";
import omit from "lodash/omit";

export const MAIN_TAB_ID = 'main-tab';

export interface DocumentContributorWithStats {
  user: UsersMinimumInfo;
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

export function getAvailableLenses(tag: TagPageWithArbitalContentFragment | TagPageRevisionWithArbitalContentFragment | TagPageWithArbitalContentAndLensRevisionFragment | TagHistoryFragment | null): TagLens[] {
  if (!tag?.lenses) return [];
  return [
    getDefaultLens(tag),
    ...tag.lenses.map(lens => ({
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
  const navigate = useNavigate();

  const availableLenses = useMemo(() => getAvailableLenses(tag), [tag]);

  const querySelectedLens = useMemo(() =>
    // TODO: maybe we also want to check the oldSlugs?
    availableLenses.find(lens => lens.slug === query.lens || lens.oldSlugs.includes(query.lens) || lens.legacyData?.arbitalPageId === query.lens),
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
      const queryWithoutLensAndVersion = omit(query, ["lens", "version"]);
      const newSearch = navigatingToDefaultLens
       ? qs.stringify(queryWithoutLensAndVersion)
       : qs.stringify({ lens: selectedLensSlug, ...queryWithoutLensAndVersion });

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
