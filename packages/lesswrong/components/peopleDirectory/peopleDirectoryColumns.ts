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
  sortable: boolean,
  componentName: T,
  props: Omit<ComponentProps<ComponentTypes[T]>, "user">,
}

export const peopleDirectoryColumns: PeopleDirectoryColumn<CellComponentName>[] = [
  {
    label: "Name",
    sortable: true,
    componentName: "PeopleDirectoryUserCell",
    props: {},
  },
  {
    label: "Role",
    sortable: true,
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "jobTitle",
    },
  },
  {
    label: "Organization",
    sortable: true,
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "organization",
    },
  },
  {
    label: "Bio",
    sortable: false,
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "bio",
    },
  },
  {
    label: "Social media",
    sortable: false,
    componentName: "PeopleDirectorySocialMediaCell",
    props: {},
  },
  {
    label: "Career stage",
    sortable: false,
    componentName: "PeopleDirectoryCareerStageCell",
    props: {},
  },
  {
    label: "Karma",
    sortable: false,
    componentName: "PeopleDirectoryNumberCell",
    props: {
      fieldName: "karma",
    },
  },
  {
    label: "Location",
    sortable: false,
    componentName: "PeopleDirectoryTextCell",
    props: {
      fieldName: "mapLocationAddress",
    },
  },
  {
    label: "Profile updated",
    sortable: false,
    componentName: "PeopleDirectoryDateCell",
    props: {
      fieldName: "exportedAt",
      format: "MMM YYYY",
    },
  },
];

