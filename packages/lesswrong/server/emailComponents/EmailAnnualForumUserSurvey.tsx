import React from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

const styles = defineStyles("EmailAnnualForumUserSurvey", (theme: ThemeType) => ({
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
}));

export const EmailAnnualForumUserSurvey = ({ user }: {
  user: DbUser;
}) => {
  const classes = useStyles(styles);
  const surveyLink = 'https://forms.cea.community/forum-survey-2025?utm_source=ea_forum&utm_medium=email&utm_campaign=survey_reminder'

  return (
    <div className={classes.root}>
      <p>
        Hi {user.displayName},
      </p>
      <p>
        I work on the <a href="https://forum.effectivealtruism.org/" className={classes.link}>Effective Altruism Forum</a>,
        and would be grateful if you took 10-20 minutes to <strong><a href={surveyLink} className={classes.link}>fill out our 2025 EA Forum user survey</a></strong>.
        Your response is important for guiding our team’s priorities for the next 12 months.
        (If you've already filled it out, thank you!)
      </p>
      <p>
        <strong>All questions are optional.</strong> Your answers will be saved in your browser, so you
        can pause and return to it later. We plan to close the survey <strong>this Thursday</strong>, August 21, at 11:45 PM Eastern Time.
      </p>
      <p>
        There is also an optional section at the end about other CEA programs. If you haven’t used the Forum in the past 12 months, you’ll see a significantly shorter survey, and your input on other CEA programs is still helpful.
      </p>
      <p>
        We appreciate you taking the time to fill out the survey, and we read every response.
      </p>
      <p>
        – Sarah (for the EA Forum Team)
      </p>
      <hr className={classes.hr}/>
    </div>
  );
};
