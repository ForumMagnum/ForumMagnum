import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { JOB_AD_DATA } from "../../components/ea-forum/TargetedJobAd";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

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

const EmailJobAdReminder = ({ jobName }: {
  jobName: string;
}) => {
  const classes = useStyles(styles);
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

const EmailJobAdReminderComponent = registerComponent("EmailJobAdReminder", EmailJobAdReminder);

declare global {
  interface ComponentTypes {
    EmailJobAdReminder: typeof EmailJobAdReminderComponent;
  }
}
