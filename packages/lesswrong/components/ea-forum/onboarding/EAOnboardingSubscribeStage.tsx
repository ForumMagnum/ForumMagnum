import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { formatRole, formatStat } from "../../users/EAUserTooltipContent";
import { useCurrentUser } from "../../common/withUser";
import { useSuggestedSubscriptions } from "./useSuggestedSubscriptions";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
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
    flexWrap: "wrap",
    gap: "8px",
    rowGap: "8px",
  },
  user: {
    cursor: "pointer",
    userSelect: "none",
    border: `1px solid ${theme.palette.grey["A100"]}`,
    borderRadius: theme.borderRadius.default,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    flexBasis: "34%",
    flexGrow: 1,
    "&:hover": {
      backgroundColor: theme.palette.grey[250],
    },
  },
  userSelected: {
    border: `1px solid ${theme.palette.primary.dark}`,
  },
  userHeader: {
    display: "flex",
    gap: "14px",
  },
  userName: {
    color: theme.palette.grey[1000],
    fontSize: 14,
    fontWeight: 700,
  },
  userKarma: {
    color: theme.palette.grey[650],
    fontSize: 13,
    fontWeight: 500,
  },
  userRole: {
    color: theme.palette.grey[1000],
    fontSize: 13,
    fontWeight: 500,
    lineHeight: "130%",
    paddingTop: 8,
  },
});

const toggleInArray = (array: string[], value: string): string[] => {
  const values = new Set(array);
  if (values.has(value)) {
    values.delete(value);
  } else {
    values.add(value);
  }
  return Array.from(values);
}

export const EAOnboardingSubscribeStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const {tags, users} = useSuggestedSubscriptions();

  const onToggleUser = useCallback((id: string) => {
    setSelectedUserIds((current) => toggleInArray(current, id));
  }, []);

  const canContinue = false;

  const {
    EAOnboardingStage, EAOnboardingTag, UsersProfileImage, Loading,
  } = Components;
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
          {tags.map((tag) => <EAOnboardingTag key={tag._id} tag={tag} />)}
        </div>
      </div>
      <div className={classes.section}>
        <div>
          Subscribe to an author to get notified when they post. They won’t see this.
        </div>
        <div className={classes.gridContainer}>
          {users.length < 1 && <Loading />}
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => onToggleUser(user._id)}
              className={classNames(classes.user, {
                [classes.userSelected]: selectedUserIds.includes(user._id),
              })}
            >
              <div className={classes.userHeader}>
                <UsersProfileImage user={user} size={40} />
                <div>
                  <div className={classes.userName}>
                    {user.displayName}
                  </div>
                  <div className={classes.userKarma}>
                    {formatStat(user.karma)} karma
                  </div>
                </div>
              </div>
              <div>
                {formatRole(user.jobTitle, user.organization)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </EAOnboardingStage>
  );
}

const EAOnboardingSubscribeStageComponent = registerComponent(
  "EAOnboardingSubscribeStage",
  EAOnboardingSubscribeStage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingSubscribeStage: typeof EAOnboardingSubscribeStageComponent
  }
}
