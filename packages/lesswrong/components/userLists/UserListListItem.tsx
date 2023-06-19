import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
});

const UserListListItem = ({userList, classes}: {
  userList: UserListFragment,
  classes: ClassesType,
}) => {
  return <div>
    <Link to={`/userLists/${userList._id}`}>
      {userList.name}
    </Link>
  </div>;
}

const UserListListItemComponent = registerComponent("UserListListItem", UserListListItem, {styles});

declare global {
  interface ComponentTypes {
    UserListListItem: typeof UserListListItemComponent,
  }
}
