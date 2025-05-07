import React from "react";
import { Components } from "../../lib/vulcan-lib/components";
import { CAREER_STAGES } from "@/lib/collections/users/helpers";
import {
  EMPTY_TEXT_PLACEHOLDER,
  emptyTextCellStyles,
  textCellStyles,
} from "./PeopleDirectoryTextCell";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('PeopleDirectoryCareerStageCell', (theme: ThemeType) => ({
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
}));

export const PeopleDirectoryCareerStageCell = ({user}: {
  user: SearchUser,
}) => {
  const classes = useStyles(styles);
  const stage = user.careerStage?.[0]
    ? CAREER_STAGES.find(({value}) => value === user.careerStage?.[0])
    : null;
  const {LWTooltip, ForumIcon} = Components;
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
