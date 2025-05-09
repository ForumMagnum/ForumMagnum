import React, {FormEvent, ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { Link } from "../../../lib/reactRouterWrapper";
import { useEAOnboarding } from "./useEAOnboarding";
import { useMutation } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery";
import classNames from "classnames";
import gql from "graphql-tag";
import {lightbulbIcon} from '../../icons/lightbulbIcon'
import {useCurrentUser} from '../../common/withUser'

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
  license: "https://creativecommons.org/licenses/by/4.0/",
} as const;

export const EAOnboardingUserStage = ({classes, icon = lightbulbIcon}: {
  icon?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const { goToNextStage, goToNextStageAfter, captureOnboardingEvent, viewAsAdmin } = useEAOnboarding();
  const [name, setName] = useState("");
  const [nameTaken, setNameTaken] = useState(false);
  const [acceptedTos, setAcceptedTos] = useState(true);
  const [updateUser] = useMutation(gql`
    mutation NewUserCompleteProfile(
      $username: String!,
      $subscribeToDigest: Boolean!,
      $email: String,
      $acceptedTos: Boolean
    ) {
      NewUserCompleteProfile(
        username: $username,
        subscribeToDigest: $subscribeToDigest,
        email: $email,
        acceptedTos: $acceptedTos
      ) {
        username
        slug
        displayName
      }
    }
  `);
  const inputRef = useRef<HTMLInputElement|null>(null);
  const currentUser = useCurrentUser()

  const onToggleAcceptedTos = useCallback((ev: React.MouseEvent) => {
    if ((ev.target as HTMLElement).tagName !== "A") {
      setAcceptedTos((value) => {
        captureOnboardingEvent("toggledTos", {newValue: !value});
        return !value;
      });
    }
  }, [captureOnboardingEvent]);

  const onContinue = useCallback(async () => {
    // If this is an admin testing, don't make any changes
    if (viewAsAdmin) {
      await goToNextStage()
      return
    }

    await goToNextStageAfter(
      updateUser({
        variables: {
          username: name,
          acceptedTos,
          subscribeToDigest: false, // This option is shown in a later stage
        },
      }),
    );
  }, [name, acceptedTos, updateUser, goToNextStage, goToNextStageAfter, viewAsAdmin]);

  const onSubmit = useCallback(async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    await onContinue();
  }, [onContinue]);

  const {data, loading} = useQuery(gql`
    query isDisplayNameTaken($displayName: String!) {
      IsDisplayNameTaken(displayName: $displayName)
    }
  `, {
    ssr: false,
    skip: !name,
    pollInterval: 0,
    fetchPolicy: "network-only",
    variables: {
      displayName: name,
    },
  });

  useEffect(() => {
    setNameTaken(!loading && !!data?.IsDisplayNameTaken && name !== currentUser?.displayName);
  }, [data, loading, currentUser, name]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus?.();
    }, 0);
  }, []);

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
              Creative Commons Attribution 4.0
            </Link> license.
          </div>
        </div>
      }
      onContinue={onContinue}
      canContinue={canContinue}
      className={classes.root}
      thin
      icon={icon}
    >
      <div>Many Forum users use their real name.</div>
      <form onSubmit={onSubmit}>
        <EAOnboardingInput
          value={name}
          setValue={setName}
          placeholder="Spaces and special characters allowed"
          inputRef={inputRef}
        />
      </form>
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
