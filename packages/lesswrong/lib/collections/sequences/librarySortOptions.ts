/**
 * Sort options for the /library redesign's all-sequences list.
 *
 * The base options are the intended v1 product surface. The ranking options
 * are the sequences-sorting bake-off candidates (see
 * scripts/sequenceRankingBakeoff.ts), exposed in the sort popover so the
 * Phase-2 review can eyeball each mechanism on the live prototype; the
 * numbering matches the bake-off script/report. Once a winner is chosen it
 * becomes "Recommended" and the rest of the ranking options come back out.
 */

export interface LibrarySortOption {
  value: string;
  label: string;
}

export const LIBRARY_BASE_SORT_OPTIONS: LibrarySortOption[] = [
  {value: "recommended", label: "Recommended"},
  {value: "newest", label: "Newest"},
];

export const LIBRARY_RANKING_SORT_OPTIONS: LibrarySortOption[] = [
  {value: "karma5", label: "1 · Top-5 karma"},
  {value: "readers70", label: "2 · Readers ≥70%"},
  {value: "rankProd", label: "3 · Karma × readers"},
  {value: "complRate", label: "4 · Completion rate"},
  {value: "cohortPctl", label: "5 · Cohort percentile"},
  {value: "cohortRevFloor", label: "6 · Cohort + review floors"},
  {value: "inLinks", label: "7 · Inbound links"},
  {value: "bookmarks", label: "8 · Bookmarks"},
];

export const isLibraryRankingSort = (sortBy: string): boolean =>
  LIBRARY_RANKING_SORT_OPTIONS.some(option => option.value === sortBy);
