import { isFriendlyUI, preferredHeadingCase } from "../../../themes/forumTheme";
import { isEAForum, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from "../../instanceSettings";

export const formGroups: Record<string, FormGroupType<"Posts">> = {
  default: {
    name: "default",
    order: 0,
    layoutComponentProps: {
      paddingStyling: true,
    }
  },
  category: {
    name: "category",
    order: -20,
    layoutComponent: "FormGroupPostTopBar",
  },
  title: {
    name: "title",
    order: -10,
    layoutComponentProps: {
      groupStyling: false,
      paddingStyling: true,
      flexAlignTopStyling: true
    }
  },
  coauthors: {
    order: 21,
    name: "coauthors",
    label: "Coauthors",
    hideHeader: true,
  },
  event: {
    name: "event details",
    order: 21,
    label: preferredHeadingCase("Event Details")
  },
  // Tags go here on EA Forum
  socialPreview: {
    name: "socialPreview",
    order: 23,
    label: preferredHeadingCase("Link Preview"),
    startCollapsed: !isFriendlyUI,
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
    label: preferredHeadingCase("Admin"),
    startCollapsed: true,
  },
  moderationGroup: {
    order: 60,
    name: "moderation",
    label: preferredHeadingCase("Moderation"),
    helpText: isFriendlyUI ? undefined : "We prefill these moderation guidelines based on your user settings. But you can adjust them for each post.",
    startCollapsed: true,
  },
  options: {
    order:10,
    name: "options",
    layoutComponentProps: {
      groupStyling: false,
      paddingStyling: true,
      flexStyling: true,
    }
  },
  content: { //TODO – should this be 'contents'? is it needed?
    order:20,
    name: "Content",
    layoutComponentProps: {
      groupStyling: false,
      paddingStyling: true,
    }
  },
  canonicalSequence: {
    order:30,
    name: "canonicalSequence",
    label: preferredHeadingCase("Canonical Sequence"),
    startCollapsed: true,
  },
  reactExperiment: {
    order: 35,
    name: "reactExperiment",
    label: "Reacts Experiment",
    startCollapsed: false,
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
    order: isEAForum ? 20 : 70,
    name: "tags",
    label: isEAForum ? `Set ${taggingNamePluralSetting.get()}` : `${taggingNamePluralCapitalSetting.get()}`,
    startCollapsed: true
  },
  glossary: {
    order: 65,
    name: "glossary",
    label: "Glossary",
    startCollapsed: false,
    hideHeader: true,
  }
};
