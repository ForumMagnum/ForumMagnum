import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import type { KarmaChanges } from "../../../lib/collections/users/karmaChangesGraphQL";

export const NotificationsPageKarmaChangeList = ({karmaChanges}: {
  karmaChanges?: KarmaChanges,
}) => {
  const {NotificationsPageKarmaChange} = Components;
  return (
    <>
      {karmaChanges?.posts?.map((karmaChange) =>
        <NotificationsPageKarmaChange
          key={karmaChange._id}
          postKarmaChange={karmaChange}
        />
      )}
      {karmaChanges?.comments?.map((karmaChange) =>
        <NotificationsPageKarmaChange
          key={karmaChange._id}
          commentKarmaChange={karmaChange}
        />
      )}
      {karmaChanges?.tagRevisions?.map((karmaChange) =>
        <NotificationsPageKarmaChange
          key={karmaChange._id}
          tagRevisionKarmaChange={karmaChange}
        />
      )}
    </>
  );
}

const NotificationsPageKarmaChangeListComponent = registerComponent(
  "NotificationsPageKarmaChangeList",
  NotificationsPageKarmaChangeList,
);

declare global {
  interface ComponentTypes {
    NotificationsPageKarmaChangeList: typeof NotificationsPageKarmaChangeListComponent
  }
}
