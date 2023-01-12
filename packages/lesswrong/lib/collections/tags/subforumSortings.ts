/**
 * This is the one-source-of-truth for sortings that are available on subforums.
 * As well as defining the GraphQL types for sorting, this also defines the order
 * in which the options are shown in the dropdown list.
 */
export const subforumSortingTypes = {
  magic: "Float",
  top: "Int",
  recentComments: "Date",
  new: "Date",
  old: "Date",
} as const;

export type SubforumSorting = keyof typeof subforumSortingTypes;

export const defaultSubforumSorting: SubforumSorting = "magic";

export const subforumSortings = Object.keys(subforumSortingTypes) as SubforumSorting[];

export const subforumSortingToResolverName = (sort: SubforumSorting) =>
  sort[0].toUpperCase() + sort.slice(1);

export const isSubforumSorting = (sort: string): sort is SubforumSorting =>
  (subforumSortings as string []).includes(sort);
