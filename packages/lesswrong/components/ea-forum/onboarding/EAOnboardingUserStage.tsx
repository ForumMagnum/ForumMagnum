import React, { useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { useTracking } from "../../../lib/analyticsEvents";
import { useEAOnboarding } from "./useEAOnboarding";
import { useRefetchCurrentUser } from "../../common/withUser";
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
    gap: "9px",
  },
  checkbox: {
    borderRadius: theme.borderRadius.small,
    width: 14,
    height: 14,
  },
  checkboxChecked: {
    background: theme.palette.primary.dark,
    color: theme.palette.grey[1000],
  },
  checkboxUnchecked: {
    background: theme.palette.grey[310],
    color: theme.palette.panelBackground.modalBackground,
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
  const refetchCurrentUser = useRefetchCurrentUser();
  const {goToNextStageAfter} = useEAOnboarding();
  const [name, setName] = useState("");
  const [nameTaken, setNameTaken] = useState(false);
  const [acceptedTos, setAcceptedTos] = useState(true);
  const {captureEvent} = useTracking();
  const [updateUser] = useMutation(newUserCompleteProfileMutation, {
    refetchQueries: ["getCurrentUser"],
  });

  const onToggleAcceptedTos = useCallback((ev) => {
    if (ev.target.tagName !== "A") {
      setAcceptedTos((value) => {
        captureEvent("toggledTos", {newValue: !value});
        return !value;
      });
    }
  }, [captureEvent]);

  const onContinue = useCallback(async () => {
    await goToNextStageAfter((async () => {
      await updateUser({
        variables: {
          username: name,
          acceptedTos,
          subscribeToDigest: true, // This option is shown in a later stage
        },
      });
      await refetchCurrentUser();
    })());
  }, [name, acceptedTos, updateUser, goToNextStageAfter, refetchCurrentUser]);

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
