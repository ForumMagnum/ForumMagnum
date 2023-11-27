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
      backgroundColor: theme.palette.background.paper,
    },
  },
  greyedOut: {
    color: theme.palette.grey[600],
  },
});

const EAVotingPortalSubmitPage = ({ classes }: { classes: ClassesType }) => {
  const { VotingPortalFooter } = Components;
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { updateVote } = useElectionVote("givingSeason23");

  const [userExplanation, setUserExplanation] = useState<string>("");
  const [userOtherComments, setUserOtherComments] = useState<string>("");

  const handleSubmit = useCallback(async () => {
    await updateVote({ userExplanation, userOtherComments, submittedAt: new Date() });
  }, [updateVote, userExplanation, userOtherComments]);

  // TODO un-admin-gate when the voting portal is ready
  if (!isAdmin(currentUser)) return null;

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
            />
          </div>
        </div>
        <VotingPortalFooter
          leftHref="/voting-portal/allocate-votes"
          middleNode={<></>}
          buttonText="Submit your vote"
          buttonProps={{
            onClick: async () => {
              await handleSubmit();
              navigate({ pathname: "/voting-portal" });
            },
          }}
        />
      </div>
    </AnalyticsContext>
  );
};

const EAVotingPortalSubmitPageComponent = registerComponent("EAVotingPortalSubmitPage", EAVotingPortalSubmitPage, {
  styles,
});

declare global {
  interface ComponentTypes {
    EAVotingPortalSubmitPage: typeof EAVotingPortalSubmitPageComponent;
  }
}
