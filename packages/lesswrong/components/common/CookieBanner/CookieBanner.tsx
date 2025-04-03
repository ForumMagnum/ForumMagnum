import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import classNames from "classnames";
import { useDialog } from "../withDialog";
import { useCookiePreferences } from "../../hooks/useCookiesWithConsent";
import { ALL_COOKIES, ONLY_NECESSARY_COOKIES } from "../../../lib/cookies/utils";

const styles = (theme: ThemeType) => ({
  bannerContainer: {
    display: "flex",
    alignItems: "center",
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.palette.panelBackground.cookieBanner,
    zIndex: 1001, // Appear above sunshine sidebar
    flexDirection: "row",
    justifyContent: "center",
    padding: "16px",
    [theme.breakpoints.down("md")]: {
      padding: "16px",
    },
    [theme.breakpoints.down("xs")]: {
      padding: 14,
      flexDirection: "column",
      display: "grid",
    },
  },
  text: {
    color: theme.palette.text.invertedBackgroundText,
    fontWeight: 400,
    maxWidth: 1200,
    fontSize: 14,
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
    marginLeft: 24,
    [theme.breakpoints.down("xs")]: {
      marginTop: 12,
      marginLeft: 0,
    },
  },
  button: {
    textTransform: "none",
    color: theme.palette.text.alwaysWhite,
    whiteSpace: "nowrap",
    fontSize: 14,
    marginRight: 6,
    boxShadow: "none",
    [theme.breakpoints.up("sm")]: {
      marginBottom: 0,
    },
  },
  rejectButton: {
    backgroundColor: theme.palette.grey[600],
    "&:hover": {
      backgroundColor: theme.palette.grey[700],
    },
  }
});

const CookieBanner = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { openDialog } = useDialog();
  const { updateCookiePreferences } = useCookiePreferences();
  
  const handleAcceptAll = () => {
    updateCookiePreferences(ALL_COOKIES);
  }
  const handleReject = () => {
    updateCookiePreferences(ONLY_NECESSARY_COOKIES);
  }

  const { Typography } = Components;
  return (
    <div className={classNames(classes.bannerContainer)}>
      <Typography variant="body2" className={classes.text}>
        We and our partners use cookies, including to review how our site is used and to improve our site's performance.
        By clicking "Accept all" you agree to their use. Customise your{" "}
        <a
          onClick={() => {
            openDialog({ componentName: "CookieDialog", componentProps: {} });
          }}
        >
          cookie settings
        </a>{" "}
        for more control, or review our cookie policy <a href="/cookiePolicy">here</a>.
      </Typography>
      <div className={classes.buttonGroup}>
        <Button className={classNames(classes.button, classes.rejectButton)} variant="contained" onClick={handleReject}>
          Reject
        </Button>
        <Button className={classes.button} variant="contained" color="primary" onClick={handleAcceptAll}>
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
