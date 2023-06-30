import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
})

const UserListHover = ({list, classes}: {
  list: UserListFragment,
  classes: ClassesType,
}) => {
  return <div/>
}

const UserListHoverComponent = registerComponent('UserListHover', UserListHover, {styles});

declare global {
  interface ComponentTypes {
    UserListHover: typeof UserListHoverComponent
  }
}

