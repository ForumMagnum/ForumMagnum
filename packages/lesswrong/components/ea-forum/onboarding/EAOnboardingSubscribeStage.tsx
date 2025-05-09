import React, { useCallback, useState } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useCurrentUser } from "../../common/withUser";
import { useSuggestedSubscriptions } from "./useSuggestedSubscriptions";
import { EAOnboardingStage } from "./EAOnboardingStage";
import { EAOnboardingTag } from "./EAOnboardingTag";
import { EAOnboardingAuthor } from "./EAOnboardingAuthor";
import { Loading } from "../../vulcan-core/Loading";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },
  gridContainer: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "8px",
    rowGap: "8px",
    textAlign: "left",
  },
});

const editSet = (currentSet: string[], value: string, add: boolean) => {
  const values = new Set(currentSet);
  if (add) {
    values.add(value);
  } else {
    values.delete(value);
  }
  return Array.from(values);
}

export const EAOnboardingSubscribeStageInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [subscribedTags, setSubscribedTags] = useState<string[]>([]);
  const [subscribedUsers, setSubscribedUsers] = useState<string[]>([]);

  const onSubscribedTag = useCallback((id: string, subscribed: boolean) => {
    setSubscribedTags((current) => editSet(current, id, subscribed));
  }, []);

  const onSubscribedUser = useCallback((id: string, subscribed: boolean) => {
    setSubscribedUsers((current) => editSet(current, id, subscribed));
  }, []);

  const {tags, users} = useSuggestedSubscriptions();

  const canContinue = !!(subscribedTags.length || subscribedUsers.length);
  return (
    <EAOnboardingStage
      stageName="subscribe"
      title={`Welcome to the EA Forum, ${currentUser?.displayName}!`}
      canContinue={canContinue}
      skippable
      className={classes.root}
    >
      <div className={classes.section}>
        <div>
          Subscribe to a topic to see more of it on the Forum Frontpage.
        </div>
        <div className={classes.gridContainer}>
          {tags.length < 1 && <Loading />}
          {tags.map((tag) =>
            <EAOnboardingTag
              key={tag._id}
              tag={tag}
              onSubscribed={onSubscribedTag}
            />
          )}
        </div>
      </div>
      <div className={classes.section}>
        <div>
          Subscribe to an author to get notified when they post. They won’t see this.
        </div>
        <div className={classes.gridContainer}>
          {users.length < 1 && <Loading />}
          {users.map((user) =>
            <EAOnboardingAuthor
              key={user._id}
              user={user}
              onSubscribed={onSubscribedUser}
            />
          )}
        </div>
      </div>
    </EAOnboardingStage>
  );
}

export const EAOnboardingSubscribeStage = registerComponent(
  "EAOnboardingSubscribeStage",
  EAOnboardingSubscribeStageInner,
  {styles},
);


