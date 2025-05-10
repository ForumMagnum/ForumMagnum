import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { ErrorAccessDenied } from "../common/ErrorAccessDenied";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { ForumEventsList } from "./ForumEventsList";
import { ForumEventForm } from "./ForumEventForm";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
});

export const AdminForumEventsPageInner = ({classes}: {
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

export const AdminForumEventsPage = registerComponent(
  "AdminForumEventsPage",
  AdminForumEventsPageInner,
  {styles},
);


