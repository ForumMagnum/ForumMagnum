import React, { useEffect, useState } from "react";
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

  const [remountingForm, setRemountingForm] = useState(false);

  useEffect(() => {
    if (remountingForm) {
      setRemountingForm(false);
    }
  }, [remountingForm])

  return (
    <div className={classes.root}>
      <SectionTitle title={title} titleClassName={classes.formTitle} />
      {!remountingForm && <WrappedSmartForm
        documentId={documentId}
        collectionName="ForumEvents"
        queryFragmentName="ForumEventsEdit"
        mutationFragmentName="ForumEventsEdit"
        // Hack: The contents of editable fields are lost after submission for some
        // reason. Remount the form to reset them
        successCallback={() => setRemountingForm(true)}
      />}
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
