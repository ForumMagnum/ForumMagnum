import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType): JssStyles => ({
});

const UserList = ({classes}: {
  classes: ClassesType,
  userList: string,
}) => {
  return <div>

  </div>;
}

const UserListComponent = registerComponent("UserList", UserList, {styles});

declare global {
  interface ComponentTypes {
    UserList: typeof UserListComponent,
  }
}
