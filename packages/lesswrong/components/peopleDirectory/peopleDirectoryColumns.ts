import type { ComponentProps } from "react";

const cellComponents = [
  "PeopleDirectoryUserCell",
  "PeopleDirectoryTextCell",
  "PeopleDirectoryDateCell",
  "PeopleDirectoryNumberCell",
  "PeopleDirectorySocialMediaCell",
  "PeopleDirectoryCareerStageCell",
] as const;

type CellComponentName = typeof cellComponents[number];

type PeopleDirectoryColumnState = {
  hideable: false,
} | {
  hideable: true,
  hidden: boolean,
}

export type PeopleDirectoryColumn<T extends CellComponentName = CellComponentName> = {
  label: string,
  sortField?: string,
  columnWidth?: string,
  componentName: T,
  props: Omit<ComponentProps<ComponentTypes[T]>, "user">,
} & PeopleDirectoryColumnState;

export const peopleDirectoryColumns: PeopleDirectoryColumn<CellComponentName>[] = [
  {
    label: "Name",
    sortField: "displayName.sort",
    columnWidth: "200px",
    componentName: "PeopleDirectoryUserCell",
    props: {},
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
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "bio",
    },
    hideable: true,
    hidden: false,
  },
  {
    label: "Social media",
    componentName: "PeopleDirectorySocialMediaCell",
    props: {},
    hideable: true,
    hidden: false,
  },
  {
    label: "Career stage",
    componentName: "PeopleDirectoryCareerStageCell",
    props: {},
    hideable: true,
    hidden: false,
  },
  {
    label: "Karma",
    columnWidth: "80px",
    componentName: "PeopleDirectoryNumberCell",
    props: {
      fieldName: "karma",
    },
    hideable: true,
    hidden: false,
  },
  {
    label: "Location",
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "mapLocationAddress",
    },
    hideable: true,
    hidden: true,
  },
  {
    label: "Profile updated",
    columnWidth: "120px",
    componentName: "PeopleDirectoryDateCell",
    props: {
      fieldName: "exportedAt",
      format: "MMM YYYY",
    },
    hideable: true,
    hidden: false,
  },
];
