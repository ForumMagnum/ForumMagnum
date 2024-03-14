import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CAREER_STAGES } from "../../lib/collections/users/schema";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: theme.palette.grey[600],
    fontSize: 13,
    fontWeight: 600,
  },
  icon: {
    width: 16,
  },
});

export const PeopleDirectoryCareerStageCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const stage = user.careerStage?.[0]
    ? CAREER_STAGES.find(({value}) => value === user.careerStage?.[0])
    : null;
  const {ForumIcon} = Components;
  return (
    <div className={classes.root}>
      {stage
        ? (
          <>
            <ForumIcon icon={stage.icon} className={classes.icon} />
            {stage.label}
          </>
        )
        : "-"
      }
    </div>
  );
}

const PeopleDirectoryCareerStageCellComponent = registerComponent(
  "PeopleDirectoryCareerStageCell",
  PeopleDirectoryCareerStageCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryCareerStageCell: typeof PeopleDirectoryCareerStageCellComponent
  }
}
