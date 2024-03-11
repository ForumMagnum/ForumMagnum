import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {},
  newFormTitle: {
    marginBottom: -30,
  },
});

export const NewForumEvent = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {SectionTitle, WrappedSmartForm} = Components;
  return (
    <div className={classes.root}>
      <SectionTitle title="New forum event" className={classes.newFormTitle} />
      <WrappedSmartForm
        collectionName="ForumEvents"
        queryFragmentName="ForumEventsEdit"
        mutationFragmentName="ForumEventsEdit"
      />
    </div>
  );
}

const NewForumEventComponent = registerComponent(
  "NewForumEvent",
  NewForumEvent,
  {styles},
);

declare global {
  interface ComponentTypes {
    NewForumEvent: typeof NewForumEventComponent
  }
}
