import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
  notificationBell: {
    width: 17,
    height: 17,
    marginRight: 5,
  },
  dropdown: {
    '& .ForumDropdownMultiselect-button': {
      minHeight: 40,
    }
  }
})

const SUBSCRIBE_OPTIONS = {
  newUserComments: {
    label: "New comments"
  },
  newPosts: {
    label: "New posts"
  }
}

const UserNotifyDropdown = ({
  user,
  className,
  classes,
}: {
  user: UsersProfile,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { ForumDropdownMultiselect, ForumIcon } = Components;

  // <ForumDropdownMultiselect
  //             values={emailDigestFilter}
  //             options={emailDigestOptions}
  //             onSelect={handleUpdateEmailDigestFilter} />

  return (
    <ForumDropdownMultiselect
      label={
        <>
          <ForumIcon icon="BellBorder" className={classes.notificationBell} />
          Get notified
        </>
      }
      values={[]}
      options={SUBSCRIBE_OPTIONS}
      onSelect={(v) => {
        console.log(v);
      }}
      className={classes.dropdown}
    />
  );
}

const UserNotifyDropdownComponent = registerComponent('UserNotifyDropdown', UserNotifyDropdown, {styles});

declare global {
  interface ComponentTypes {
    UserNotifyDropdown: typeof UserNotifyDropdownComponent
  }
}
