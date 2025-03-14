import Users from '../../server/collections/users/collection';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';

const fixEmail = false;

if (fixEmail) { void (async ()=>{
  let usersCount = 0;
  let duplicateCount = 0;
  //eslint-disable-next-line no-console
  console.log("Running FixEmail on N users: ", (await Users.find().fetch()).length);
  const allUsers = await Users.find().fetch();
  await asyncForeachSequential(allUsers, async (user) => {
    if (user.legacy && user.email) {
      try {
      await Users.rawUpdateOne({_id: user._id}, {$set: {'emails': [{address: user.email, verified: true}]}});
      usersCount++;
      if (usersCount % 1000 === 0 ){
        //eslint-disable-next-line no-console
        console.log("Updated emails of n users: ", usersCount);
      }
    } catch(e) {
      duplicateCount++;
    }
    }
  })
  //eslint-disable-next-line no-console
  console.log("Found n duplicate emails: ", duplicateCount);
})()}
