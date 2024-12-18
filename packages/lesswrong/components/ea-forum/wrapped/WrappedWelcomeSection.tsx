import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";

const styles = (theme: ThemeType) => ({
  heading: {
    fontSize: 54,
    fontWeight: 700,
    lineHeight: "110%",
    letterSpacing: "-2.7px",
    textAlign: "left",
    marginTop: 0,
  },
  wrapped: {
    color: theme.palette.wrapped.highlightText,
  },
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
  const {WrappedSection, ForumIcon} = Components;
  return (
    <WrappedSection pageSectionContext="top" align="left">
      <h1 className={classes.heading}>
        Hi {currentUser.displayName}, this is your {year} EA Forum{" "}
        <span className={classes.wrapped}>Wrapped</span>
      </h1>
      <button onClick={goToNextSection} className={classes.button}>
        Get started <ForumIcon icon="ChevronRight" />
      </button>
    </WrappedSection>
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
