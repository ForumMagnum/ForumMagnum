
import React from "react";
import { JOB_AD_DATA } from "../../components/ea-forum/constants";
import { defineStyles } from "@/components/hooks/defineStyles";
import { useEmailStyles } from "./emailContext";

const styles = defineStyles("EmailJobAdReminder", (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: "22px",
  },
  row: {
    marginBottom: 20
  },
  link: {
    color: theme.palette.primary.main,
  },
  hr: {
    marginTop: 20,
  }
}));

export const EmailJobAdReminder = ({ jobName }: {
  jobName: string;
}) => {
  const classes = useEmailStyles(styles);
  const jobData = JOB_AD_DATA[jobName];
  const link = jobData.bitlyLink;

  return (
    <div className={classes.root}>
      <div className={classes.row}>
        The application deadline for this job is coming up soon! Apply <a href={link}>here</a> before {jobData.deadline?.format("dddd, MMMM D")}.
      </div>
      <hr className={classes.hr}/>
    </div>
  );
};

