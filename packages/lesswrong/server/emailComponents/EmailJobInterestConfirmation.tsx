import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { JOB_AD_DATA } from "../../components/ea-forum/TargetedJobAd";

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
    maxWidth: 570,
    fontSize: 16,
    lineHeight: "22px",
    color: theme.palette.grey[700],
    margin: "10px 0",
    "& ul": {
      margin: 0,
    },
    "& li": {
      marginTop: 3,
    },
  },
  link: {
    color: theme.palette.primary.main,
  },
  hr: {
    marginTop: 20,
  }
});

const EmailJobInterestConfirmation = ({
  newInterestedJob,
  classes,
}: {
  newInterestedJob: string;
  classes: ClassesType;
}) => {
  const jobData = JOB_AD_DATA[newInterestedJob];
  const link = jobData.bitlyLink;
  const role = jobData.role;
  const org = jobData.org;
  const description = jobData.getDescription(classes);

  return (
    <div className={classes.root}>
      <div className={classes.row}>
        Thank you for registering your interest in this role! We'll pass on your email address and EA Forum profile
        to the hiring manager.
      </div>
      <div className={classes.row}>
        We also encourage you to complete the full job application <a href={link}>here</a>.
      </div>
      <hr className={classes.hr}/>
      <h2>
        {role} at {org}
      </h2>
      <div>{description}</div>
      <hr className={classes.hr}/>
    </div>
  );
};

const EmailJobInterestConfirmationComponent = registerComponent(
  "EmailJobInterestConfirmation",
  EmailJobInterestConfirmation,
  { styles }
);

declare global {
  interface ComponentTypes {
    EmailJobInterestConfirmation: typeof EmailJobInterestConfirmationComponent;
  }
}
