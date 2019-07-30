import { Users } from 'meteor/vulcan:users';

console.log("permissions Users: ", Users)

Users.createGroup("sunshineRegiment");
Users.createGroup("trustLevel1");
Users.createGroup("canModeratePersonal");
Users.createGroup("canCommentLock");
