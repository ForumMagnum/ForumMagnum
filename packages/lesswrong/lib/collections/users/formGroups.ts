
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
  },
  siteCustomizations: {
    order: 1,
    label: "Site Customizations",
    name: "siteCustomizations"
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
    label: "Notifications"
  },
  emails: {
    order: 15,
    name: "emails",
    label: "Emails"
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
  truncationOptions: {
    name: "truncationOptions",
    order: 9,
    label: "Comment Truncation Options",
    startCollapsed: false,
  },
}
