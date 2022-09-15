

export const formGroups: Partial<Record<string,FormGroup>> = {
  advancedOptions: {
    name: "advancedOptions",
    order: 20,
    label: "Advanced Options",
    startCollapsed: true,
  },
  subforumWelcomeMessage: {
    name: "subforumWelcomeMessage",
    order: 30,
    label: "Subforum Welcome Message",
    startCollapsed: true,
  },
  subforumShortDescription: {
    name: "subforumShortDescription",
    order: 40,
    label: "Subforum Short Description",
    startCollapsed: true,
  },
};
