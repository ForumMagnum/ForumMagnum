import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useNavigate } from "../../../lib/reactRouterWrapper";
import TextField from "@material-ui/core/TextField";
import classNames from "classnames";
import { useElectionVote } from "./hooks";
import { useMessages } from "../../common/withMessages";
import RadioGroup from "@material-ui/core/RadioGroup";
import Radio from "@material-ui/core/Radio";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { eaGivingSeason23ElectionName, userCanVoteInDonationElection } from "../../../lib/eaGivingSeason";
import { useCurrentUser } from "../../common/withUser";
import { ELECTION_EFFECT_OPTIONS, ELECTION_EFFECT_QUESTION, ELECTION_NOTE_QUESTION, formStateToSubmissionComments, submissionCommentsToFormState } from "../../../lib/collections/electionVotes/helpers";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
  headingMargin: {
    marginBottom: 26,
  },
  fullWidth: {
    width: "100%",
  },
  explanationRow: {
    width: "100%",
    marginBottom: 32,
  },
  questionTitle: {
    lineHeight: '1.4em',
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
  },
  textField: {
    width: "100%",
    "& .MuiInputBase-root": {
      padding: 16,
    },
    "& textarea": {
      color: theme.palette.grey[1000],
      zIndex: theme.zIndexes.singleColumnSection,
      fontSize: 16,
      lineHeight: '1.4em',
      fontWeight: 500,
    },
    "& .MuiNotchedOutline-focused": {
      border: `2px solid ${theme.palette.givingPortal[1000]} !important`,
    },
    "& .MuiNotchedOutline-root": {
      backgroundColor: theme.palette.background.contrastInDarkMode,
    },
  },
  greyedOut: {
    color: theme.palette.grey[600],
  },
  infoIcon: {
    color: theme.palette.grey[600],
    fontSize: 20,
  },
  tooltip: {
    marginLeft: 4,
    position: "relative",
    top: 4,
  },
  tooltipPopper: {
    maxWidth: 320,
    marginTop: 8,
    textAlign: "left",
    borderRadius: `${theme.borderRadius.default}px !important`,
    backgroundColor: `${theme.palette.grey[900]} !important`,
  },
  radioWrapper: {
    // Without this the options start wrapped on page load before some js runs to unwrap them
    maxWidth: 520,
  },
  radio: {
    padding: "6px 12px",
  },
  radioChecked: {
    color: `${theme.palette.givingPortal[1000]} !important`,
  },
  radioLabel: {
    '& .MuiFormControlLabel-label': {
      fontWeight: 500,
      color: theme.palette.grey[1000],
      fontSize: 16,
    }
  },
});

const EAVotingPortalSubmitPageLoader = ({ classes }: { classes: ClassesType }) => {
  const { electionVote, updateVote } = useElectionVote(eaGivingSeason23ElectionName);

  const currentUser = useCurrentUser();
  const { LoginForm } = Components;

  if (!currentUser) {
    return (
      <div className={classes.noPermissionFallback}>
        <LoginForm />
      </div>
    );
  }
  if (!userCanVoteInDonationElection(currentUser)) {
    return (
      <p className={classes.noPermissionFallback}>
        You are not eligible to vote as your account was created after 22nd Oct 2023
      </p>
    );
  }

  if (!electionVote?.vote) return null;

  return (
    <EAVotingPortalSubmitPage
      electionVote={electionVote}
      updateVote={updateVote}
      classes={classes}
    />
  );
};

const EAVotingPortalSubmitPage = ({
  electionVote,
  updateVote,
  classes,
}: {
  electionVote: ElectionVoteInfo;
  updateVote: (newVote: NullablePartial<DbElectionVote>) => Promise<void>;
  classes: ClassesType<typeof styles>;
}) => {
  const { VotingPortalFooter, LWTooltip, ForumIcon } = Components;
  const navigate = useNavigate();
  const { flash } = useMessages();

  const {electionEffect: dbElectionEffect, note: dbNote} = submissionCommentsToFormState(electionVote.submissionComments);

  const [electionEffect, setElectionEffect] = useState<string>(dbElectionEffect);
  const [note, setNote] = useState<string>(dbNote);

  const handleSubmit = useCallback(async () => {
    try {
      const submissionComments = formStateToSubmissionComments({electionEffect, note});
      await updateVote({ submittedAt: new Date(), submissionComments });
    } catch (e) {
      flash(e.message);
      return;
    }

    navigate({ pathname: "/voting-portal" });
  }, [electionEffect, flash, navigate, note, updateVote]);

  return (
    <AnalyticsContext pageContext="eaVotingPortalSubmit">
      <div className={classes.root}>
        <div className={classNames(classes.content, classes.fullWidth)} id="top">
          <div className={classNames(classes.h2, classes.headingMargin)}>4. Submit your vote</div>
          <div className={classes.subtitle}>
            <em>You can still change your vote until December 15th.</em>
          </div>
          <div className={classes.explanationRow}>
            <div className={classes.questionTitle}>
              {ELECTION_EFFECT_QUESTION}{" "}
              <span className={classes.greyedOut}>(Optional)</span>
            </div>
            <div className={classes.radioWrapper}>
              <RadioGroup
                value={electionEffect}
                onChange={(event) => setElectionEffect((event?.target as AnyBecauseHard)?.value)}
              >
                {ELECTION_EFFECT_OPTIONS.map((option) => {
                  return (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      control={<Radio className={classes.radio} classes={{ checked: classes.radioChecked }} />}
                      className={classes.radioLabel}
                    />
                  );
                })}
              </RadioGroup>
            </div>
          </div>
          <div className={classes.explanationRow}>
            <div className={classes.questionTitle}>
              {ELECTION_NOTE_QUESTION} <span className={classes.greyedOut}>(Optional)</span>{" "}
              <LWTooltip
                title="We might share anonymized answers in the writeup on the results. If you prefer, you can write a different note about the election here."
                placement="bottom"
                className={classes.tooltip}
                popperClassName={classes.tooltipPopper}
              >
                <ForumIcon icon="InfoCircle" className={classes.infoIcon} />
              </LWTooltip>
            </div>
            <TextField
              multiline
              rows={6}
              variant="outlined"
              className={classes.textField}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Consider sharing why you picked the candidates you selected, writing a note about your experience with the Donation Election, etc."
            />
          </div>
        </div>
      <VotingPortalFooter
          leftHref="/voting-portal/allocate-points"
          middleNode={<></>}
          buttonText={"Submit your vote"}
          buttonProps={{
            onClick: handleSubmit,
          }}
          arrow={false}
          electionVote={electionVote}
          updateVote={updateVote}
        />
      </div>
    </AnalyticsContext>
  );
};

const EAVotingPortalSubmitPageComponent = registerComponent("EAVotingPortalSubmitPage", EAVotingPortalSubmitPageLoader, {
  styles,
});

declare global {
  interface ComponentTypes {
    EAVotingPortalSubmitPage: typeof EAVotingPortalSubmitPageComponent;
  }
}
