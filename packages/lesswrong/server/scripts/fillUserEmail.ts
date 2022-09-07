import { wrapVulcanAsyncScript } from "./utils";
import { Vulcan } from '../vulcan-lib';
import Users from "../../lib/vulcan-users";
import type { Filter } from "mongodb";

/**
 * Fixes users affected by a bug on 2021-10-05 where the NewUserCompleteProfile process was setting their email to null. Fortunately their emails were spared.
 */
Vulcan.fillUserEmail = wrapVulcanAsyncScript('fillUserEmail', async () => {
  const users = await (Users.find({
    createdAt: {$gt: new Date('2021-10-04')},
    // email doesn't have `| null` as part of its generated type in `DbUser`, which makes mongo complain that we're trying to find users without null email.  But we do have users who are missing that field (for now).
    email: null as unknown as Filter<DbUser>['email'],
  }).fetch())
  const userSlugs = users.map(user => user.slug)
  // eslint-disable-next-line no-console
  console.log('userSlugs', userSlugs)
  for (const user of users) {
    await Users.rawUpdateOne({_id: user._id}, {$set: {email: user.emails[0].address}})
  }
})
