import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 15,
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
  classes: ClassesType<typeof styles>;
}) => {
  const surveyLink = 'https://docs.google.com/forms/d/e/1FAIpQLSevnR0viER-xSUbcL0AsQpQ8Zn7X5iuvUgMcs3XEqk55SngLw/viewform'

  return (
    <div className={classes.root}>
      <p>
        Hi {user.displayName},
      </p>
      <p>
        I work on the <a href="https://forum.effectivealtruism.org/" className={classes.link}>EA Forum</a>,
        and would be really grateful if you took 5-10 minutes to <a href={surveyLink} className={classes.link}>fill out an anonymous survey</a> about your experience with the site.
      </p>
      <p>
        Your response would be especially valuable to us, as it looks like you haven’t visited the EA Forum in a while — we tend to miss the perspectives
        of people who stop using the Forum or who use it infrequently. (If our analytics are off or you’re using the Forum while you’re logged-out, you can
        flag that in the linked form. Also, please feel free to reply to this email and let me know if you’re facing any issues with your account!)
      </p>
      <p>
        The <a href={surveyLink} className={classes.link}>survey</a> shouldn’t take more than <strong>10 minutes</strong>,
        and <strong>all questions are optional</strong>. Any responses you share will likely help us improve the site for everyone.
      </p>
      <p>
        – Sarah (for the EA Forum Team)
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
