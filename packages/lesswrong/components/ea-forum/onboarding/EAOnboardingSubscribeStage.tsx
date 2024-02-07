import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { formatRole, formatStat } from "../../users/EAUserTooltipContent";
import { useCurrentUser } from "../../common/withUser";
import { useSuggestedSubscriptions } from "./useSuggestedSubscriptions";
import classNames from "classnames";

const TAG_SIZE = 103;

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
  tag: {
    cursor: "pointer",
    userSelect: "none",
    width: TAG_SIZE,
    height: TAG_SIZE,
    position: "relative",
    "& img": {
      zIndex: 1,
      position: "absolute",
      borderRadius: theme.borderRadius.default,
    },
    "& div": {
      fontSize: 13,
      fontWeight: 700,
      lineHeight: "16px",
      color: theme.palette.text.alwaysWhite,
      zIndex: 2,
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column-reverse",
      padding: 8,
      backgroundColor: theme.palette.tag.onboardingBackground,
      borderRadius: theme.borderRadius.default,
      "&:hover": {
        backgroundColor: theme.palette.tag.onboardingBackgroundHover,
      },
    },
  },
  tagSelected: {
    border: `1px solid ${theme.palette.primary.dark}`,
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
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const {tags, users} = useSuggestedSubscriptions();

  const onToggleTag = useCallback((id: string) => {
    setSelectedTagIds((current) => toggleInArray(current, id));
  }, []);

  const onToggleUser = useCallback((id: string) => {
    setSelectedUserIds((current) => toggleInArray(current, id));
  }, []);

  const canContinue = false;

  const {
    EAOnboardingStage, Loading, CloudinaryImage2, UsersProfileImage,
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
          {tags.map(({_id, name, squareImageId, bannerImageId}) => (
            <div
              key={_id}
              onClick={() => onToggleTag(_id)}
              className={classNames(classes.tag, {
                [classes.tagSelected]: selectedTagIds.includes(_id),
              })}
            >
              <CloudinaryImage2
                publicId={squareImageId ?? bannerImageId}
                width={TAG_SIZE}
                height={TAG_SIZE}
                imgProps={{
                  dpr: String(window.devicePixelRatio ?? 1),
                  g: "center",
                }}
                objectFit="cover"
              />
              <div>{name}</div>
            </div>
          ))}
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
