import { isFriendlyUI, preferredHeadingCase } from "../../../themes/forumTheme";

export const formGroups: Partial<Record<string, FormGroupType<"Users">>> = {
  default: {
    name: "default",
    order: 0,
    layoutComponentProps: {
      paddingStyling: true
    }
  },
  siteCustomizations: {
    order: 1,
    label: preferredHeadingCase("Site Customizations"),
    name: "siteCustomizations",
    startCollapsed: true,
  },
  notifications: {
    order: 10,
    name: "notifications",
    label: "Notifications",
    startCollapsed: true,
  },
  emails: {
    order: 15,
    name: "emails",
    label: "Emails",
    startCollapsed: true,
  },
  privacy: {
    order: 16,
    name: "privacy",
    label: preferredHeadingCase("Privacy Settings"),
    startCollapsed: true,
  },
  adminOptions: {
    name: "adminOptions",
    order: 25,
    label: preferredHeadingCase("Admin Options"),
    startCollapsed: true,
  },
  paymentInfo: {
    name: "paymentInfo",
    label: preferredHeadingCase("Prize/Payment Info"),
    order: 35,
    startCollapsed: false,
  },
  disabledPrivileges: {
    order:40,
    name: "disabledPrivileges",
    label: preferredHeadingCase("Disabled Privileges"),
    startCollapsed: true,
  },
  banUser: {
    order:50,
    name: "banUser",
    label: preferredHeadingCase("Ban & Purge User"),
    startCollapsed: true,
  },
  moderationGroup: {
    order:60,
    name: "moderation",
    label: preferredHeadingCase(isFriendlyUI ? "Moderation" : "Moderation & Moderation Guidelines"),
    startCollapsed: true,
  },
  generalInfo: {
    name: "generalInfo",
    order: 90,
    label: "General info",
  },
  aboutMe: {
    name: 'aboutMe',
    order: 100,
    label: isFriendlyUI ? "About you" : "About Me",
  },
  socialMedia: {
    name: 'socialMedia',
    order: 110,
    label: isFriendlyUI ? "Social media" : "My Social Media",
  },
  activity: {
    name: 'activity',
    order: 120,
    label: isFriendlyUI ? "Participation" : "My Activity",
  },
  deactivate: {
    order: 130,
    name: "deactivate",
    label: preferredHeadingCase("Deactivate Account"),
    startCollapsed: true,
  },
};
