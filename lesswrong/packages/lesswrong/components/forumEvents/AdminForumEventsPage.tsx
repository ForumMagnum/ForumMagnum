import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import ErrorAccessDenied from "@/components/common/ErrorAccessDenied";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import ForumEventsList from "@/components/forumEvents/ForumEventsList";
import ForumEventForm from "@/components/forumEvents/ForumEventForm";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
});

export const AdminForumEventsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  if (!currentUser?.isAdmin) {
    return (
      <ErrorAccessDenied />
    );
  }

  return (
    <SingleColumnSection className={classes.root}>
      <ForumEventsList
        title="Upcoming and current events"
        view="upcomingForumEvents"
      />
      <ForumEventsList
        title="Past events"
        view="pastForumEvents"
      />
      <ForumEventForm />
    </SingleColumnSection>
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

export default AdminForumEventsPageComponent;
