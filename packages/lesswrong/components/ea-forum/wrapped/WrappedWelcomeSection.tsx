import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useForumWrappedContext } from "./hooks";
import { WrappedWelcomeMessage } from "./WrappedWelcomeMessage";
import { ForumIcon } from "../../common/ForumIcon";

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

const WrappedWelcomeSectionInner = ({classes}: {
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

export const WrappedWelcomeSection = registerComponent(
  "WrappedWelcomeSection",
  WrappedWelcomeSectionInner,
  {styles},
);


