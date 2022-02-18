
export const formGroups: Partial<Record<string,FormGroup>> = {
  default: {
    name: "default",
    order: 0,
    paddingStyle: true
  },
  tags: {
    name: "tags",
    order: 5,
    defaultStyle: true,
  },
  adminOptions: {
    name: "adminOptions",
    order: 25,
    label: "Admin Options",
    startCollapsed: true,
  },
  event: {
    name: "event details",
    order: 21,
    label: "Event Details"
  },
  moderationGroup: {
    order: 60,
    name: "moderation",
    label: "Moderation Guidelines",
    helpText: "We prefill these moderation guidelines based on your user settings. But you can adjust them for each post.",
    startCollapsed: true,
  },
  options: {
    order:10,
    name: "options",
    defaultStyle: true,
    paddingStyle: true,
    flexStyle: true
  },
  content: { //TODO – should this be 'contents'? is it needed?
    order:20,
    name: "Content",
    defaultStyle: true,
    paddingStyle: true,
  },
  canonicalSequence: {
    order:30,
    name: "canonicalSequence",
    label: "Canonical Sequence",
    startCollapsed: true,
  },
  advancedOptions: {
    order:40,
    name: "advancedOptions",
    label: "Options",
    startCollapsed: true,
  },
  highlight: {
    order: 21,
    name: "highlight",
    label: "Highlight",
    startCollapsed: true,
  }
};
