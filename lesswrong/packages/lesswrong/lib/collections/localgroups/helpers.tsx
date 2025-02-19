export const localgroupGetUrl = (group: Pick<DbLocalgroup, "_id">) =>
  `/groups/${group._id}`;
