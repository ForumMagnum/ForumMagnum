import React, { useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { useTracking } from "../../../lib/analyticsEvents";
import { useEAOnboarding } from "./useEAOnboarding";
import { useMutation, useQuery } from "@apollo/client";
import { newUserCompleteProfileMutation } from "../../users/NewUserCompleteProfile";
import classNames from "classnames";
import gql from "graphql-tag";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: 60,
    color: theme.palette.grey[900],
    lineHeight: "140%",
  },
  secondaryText: {
    color: theme.palette.grey[600],
    fontSize: 13,
  },
  nameTaken: {
    color: theme.palette.text.error2,
  },
  footer: {
    cursor: "pointer",
    display: "flex",
    gap: "8px",
    color: theme.palette.grey[600],
    fontWeight: 500,
    lineHeight: "140%",
  },
  checkbox: {
    marginTop: 2,
    borderRadius: theme.borderRadius.small,
    width: 14,
    height: 14,
  },
  checkboxChecked: {
    background: theme.palette.primary.dark,
    color: theme.palette.text.alwaysWhite,
  },
  checkboxUnchecked: {
    border: theme.palette.border.grey400,
    "& path": {
      opacity: 0,
    },
  },
});

const links = {
  username: "https://jimpix.co.uk/words/random-username-generator.asp",
  termsOfUse: "/termsOfUse",
  license: "https://creativecommons.org/licenses/by/2.0/",
} as const;

const displayNameTakenQuery = gql`
  query isDisplayNameTaken($displayName: String!) {
    IsDisplayNameTaken(displayName: $displayName)
  }
`;

export const EAOnboardingUserStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {goToNextStageAfter} = useEAOnboarding();
  const [name, setName] = useState("");
  const [nameTaken, setNameTaken] = useState(false);
  const [acceptedTos, setAcceptedTos] = useState(true);
  const {captureEvent} = useTracking();
  const [updateUser] = useMutation(newUserCompleteProfileMutation);

  const onToggleAcceptedTos = useCallback((ev) => {
    if (ev.target.tagName !== "A") {
      setAcceptedTos((value) => {
        captureEvent("toggledTos", {newValue: !value});
        return !value;
      });
    }
  }, [captureEvent]);

  const onContinue = useCallback(async () => {
    await goToNextStageAfter(
      updateUser({
        variables: {
          username: name,
          acceptedTos,
          subscribeToDigest: false, // This option is shown in a later stage
        },
      }),
    );
  }, [name, acceptedTos, updateUser, goToNextStageAfter]);

  const {data, loading} = useQuery(displayNameTakenQuery, {
    ssr: false,
    skip: !name,
    pollInterval: 0,
    fetchPolicy: "network-only",
    variables: {
      displayName: name,
    },
  });

  useEffect(() => {
    setNameTaken(!loading && !!data?.IsDisplayNameTaken);
  }, [data, loading]);

  const canContinue = !!name && !nameTaken && acceptedTos;

  const {EAOnboardingStage, EAOnboardingInput, ForumIcon} = Components;
  return (
    <EAOnboardingStage
      stageName="user"
      title="Choose your user name"
      footer={
        <div onClick={onToggleAcceptedTos} className={classes.footer}>
          <ForumIcon
            icon="Check"
            className={classNames(classes.checkbox, {
              [classes.checkboxChecked]: acceptedTos,
              [classes.checkboxUnchecked]: !acceptedTos,
            })}
          />
          <div>
            I agree to the{" "}
            <Link to={links.termsOfUse} target="_blank" rel="noopener noreferrer">
              terms of use
            </Link>, including my content being available under a{" "}
            <Link to={links.license} target="_blank" rel="noopener noreferrer">
              CC -BY
            </Link> license.
          </div>
        </div>
      }
      onContinue={onContinue}
      canContinue={canContinue}
      className={classes.root}
      thin
    >
      <div>Many Forum users use their real name.</div>
      <EAOnboardingInput
        value={name}
        setValue={setName}
        placeholder="Spaces and special characters allowed"
      />
      {nameTaken &&
        <div className={classes.nameTaken}>"{name}" is already taken</div>
      }
      <div className={classes.secondaryText}>
        If you’d rather use a pseudonym, we recommend{" "}
        <Link to={links.username} target="_blank" rel="noopener noreferrer">
          something memorable like "WobblyPanda"
        </Link>{" "}
        instead of a generic name like “Anonymous 238”.
      </div>
    </EAOnboardingStage>
  );
}

const EAOnboardingUserStageComponent = registerComponent(
  "EAOnboardingUserStage",
  EAOnboardingUserStage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingUserStage: typeof EAOnboardingUserStageComponent
  }
}
