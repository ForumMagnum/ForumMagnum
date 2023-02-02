import { forumTypeSetting, taggingNamePluralSetting } from "../../instanceSettings";

const isEAForum = forumTypeSetting.get() === "EAForum";

export const formGroups: Partial<Record<string,FormGroup>> = {
  default: {
    name: "default",
    order: 0,
    paddingStyle: true,
  },
  title: {
    name: "title",
    order: -10,
    paddingStyle: true,
    defaultStyle: true,
    flexStyle: true,
  },
  coauthors: {
    order: 21,
    name: "coauthors",
    label: "Coauthors"
  },
  event: {
    name: "event details",
    order: 21,
    label: "Event details"
  },
  // Tags go here on EA Forum
  socialPreview: {
    name: "socialPreview",
    order: 23,
    label: "Edit link preview",
    startCollapsed: !isEAForum,
  },
  highlight: {
    order: 24,
    name: "highlight",
    label: "Highlight",
    startCollapsed: true,
  },
  adminOptions: {
    name: "adminOptions",
    order: 25,
    label: "Admin options",
    startCollapsed: true,
  },
  moderationGroup: {
    order: 60,
    name: "moderation",
    label: "Moderation guidelines",
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
    label: "Canonical sequence",
    startCollapsed: true,
  },
  advancedOptions: {
    order:40,
    name: "advancedOptions",
    label: "Options",
    startCollapsed: true,
  },
  audio: {
    order: 50,
    name: "audio",
    label: "Audio",
    startCollapsed: true
  },
  tags: {
    order: isEAForum ? 22 : 60,
    name: "tags",
    label: `Set ${taggingNamePluralSetting.get()}`,
    startCollapsed: false
  }
};
