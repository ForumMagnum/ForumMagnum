import type { ComponentProps } from "react";
import { taggingNameCapitalSetting } from "@/lib/instanceSettings";

const cellComponents = [
  "PeopleDirectoryUserCell",
  "PeopleDirectoryTextCell",
  "PeopleDirectoryDateCell",
  "PeopleDirectoryNumberCell",
  "PeopleDirectorySocialMediaCell",
  "PeopleDirectoryCareerStageCell",
  "PeopleDirectorySkeletonUserCell",
  "PeopleDirectorySkeletonTextCell",
  "PeopleDirectoryTopicsCell",
  "PeopleDirectoryCommentCountCell",
  "PeopleDirectoryPostsCell",
] as const;

type CellComponentName = typeof cellComponents[number];

type PeopleDirectoryColumnState = {
  hideable: false,
} | {
  hideable: true,
  hidden: boolean,
}

export type PeopleDirectoryColumn<
  T extends CellComponentName = CellComponentName,
  S extends CellComponentName = CellComponentName
> = {
  label: string,
  shortLabel?: string,
  sortField?: string,
  defaultSort?: "asc" | "desc",
  columnWidth?: string,
  componentName: T,
  props?: Omit<ComponentProps<ComponentTypes[T]>, "user"|"ref">,
  skeletonComponentName?: S,
  skeletonProps?: Omit<ComponentProps<ComponentTypes[S]>, "user"|"ref">,
} & PeopleDirectoryColumnState;

export const peopleDirectoryColumns: PeopleDirectoryColumn<CellComponentName>[] = [
  {
    label: "Name",
    sortField: "displayName.sort",
    columnWidth: "200px",
    componentName: "PeopleDirectoryUserCell",
    skeletonComponentName: "PeopleDirectorySkeletonUserCell",
    hideable: false,
  },
  {
    label: "Role",
    sortField: "jobTitle.sort",
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "jobTitle",
    },
    hideable: true,
    hidden: false,
  },
  {
    label: "Organization",
    sortField: "organization.sort",
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "organization",
    },
    hideable: true,
    hidden: false,
  },
  {
    label: "Bio",
    columnWidth: "1.5fr",
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "bio",
    },
    skeletonComponentName: "PeopleDirectorySkeletonTextCell",
    skeletonProps: {
      lines: 2,
    },
    hideable: true,
    hidden: false,
  },
  {
    label: "Social media",
    columnWidth: "140px",
    componentName: "PeopleDirectorySocialMediaCell",
    hideable: true,
    hidden: false,
  },
  {
    label: "Career stage",
    columnWidth: "175px",
    componentName: "PeopleDirectoryCareerStageCell",
    hideable: true,
    hidden: false,
  },
  {
    label: `${taggingNameCapitalSetting.get()} interests`,
    columnWidth: "1.5fr",
    componentName: "PeopleDirectoryTopicsCell",
    hideable: true,
    hidden: false,
  },
  {
    label: "Karma",
    sortField: "karma",
    defaultSort: "desc",
    columnWidth: "80px",
    componentName: "PeopleDirectoryNumberCell",
    props: {
      fieldName: "karma",
    },
    hideable: true,
    hidden: false,
  },
  {
    label: "Comments",
    sortField: "commentCount",
    defaultSort: "desc",
    columnWidth: "auto",
    componentName: "PeopleDirectoryCommentCountCell",
    hideable: true,
    hidden: false,
  },
  {
    label: "Top post",
    columnWidth: "200px",
    componentName: "PeopleDirectoryPostsCell",
    hideable: true,
    hidden: false,
  },
  {
    label: "Location",
    sortField: "mapLocationAddress.sort",
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "mapLocationAddress",
    },
    hideable: true,
    hidden: true,
  },
  {
    label: "Profile last updated",
    shortLabel: "Profile updated",
    sortField: "profileUpdatedAt",
    defaultSort: "desc",
    columnWidth: "120px",
    componentName: "PeopleDirectoryDateCell",
    props: {
      fieldName: "profileUpdatedAt",
      format: "MMM YYYY",
    },
    hideable: true,
    hidden: true,
  },
];
