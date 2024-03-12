import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { forumTitleSetting } from "../../lib/instanceSettings";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: "22px",
  },
  link: {
    color: theme.palette.primary.main,
  },
  hr: {
    marginTop: 30,
  }
});

const EmailInactiveUserSurvey = ({
  user,
  classes,
}: {
  user: DbUser;
  classes: ClassesType;
}) => {

  return (
    <div className={classes.root}>
      <p>
        Hi {user.displayName},
      </p>
      <p>
        We noticed that you haven’t visited the EA Forum in a while. We’d be interested to hear about your experience with it.
      </p>
      <p>
        Please consider filling in <a href="https://docs.google.com/forms/d/e/1FAIpQLSevnR0viER-xSUbcL0AsQpQ8Zn7X5iuvUgMcs3XEqk55SngLw/viewform" className={classes.link}>this anonymous survey</a> (all questions are optional).
        Your answers will help us make the site better for everyone.
      </p>
      <p>
        - The {forumTitleSetting.get()} Team
      </p>
      <hr className={classes.hr}/>
    </div>
  );
};

const EmailInactiveUserSurveyComponent = registerComponent(
  "EmailInactiveUserSurvey",
  EmailInactiveUserSurvey,
  { styles }
);

declare global {
  interface ComponentTypes {
    EmailInactiveUserSurvey: typeof EmailInactiveUserSurveyComponent;
  }
}
