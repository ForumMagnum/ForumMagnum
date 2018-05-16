import Users from "meteor/vulcan:users";

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
