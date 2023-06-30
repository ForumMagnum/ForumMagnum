import UserLists from "../userLists/collection";

declare global {
  interface UserListsViewTerms extends ViewTermsBase {
    view?: UserListsViewName
    userId?: string,
  }
}

UserLists.addDefaultView(function(terms: UserListsViewTerms) {
  return {
    selector: {deleted: false}
  }
})

UserLists.addView('userListContainsUser', function(terms: UserListsViewTerms) {
  return {
    selector: {memberIds: terms.userId},
    options: {
      sort: {createdAt: -1},
    }
  }
});

UserLists.addView('userListOwnedByUser', function(terms: UserListsViewTerms) {
  return {
    selector: {userId: terms.userId},
    options: {
      sort: {createdAt: -1},
    }
  }
});

UserLists.addView('publicLists', function(terms: UserListsViewTerms) {
  return {
    selector: {isPublic: true},
    options: {
      sort: {createdAt: -1},
    }
  }
});
