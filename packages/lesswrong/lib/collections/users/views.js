import Users from "meteor/vulcan:users";

Users.addView('LWUsersAdmin', terms => ({
  options: {
    sort: terms.sort
  }
}));
