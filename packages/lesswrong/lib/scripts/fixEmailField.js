import Users from 'meteor/vulcan:users';

const fixEmail = false;

if (fixEmail) {
  let usersCount = 0;
  let duplicateCount = 0;
  console.log("Running FixEmail");
  console.log(Users.find().fetch().length);
  Users.find().fetch().forEach((user) => {
    if (user.legacy && user.email) {
      try {
      Users.update({_id: user._id}, {$set: {'emails': [{address: user.email, verified: true}]}});
      usersCount++;
      if (usersCount % 1000 == 0 ){
        console.log("Updated emails of n users: ", usersCount);
      }
    } catch(e) {
      duplicateCount++;
    }
    }
  })
  console.log("Found n duplicate emails: ", duplicateCount);
}
