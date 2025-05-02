
export const formGroups = {
  spotlight: {
    name: "spotlight",
    order: 0,
    label: "Spotlight",
    layoutComponentProps: {
      paddingStyling: true,
    }
  },
} satisfies Partial<Record<string, FormGroupType<"Spotlights">>>;
