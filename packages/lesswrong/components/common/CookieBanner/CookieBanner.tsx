import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import Button from "@material-ui/core/Button";
import classNames from "classnames";
import { useDialog } from "../withDialog";

const styles = (theme: ThemeType) => ({
  bannerContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgb(69, 69, 69)", // TODO use theme color
    padding: "14px 25px 14px 25px",
    zIndex: 1001, // Appear above sunshine sidebar
    [theme.breakpoints.up("sm")]: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: "14px 25px 14px 40px",
    },
  },
  text: {
    color: theme.palette.text.alwaysWhite,
    fontWeight: 400,
    fontSize: 13,
    marginLeft: 12,
    marginRight: 12,
  },
  buttonGroup: {
    display: "flex",
    marginTop: 0,
    alignItems: "flex-end",
    [theme.breakpoints.down("sm")]: {
      marginTop: 8,
    },
  },
  button: {
    textTransform: "none",
    fontSize: 14,
    marginLeft: 4,
    marginBottom: 4,
    [theme.breakpoints.up("sm")]: {
      marginBottom: 0,
    },
  },
});

const CookieBanner = ({ classes }: { classes: ClassesType }) => {
  // TODO decide what to do about hiding some text on mobile
  const { openDialog } = useDialog();
  
  const { Typography } = Components;
  return (
    <div className={classNames(classes.bannerContainer)}>
      <Typography variant="body2" className={classes.text}>
        We use cookies to improve your experience. By clicking “Accept All”, you consent to their use.{" "}
        <span className={classes.fullText}>Please see our cookie policy here.</span>
      </Typography>
      <div className={classes.buttonGroup}>
        {/* TODO styling */}
        <Button className={classes.button} variant="contained" color="primary" onClick={() => {
          openDialog({ componentName: "CookieDialog", componentProps: {}});
        }}>
          Cookie settings
        </Button>
        <Button className={classes.button} variant="contained" color="primary">
          Reject
        </Button>
        <Button className={classes.button} variant="contained" color="primary">
          Accept all
        </Button>
      </div>
    </div>
  );
};

const CookieBannerComponent = registerComponent("CookieBanner", CookieBanner, {
  styles,
});

declare global {
  interface ComponentTypes {
    CookieBanner: typeof CookieBannerComponent;
  }
}
