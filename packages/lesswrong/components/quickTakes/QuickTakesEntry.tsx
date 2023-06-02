import React, { useCallback } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    padding: 12,
    display: "flex",
    gap: "12px",
    height: 64,
  },
  form: {
    width: "100%",
    height: "100%",
  },
  entry: {
    width: "100%",
    height: "100%",
    color: theme.palette.grey[1000],
    background: theme.palette.grey[100],
    borderRadius: theme.borderRadius.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    padding: 10,
    "&::placeholder": {
      color: theme.palette.grey[600],
    },
  },
});

const QuickTakesEntry = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const onSubmit = useCallback(() => {
  }, [currentUser]);
  const {UsersProfileImage} = Components;
  return (
    <div className={classes.root}>
      <UsersProfileImage user={currentUser} size={32} />
      <form onSubmit={onSubmit} className={classes.form}>
        <input
          type="text"
          className={classes.entry}
          placeholder="Share exploratory, draft-stage, rough thoughts..."
        />
      </form>
    </div>
  );
}

const QuickTakesEntryComponent = registerComponent(
  "QuickTakesEntry",
  QuickTakesEntry,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesEntry: typeof QuickTakesEntryComponent
  }
}
