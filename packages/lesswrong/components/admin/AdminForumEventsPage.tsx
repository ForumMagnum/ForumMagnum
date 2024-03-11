import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

export const AdminForumEventsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const {ErrorAccessDenied, WrappedSmartForm} = Components;
  if (!currentUser?.isAdmin) {
    return (
      <ErrorAccessDenied />
    );
  }

  return (
    <div className={classes.root}>
      <WrappedSmartForm collectionName="ForumEvents" />
    </div>
  );
}

const AdminForumEventsPageComponent = registerComponent(
  "AdminForumEventsPage",
  AdminForumEventsPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    AdminForumEventsPage: typeof AdminForumEventsPageComponent
  }
}
