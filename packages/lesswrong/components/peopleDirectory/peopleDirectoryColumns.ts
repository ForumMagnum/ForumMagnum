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

export type PeopleDirectoryColumn<T extends CellComponentName = CellComponentName> = {
  label: string,
  sortField?: string,
  componentName: T,
  props: Omit<ComponentProps<ComponentTypes[T]>, "user">,
}

export const peopleDirectoryColumns: PeopleDirectoryColumn<CellComponentName>[] = [
  {
    label: "Name",
    sortField: "displayName.sort",
    componentName: "PeopleDirectoryUserCell",
    props: {},
  },
  {
    label: "Role",
    sortField: "jobTitle.sort",
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "jobTitle",
    },
  },
  {
    label: "Organization",
    sortField: "organization.sort",
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "organization",
    },
  },
  {
    label: "Bio",
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "bio",
    },
  },
  {
    label: "Social media",
    componentName: "PeopleDirectorySocialMediaCell",
    props: {},
  },
  {
    label: "Career stage",
    componentName: "PeopleDirectoryCareerStageCell",
    props: {},
  },
  {
    label: "Karma",
    componentName: "PeopleDirectoryNumberCell",
    props: {
      fieldName: "karma",
    },
  },
  {
    label: "Location",
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "mapLocationAddress",
    },
  },
  {
    label: "Profile updated",
    componentName: "PeopleDirectoryDateCell",
    props: {
      fieldName: "exportedAt",
      format: "MMM YYYY",
    },
  },
];
