import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMulti } from "../../lib/crud/withMulti";

const styles = (theme: ThemeType): JssStyles => ({
});

const UserListsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { results: listsUserManages, loading } = useMulti({
    terms: {
      view: 'userListContainsUser'
    },
    collectionName: "UserLists",
    fragmentName: 'UserListFragment',
  })
  return <div>
    {listsUserManages?.map((list: UserListFragment) => <a href={`/userLists/${list._id}`}>{list.name}</a>)}
    {/* <UserList /> */}
    {/* lists you're in */}

    {/* lists you manage */}
    {/* create new list button */}
  </div>;
}

const UserListsPageComponent = registerComponent("UserListsPage", UserListsPage, {styles});

declare global {
  interface ComponentTypes {
    UserListsPage: typeof UserListsPageComponent,
  }
}
