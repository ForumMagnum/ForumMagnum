import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
// TODO use forum components
import Checkbox from "@material-ui/core/Checkbox";

const styles = (theme: ThemeType) => ({
  content: {
    minWidth: 300,
  },
  categoryTitle: {
    fontWeight: 500,
  },
  category: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

const CookieDialog = ({ onClose, classes }: {
  onClose?: ()=>void,
  classes: ClassesType,
}) => {
  const { LWDialog, Typography } = Components;

  return (
    <LWDialog open onClose={onClose}>
      <DialogTitle>Cookie Settings</DialogTitle>
      <DialogContent className={classes.content}>
        <Typography variant="body2">
          We use cookies on our website to give you the most relevant experience by remembering your preferences and
          repeat visits. By clicking “Accept All”, you consent to the use of ALL the cookies. Please see our cookie policy
          here
        </Typography>
        <div className={classes.category}>
          <Typography variant="body2" className={classes.categoryTitle}>
            Necessary
          </Typography>
          <Typography variant="body2">Always enabled</Typography>
        </div>
        <div className={classes.category}>
          <Typography variant="body2" className={classes.categoryTitle}>
            Functional
          </Typography>
          <Checkbox />
        </div>
        <div className={classes.category}>
          <Typography variant="body2" className={classes.categoryTitle}>
            Analytics
          </Typography>
          <Checkbox />
        </div>
      </DialogContent>
    </LWDialog>
  );
};

const CookieDialogComponent = registerComponent("CookieDialog", CookieDialog, {
  styles,
});

declare global {
  interface ComponentTypes {
    CookieDialog: typeof CookieDialogComponent;
  }
}
