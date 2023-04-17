
export const formGroups: Partial<Record<string,FormGroupType>> = {
  default: {
    name: "default",
    order: 0,
    paddingStyle: true
  },
  siteCustomizations: {
    order: 1,
    label: "Site Customizations",
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
    label: "Privacy Settings",
    startCollapsed: true,
  },
  adminOptions: {
    name: "adminOptions",
    order: 25,
    label: "Admin Options",
    startCollapsed: true,
  },
  paymentInfo: {
    name: "paymentInfo",
    label: "Prize/Payment Info",
    order: 35,
    startCollapsed: false,
  },
  disabledPrivileges: {
    order:40,
    name: "disabledPrivileges",
    label: "Disabled Privileges",
    startCollapsed: true,
  },
  banUser: {
    order:50,
    name: "banUser",
    label: "Ban & Purge User",
    startCollapsed: true,
  },
  moderationGroup: {
    order:60,
    name: "moderation",
    label: "Moderation & Moderation Guidelines",
    startCollapsed: true,
  },
  aboutMe: {
    name: 'aboutMe',
    order: 100,
    label: 'About Me'
  },
  socialMedia: {
    name: 'socialMedia',
    order: 110,
    label: 'My Social Media'
  },
  activity: {
    name: 'activity',
    order: 120,
    label: 'My Activity'
  },
  deactivate: {
    order: 130,
    name: "deactivate",
    label: "Deactivate Account",
    startCollapsed: true,
  }
}
