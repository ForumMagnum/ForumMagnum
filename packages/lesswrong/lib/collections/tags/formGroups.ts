export const formGroups: Partial<Record<string, FormGroupType<"Tags">>> = {
  advancedOptions: {
    name: "advancedOptions",
    order: 20,
    label: "Advanced Options",
    startCollapsed: true,
  },
  subforumWelcomeMessage: {
    name: "subforumWelcomeMessage",
    order: 30,
    label: "Sidebar Welcome Message",
    startCollapsed: true,
  },
  subforumModerationGuidelines: {
    name: "subforumModerationGuidelines",
    order: 40,
    label: "Subforum Comment Guidelines",
    startCollapsed: true,
  },
};
