import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { JOB_AD_DATA } from "../../components/ea-forum/TargetedJobAd";

const styles = (theme: ThemeType) => ({
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
});

const EmailJobAdReminder = ({
  jobName,
  classes,
}: {
  jobName: string;
  classes: ClassesType<typeof styles>;
}) => {
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

const EmailJobAdReminderComponent = registerComponent(
  "EmailJobAdReminder",
  EmailJobAdReminder,
  { styles }
);

declare global {
  interface ComponentTypes {
    EmailJobAdReminder: typeof EmailJobAdReminderComponent;
  }
}
