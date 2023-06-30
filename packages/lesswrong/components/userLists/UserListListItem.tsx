import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  link: {
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily
  }
});

const UserListListItem = ({userList, classes}: {
  userList: UserListFragment,
  classes: ClassesType,
}) => {
  const {LWTooltip, UserListHover} = Components
  
  return <div>
    <LWTooltip title={<UserListHover list={userList}/>} tooltip={false} clickable>
      <Link to={`/userLists/${userList._id}`} className={classes.link}>
        {userList.name}
      </Link>
    </LWTooltip>
  </div>;
}

const UserListListItemComponent = registerComponent("UserListListItem", UserListListItem, {styles});

declare global {
  interface ComponentTypes {
    UserListListItem: typeof UserListListItemComponent,
  }
}
