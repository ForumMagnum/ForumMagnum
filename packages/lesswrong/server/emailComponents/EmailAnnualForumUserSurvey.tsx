import React from "react";
import { defineStyles } from "@/components/hooks/defineStyles";
import { EmailContextType, useEmailStyles } from "./emailContext";

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

export const EmailAnnualForumUserSurvey = ({ user, emailContext }: {
  user: DbUser
  emailContext: EmailContextType
}) => {
  const classes = useEmailStyles(styles, emailContext);
  const surveyLink = 'https://forms.cea.community/forum-survey-2024?utm_source=ea_forum&utm_medium=email&utm_campaign=survey_reminder'

  return (
    <div className={classes.root}>
      <p>
        Hi {user.displayName},
      </p>
      <p>
        I work on the <a href="https://forum.effectivealtruism.org/" className={classes.link}>EA Forum</a>,
        and would be grateful if you took 7-15 minutes to <strong><a href={surveyLink} className={classes.link}>fill out our 2024 EA Forum user survey</a></strong>.
        Your response is important for guiding our team’s priorities for the next 12 months.
        (If you've already filled it out, thank you!)
      </p>
      <p>
        Even if you have not used the Forum in a long time, your response is helpful for us to compare
        different populations (and you will see a significantly shorter survey).
      </p>
      <p>
        <strong>All questions are optional.</strong> Your answers will be saved in your browser, so you
        can pause and return to it later. We plan to close the survey <strong>this Friday</strong>, August 23, at <a href="https://everytimezone.com/s/3be11109?t=66c7d100,c12" className={classes.link}>11:59 PM EDT</a>.
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
