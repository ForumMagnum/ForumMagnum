export const subforumSortingTypes = {
  new: "Date",
  old: "Date",
  top: "Int",
} as const;

export const subforumSortings = Object.keys(subforumSortingTypes);

export type SubforumSorting = keyof typeof subforumSortingTypes;
