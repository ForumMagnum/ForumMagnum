import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { useForumWrappedContext } from "./hooks";
import WrappedWelcomeMessage from "@/components/ea-forum/wrapped/WrappedWelcomeMessage";
import ForumIcon from "@/components/common/ForumIcon";

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
    fontSize: 16,
    fontWeight: 500,
    padding: "12px 24px",
    borderRadius: 100,
    transition: "all ease-in-out 0.2s",
    "&:hover": {
      color: theme.palette.text.alwaysBlack,
      backgroundColor: theme.palette.text.alwaysWhite,
      "& svg": {
        transform: "translateX(2px)",
      },
    },
    "& svg": {
      transition: "all ease-in-out 0.2s",
      width: 15,
      height: 15,
    },
  },
});

const WrappedWelcomeSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, currentUser, goToNextSection} = useForumWrappedContext();
  return (
    <WrappedWelcomeMessage currentUser={currentUser} year={year}>
      <button onClick={goToNextSection} className={classes.button}>
        View your year <ForumIcon icon="ChevronRight" />
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

export default WrappedWelcomeSectionComponent;
