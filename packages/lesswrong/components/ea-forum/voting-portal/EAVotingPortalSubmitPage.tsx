import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useCurrentUser } from "../../common/withUser";
import { isAdmin } from "../../../lib/vulcan-users";
import { useNavigate } from "../../../lib/reactRouterWrapper";
import TextField from "@material-ui/core/TextField";
import classNames from "classnames";
import { useElectionVote } from "./hooks";
import { useMessages } from "../../common/withMessages";

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
      fontSize: 14,
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
});

const EAVotingPortalSubmitPageLoader = ({ classes }: { classes: ClassesType }) => {
  const { electionVote, updateVote } = useElectionVote("givingSeason23");

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
  classes: ClassesType;
}) => {
  const { VotingPortalFooter } = Components;
  const navigate = useNavigate();
  const { flash } = useMessages();
  const currentUser = useCurrentUser();

  const [userExplanation, setUserExplanation] = useState<string>(electionVote.userExplanation ?? "");
  const [userOtherComments, setUserOtherComments] = useState<string>(electionVote.userOtherComments ?? "");

  const handleSubmit = useCallback(async () => {
    try {
      await updateVote({ userExplanation, userOtherComments, submittedAt: new Date() });
    } catch (e) {
      flash(e.message);
      return;
    }

    navigate({ pathname: "/voting-portal" });
  }, [flash, navigate, updateVote, userExplanation, userOtherComments]);

  return (
    <AnalyticsContext pageContext="eaVotingPortalSubmit">
      <div className={classes.root}>
        <div className={classNames(classes.content, classes.fullWidth)} id="top">
          <div className={classNames(classes.h2, classes.headingMargin)}>4. Submit</div>
          <div className={classes.explanationRow}>
            <div className={classes.questionTitle}>
              Tell us why you voted the way you did <span className={classes.greyedOut}>(Optional)</span>
            </div>
            <TextField
              multiline
              rows={10}
              variant="outlined"
              className={classes.textField}
              value={userExplanation}
              onChange={(event) => setUserExplanation(event.target.value)}
              disabled={!!electionVote.submittedAt}
            />
          </div>
          <div className={classes.explanationRow}>
            <div className={classes.questionTitle}>
              Any other comments? <span className={classes.greyedOut}>(Optional)</span>
            </div>
            <TextField
              multiline
              rows={6}
              variant="outlined"
              className={classes.textField}
              value={userOtherComments}
              onChange={(event) => setUserOtherComments(event.target.value)}
              disabled={!!electionVote.submittedAt}
            />
          </div>
        </div>
        <VotingPortalFooter
          leftHref="/voting-portal/allocate-votes"
          middleNode={<></>}
          buttonText="Submit your vote"
          buttonTooltip={electionVote.submittedAt ? "You can't change your vote after submission" : "Once you submit your vote it can't be changed"}
          buttonProps={{
            onClick: handleSubmit,
            disabled: !!electionVote.submittedAt,
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
