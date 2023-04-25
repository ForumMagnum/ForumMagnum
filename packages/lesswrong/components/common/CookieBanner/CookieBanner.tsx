import React, { useEffect } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import Button from "@material-ui/core/Button";
import classNames from "classnames";
import { useDialog } from "../withDialog";

const styles = (theme: ThemeType) => ({
  bannerContainer: {
    display: "flex",
    alignItems: "center",
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgb(69, 69, 69)", // TODO use theme color
    zIndex: 1001, // Appear above sunshine sidebar
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "14px 60px",
    [theme.breakpoints.down("xs")]: {
      padding: 14,
      flexDirection: "column",
      justifyContent: "center",
    },
  },
  text: {
    color: theme.palette.text.alwaysWhite,
    fontWeight: 400,
    maxWidth: 1200,
    fontSize: 13,
    "& a": {
      textDecoration: "underline",
      fontWeight: 600,
      "&:hover": {
        textDecoration: "underline",
      },
    },
  },
  buttonGroup: {
    display: "flex",
    marginTop: 0,
    alignItems: "flex-end",
    marginLeft: 12,
    [theme.breakpoints.down("xs")]: {
      marginTop: 12,
      marginLeft: 0,
    },
  },
  button: {
    textTransform: "none",
    whiteSpace: "nowrap",
    fontSize: 14,
    marginLeft: 6,
    [theme.breakpoints.up("sm")]: {
      marginBottom: 0,
    },
  },
});

const CookieBanner = ({ classes }: { classes: ClassesType }) => {
  const { openDialog } = useDialog();

  const { Typography } = Components;
  return (
    <div className={classNames(classes.bannerContainer)}>
      <Typography variant="body2" className={classes.text}>
        We use cookies to enhance your experience, by clicking "Accept All" you agree to their use. Customise your{" "}
        <a
          onClick={() => {
            openDialog({ componentName: "CookieDialog", componentProps: {} });
          }}
        >
          cookie settings
        </a>{" "}
        for more control, or review our cookie policy <a href='/cookiePolicy'>here</a>
      </Typography>
      <div className={classes.buttonGroup}>
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
