import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {},
  formTitle: {
    marginBottom: -30,
  },
});

export const ForumEventForm = ({documentId, classes}: {
  documentId?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const title = documentId ? "Edit forum event" : "New forum event";
  const {SectionTitle, WrappedSmartForm} = Components;
  return (
    <div className={classes.root}>
      <SectionTitle title={title} titleClassName={classes.formTitle} />
      <WrappedSmartForm
        documentId={documentId}
        collectionName="ForumEvents"
        queryFragmentName="ForumEventsEdit"
        mutationFragmentName="ForumEventsEdit"
      />
    </div>
  );
}

const ForumEventFormComponent = registerComponent(
  "ForumEventForm",
  ForumEventForm,
  {styles},
);

declare global {
  interface ComponentTypes {
    ForumEventForm: typeof ForumEventFormComponent
  }
}
