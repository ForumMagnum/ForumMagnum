export type NotificationDisplay =
  Pick<DbNotification, "_id" | "type" | "link" | "createdAt"> & {
    post?: Pick<DbPost, "_id" | "title" | "slug"> & {
      user?: Pick<DbUser, "_id" | "displayName" | "slug">,
    },
    comment?: Pick<DbComment, "_id"> & {
      user?: Pick<DbUser, "_id" | "displayName" | "slug">,
      post?: Pick<DbPost, "_id" | "title" | "slug">,
    },
    tag?: Pick<DbTag, "_id" | "name" | "slug">,
    user?: Pick<DbUser, "_id" | "displayName" | "slug">,
    localgroup?: Pick<DbLocalgroup, "_id" | "name">,
  };
