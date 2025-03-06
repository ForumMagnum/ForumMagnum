import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { CAREER_STAGES } from "../../lib/collections/users/schema";
import {
  EMPTY_TEXT_PLACEHOLDER,
  emptyTextCellStyles,
  textCellStyles,
} from "./PeopleDirectoryTextCell";
import LWTooltip from "@/components/common/LWTooltip";
import ForumIcon from "@/components/common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  icon: {
    width: 16,
    color: theme.palette.grey[600],
  },
  label: {
    ...textCellStyles(theme),
    color: theme.palette.grey[600],
    fontSize: 13,
    fontWeight: 600,
  },
  empty: {
    ...emptyTextCellStyles(theme),
  },
});

const PeopleDirectoryCareerStageCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const stage = user.careerStage?.[0]
    ? CAREER_STAGES.find(({value}) => value === user.careerStage?.[0])
    : null;
  return (
    <LWTooltip title={stage?.label}>
      <div className={classes.root}>
        {stage
          ? (
            <>
              <ForumIcon icon={stage.icon} className={classes.icon} />
              <span className={classes.label}>{stage.label}</span>
            </>
          )
          : (
            <span className={classes.empty}>
              {EMPTY_TEXT_PLACEHOLDER}
            </span>
          )
        }
      </div>
    </LWTooltip>
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

export default PeopleDirectoryCareerStageCellComponent;
