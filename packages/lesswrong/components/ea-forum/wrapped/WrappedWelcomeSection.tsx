import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";

const styles = (theme: ThemeType) => ({
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: "transparent",
    color: theme.palette.text.alwaysWhite,
    border: `1px solid ${theme.palette.text.alwaysWhite}`,
    outline: "none",
    fontSize: 14,
    fontWeight: 500,
    padding: "8px 20px",
    borderRadius: 100,
    transition: "all ease-in-out 0.2s",
    "&:hover": {
      color: theme.palette.wrapped.highlightText,
      borderColor: theme.palette.wrapped.highlightText,
      "& svg": {
        transform: "translateX(2px)",
      },
    },
    "& svg": {
      transition: "all ease-in-out 0.2s",
      width: 12,
      height: 12,
    },
  },
});

const WrappedWelcomeSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, currentUser, goToNextSection} = useForumWrappedContext();
  const {WrappedWelcomeMessage, ForumIcon} = Components;
  return (
    <WrappedWelcomeMessage currentUser={currentUser} year={year}>
      <button onClick={goToNextSection} className={classes.button}>
        Get started <ForumIcon icon="ChevronRight" />
      </button>
    </WrappedWelcomeMessage>
  );
}

const WrappedWelcomeSectionComponent = registerComponent(
  "WrappedWelcomeSection",
  WrappedWelcomeSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedWelcomeSection: typeof WrappedWelcomeSectionComponent
  }
}
