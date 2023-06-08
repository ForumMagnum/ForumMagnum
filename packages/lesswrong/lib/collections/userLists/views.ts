import UserLists from "../userLists/collection";

declare global {
  interface UserListsViewTerms extends ViewTermsBase {
    view?: UserListsViewName
    userId?: string,
  }
}

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
