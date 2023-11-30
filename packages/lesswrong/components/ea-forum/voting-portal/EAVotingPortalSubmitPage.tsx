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
import { userCanVoteInDonationElection } from "../../../lib/eaGivingSeason";
import { useCurrentUser } from "../../common/withUser";

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
    marginTop: 4,
    textAlign: "center",
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
  const { electionVote, updateVote } = useElectionVote("givingSeason23");

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

const ELECTION_EFFECT_OPTIONS = [
  {
    value: "noChange",
    label: "Didn’t change my donation priorities",
  },
  {
    value: "smChange",
    label: "Changed my donation priorities a bit",
  },
  {
    value: "lgChange",
    label: "Noticeably changed my donation priorities",
  },
  {
    value: "xlChange",
    label: "Totally changed my donation priorities ",
  },
]

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

  const [electionEffect, setElectionEffect] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const handleSubmit = useCallback(async () => {
    try {
      // TODO submit answers
      await updateVote({ submittedAt: new Date() });
    } catch (e) {
      flash(e.message);
      return;
    }

    navigate({ pathname: "/voting-portal" });
  }, [flash, navigate, updateVote]);

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
              How much did you change your mind about where to donate and/or how to vote, as a result of the Donation
              Election or other Giving Season activities? <span className={classes.greyedOut}>(Optional)</span>
              <LWTooltip
                title="This will help us understand the impact of the event, and we might share aggregated information about this question in our public summary of the Election results."
                placement="bottom"
                className={classes.tooltip}
                popperClassName={classes.tooltipPopper}
              >
                <ForumIcon icon="InfoCircle" className={classes.infoIcon} />
              </LWTooltip>
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
              Share a note about your vote, which might get shared (anonymously) in the public writeup of the results{" "}
              <span className={classes.greyedOut}>(Optional)</span>
            </div>
            <TextField
              multiline
              rows={6}
              variant="outlined"
              className={classes.textField}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>
        <VotingPortalFooter
          leftHref="/voting-portal/allocate-votes"
          middleNode={<></>}
          buttonText={electionVote.submittedAt ? "Update your vote" : "Submit your vote"}
          buttonProps={{
            onClick: handleSubmit,
          }}
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
