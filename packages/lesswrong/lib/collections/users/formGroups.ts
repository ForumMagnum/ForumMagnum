
export const formGroups: Partial<Record<string,FormGroup>> = {
  default: {
    name: "default",
    order: 0,
    paddingStyle: true
  },
  moderationGroup: {
    order:60,
    name: "moderation",
    label: "Moderation & Moderation Guidelines",
    startCollapsed: true,
  },
  siteCustomizations: {
    order: 1,
    label: "Site Customizations",
    name: "siteCustomizations",
    startCollapsed: true,
  },
  banUser: {
    order:50,
    name: "banUser",
    label: "Ban & Purge User",
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
  paymentInfo: {
    name: "paymentInfo",
    label: "Prize/Payment Info",
    order: 35,
    startCollapsed: false,
  },
  adminOptions: {
    name: "adminOptions",
    order: 25,
    label: "Admin Options",
    startCollapsed: true,
  },
}
