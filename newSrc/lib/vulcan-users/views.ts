import Users from '../collections/users/collection';

Users.addView('usersAdmin', terms => ({
  options: {
    sort: {createdAt: -1}
  }
}));
