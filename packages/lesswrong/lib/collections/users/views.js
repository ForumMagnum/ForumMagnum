import Users from "meteor/vulcan:users";
import moment from 'moment';

Users.addView('LWSunshinesList', function(terms) {
  return {
    selector: {groups:'sunshineRegiment'},
    options: {
      sort: terms.sort
    }
  }
});

Users.addView('LWTrustLevel1List', function(terms) {
  return {
    selector: {groups:'trustLevel1'},
    options: {
      sort: terms.sort
    }
  }
});

Users.addView('LWUsersAdmin', terms => ({
  options: {
    sort: terms.sort
  }
}));

Users.addView("usersWithBannedUsers", function () {
  return {
    selector: {
      bannedUserIds: {$exists: true}
    },
  }
})

Users.addView("sunshineNewUsers", function () {
  const twoDaysAgo = moment().subtract(2, 'days').toDate();
  return {
    selector: {
      createdAt: {$gt: twoDaysAgo},
      reviewedByUserId: {$exists: false},
      banned: {$exists: false},
    },
  }
})
