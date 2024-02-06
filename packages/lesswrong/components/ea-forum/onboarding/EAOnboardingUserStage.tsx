import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import classNames from "classnames";

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

export const EAOnboardingUserStage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [name, setName] = useState("");
  const [acceptedTos, setAcceptedTos] = useState(true);

  const onToggleAcceptedTos = useCallback((ev) => {
    if (ev.target.tagName !== "A") {
      setAcceptedTos((value) => !value);
    }
  }, []);

  const canContinue = !!name && acceptedTos;

  const {EAOnboardingStage, EAOnboardingInput, ForumIcon} = Components;
  return (
    <EAOnboardingStage
      stageName="username"
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
            <a href={links.license} target="_blank" rel="noopener noreferrer">
              CC -BY
            </a> license.
          </div>
        </div>
      }
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
      <div className={classes.secondaryText}>
        If you’d rather use a pseudonym, we recommend{" "}
        <a href={links.username} target="_blank" rel="noopener noreferrer">
          something memorable like "WobblyPanda"
        </a>{" "}
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
