/* eslint-disable no-console */

import Users from "../collections/users/collection";

export const swapUserEmails = async (userId1: string, userId2: string) => {
  console.log(`Fetching users: ${userId2}, ${userId2}`);
  const [user1, user2] = await Promise.all([
    Users.findOne({_id: userId1}),
    Users.findOne({_id: userId2}),
  ]);
  if (!user1 || !user2) {
    throw new Error("Invalid users");
  }
  console.log(`Fetched users: ${user1.displayName}, ${user2.displayName}`);
  await Promise.all([
    Users.rawUpdateOne({_id: user1._id}, {
      $set: {
        email: user2.email,
        emails: user2.emails,
        "services.auth0": user2.services.auth0,
      },
    }),
    Users.rawUpdateOne({_id: user2._id}, {
      $set: {
        email: user1.email,
        emails: user1.emails,
        "services.auth0": user1.services.auth0,
      },
    }),
  ]);
  console.log("Updated user emails");
}
