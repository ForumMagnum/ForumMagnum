import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { JOB_AD_DATA } from "../../components/ea-forum/TargetedJobAd";
import { useABTest } from "../../lib/abTestImpl";
import { jobAdDescription } from "../../lib/abTests";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: "22px",
  },
  row: {
    marginBottom: 20
  },
  description: {
    maxWidth: 666,
    fontSize: 16,
    lineHeight: "22px",
    color: theme.palette.grey[700],
    margin: "10px 0",
    "& ul": {
      margin: 0,
    },
    "& li": {
      marginTop: 1,
    },
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
  classes: ClassesType;
}) => {
  // Temp A/B test for the job ad description
  const descriptionAbTestGroup = useABTest(jobAdDescription)
  
  const jobData = JOB_AD_DATA[jobName];
  const link = jobData.bitlyLink;
  const role = jobData.role;
  const insertThe = jobData.insertThe;
  const org = jobData.org;
  const description = descriptionAbTestGroup === '80k' && jobData.get80kDescription ?
    jobData.get80kDescription(classes) :
    jobData.getDescription(classes)

  return (
    <div className={classes.root}>
      <div className={classes.row}>
        The application deadline for this job is coming up soon! You can apply <a href={link}>here</a>.
      </div>
      <hr className={classes.hr}/>
      <h2>
        {role} at{insertThe ? ' the ' : ' '}{org}
      </h2>
      <div>{description}</div>
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
