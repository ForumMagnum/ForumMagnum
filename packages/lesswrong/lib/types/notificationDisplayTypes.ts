// We need enough fields here to render the user tooltip
type NotificationDisplayUser = Pick<
  UsersMinimumInfo,
  "_id" |
  "slug" |
  "createdAt" |
  "displayName" |
  "profileImageId" |
  "karma" |
  "deleted" |
  "htmlBio" |
  "postCount" |
  "commentCount"
>;

export type NotificationDisplay =
  Pick<DbNotification, "_id" | "type" | "link" | "createdAt"> & {
    post?: Pick<DbPost, "_id" | "title" | "slug"> & {
      user?: NotificationDisplayUser,
    },
    comment?: Pick<DbComment, "_id"> & {
      user?: NotificationDisplayUser,
      post?: Pick<DbPost, "_id" | "title" | "slug">,
    },
    tag?: Pick<DbTag, "_id" | "name" | "slug">,
    user?: NotificationDisplayUser,
    localgroup?: Pick<DbLocalgroup, "_id" | "name">,
  };
