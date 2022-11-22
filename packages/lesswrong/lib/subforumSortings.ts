export const subforumSortingTypes = {
  recentComments: "Date",
  new: "Date",
  old: "Date",
  top: "Int",
} as const;

export type SubforumSorting = keyof typeof subforumSortingTypes;

export const subforumSortings = Object.keys(subforumSortingTypes) as SubforumSorting[];

export const subforumSortingToResolverName = (sort: SubforumSorting) =>
  sort[0].toUpperCase() + sort.slice(1);

export const isSubforumSorting = (sort: string): sort is SubforumSorting =>
  (subforumSortings as string []).includes(sort);
