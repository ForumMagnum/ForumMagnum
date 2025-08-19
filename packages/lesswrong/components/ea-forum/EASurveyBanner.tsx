import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { useTracking } from "../../lib/analyticsEvents";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import moment from "moment";
import DeferRender from "../common/DeferRender";
import { Link } from "@/lib/reactRouterWrapper";
import { HIDE_EA_FORUM_SURVEY_BANNER_COOKIE } from "@/lib/cookies/cookies";
import ForumIcon from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    position: "sticky",
    top: 0,
    zIndex: 10, // The typeform popup has z-index 10001
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "25px",
    padding: 12,
    background: theme.palette.buttons.alwaysPrimary,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 15,
    lineHeight: '21px',
    fontWeight: 450,
    color: theme.palette.text.alwaysWhite,
    [theme.breakpoints.down("sm")]: {
      fontSize: 14,
      flexDirection: "column",
      gap: "12px",
      padding: "12px 48px",
    },
    [theme.breakpoints.down("xs")]: {
      paddingTop: 20,
    },
  },
  button: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    borderRadius: theme.borderRadius.default,
    fontWeight: 500,
    padding: "8px 12px",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.9,
    },
  },
  close: {
    position: "absolute",
    right: 20,
    cursor: "pointer",
    "&:hover": {
      opacity: 0.75,
    },
    [theme.breakpoints.down("sm")]: {
      right: 12,
      top: 12,
    },
    [theme.breakpoints.down("xs")]: {
      top: 20,
    },
  },
});

/**
 * This banner is now disabled but the code is left here in case we want to
 * do something similar again in the future.
 */
const EASurveyBanner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const [cookies, setCookie] = useCookiesWithConsent([HIDE_EA_FORUM_SURVEY_BANNER_COOKIE]);
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();

  const hideBanner = useCallback(() => {
    setCookie(HIDE_EA_FORUM_SURVEY_BANNER_COOKIE, "true", {
      expires: moment().add(3, "months").toDate(),
      path: "/",
    });
  }, [setCookie]);

  const onDismissBanner = useCallback(() => {
    hideBanner();
    captureEvent("ea_forum_survey_banner_dismissed");
  }, [hideBanner, captureEvent]);

  const onSubmitSurvey = useCallback(() => {
    hideBanner();
    captureEvent("ea_forum_survey_closed");
  }, [hideBanner, captureEvent]);

  if (cookies[HIDE_EA_FORUM_SURVEY_BANNER_COOKIE] === "true") {
    return null;
  }
  return (
    <DeferRender ssr={!!currentUser}>
      <div className={classes.root}>
        Take the 2025 EA Forum Survey to help inform our strategy and priorities
        <Link
          to="https://forms.cea.community/forum-survey-2025?utm_source=ea_forum&utm_medium=banner"
          target="_blank"
          rel="noopener"
          onClick={onSubmitSurvey}
          className={classes.button}
        >
          Take the survey
        </Link>
        <ForumIcon
          icon="Close"
          onClick={onDismissBanner}
          className={classes.close}
        />
      </div>
    </DeferRender>
  );
}

export default registerComponent(
  "EASurveyBanner",
  EASurveyBanner,
  {styles},
);


