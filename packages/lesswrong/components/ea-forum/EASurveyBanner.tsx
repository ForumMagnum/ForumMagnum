import React, { useCallback, Fragment } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { TypeformPopupEmbed } from "../common/TypeformEmbeds";
import { useCurrentUser } from "../common/withUser";
import { useTracking } from "../../lib/analyticsEvents";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import { HIDE_EA_FORUM_SURVEY_BANNER_COOKIE } from "../../lib/cookies/cookies";
import NoSSR from "react-no-ssr";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    position: "sticky",
    top: 0,
    zIndex: 10000, // The typeform popup has z-index 10001
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "25px",
    padding: 12,
    background: theme.palette.buttons.alwaysPrimary,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 15,
    fontWeight: 450,
    color: theme.palette.text.alwaysWhite,
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      gap: "12px",
      paddingRight: 60,
    },
  },
  button: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    borderRadius: theme.borderRadius.default,
    fontSize: 15,
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
  },
});

/**
 * This banner is now disabled but the code is left here in case we want to
 * do something similar again in the future. If so, there are a couple of bugs
 * to fix:
 *   1) We had some users complaining that the banner didn't get hidden properly
 *      or that it would open again when revisiting the page. The most important
 *      thing is that the cookie must be marked as "necessary" to ensure it works
 *      for users who don't accept cookies. We still had some users who reported
 *      it wasn't working properly though - maybe we should just disable the
 *      banner entirely or users who don't accept cookies?
 *   2) The banner currently obscures the autocomplete window that popups up
 *      when typing in the search box. We probably just need to add some kind
 *      of top margin or offset.
 */
const EASurveyBanner = ({classes}: {classes: ClassesType}) => {
  const cookieName = HIDE_EA_FORUM_SURVEY_BANNER_COOKIE;
  const [cookies, setCookie] = useCookiesWithConsent([cookieName]);
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();

  const hideBanner = useCallback(() => {
    setCookie(cookieName, "true", {
      expires: moment().add(3, "months").toDate(),
    });
  }, [cookieName, setCookie]);

  const onDismissBanner = useCallback(() => {
    hideBanner();
    captureEvent("ea_forum_survey_banner_dismissed");
  }, [hideBanner, captureEvent]);

  const onSubmitSurvey = useCallback(() => {
    hideBanner();
    captureEvent("ea_forum_survey_closed");
  }, [hideBanner, captureEvent]);

  if (cookies[cookieName] === "true") {
    return null;
  }

  const Wrapper = currentUser ? Fragment : NoSSR;

  const {ForumIcon} = Components;
  return (
    <Wrapper>
      <div className={classes.root}>
        Take the 4 minute EA Forum Survey to help inform our strategy and funding decisions
        <TypeformPopupEmbed
          widgetId="Z1wH4v8v"
          domain="cea-core.typeform.com"
          title="EA Forum survey"
          label="Take the survey"
          onSubmit={onSubmitSurvey}
          className={classes.button}
        />
        <ForumIcon
          icon="Close"
          onClick={onDismissBanner}
          className={classes.close}
        />
      </div>
    </Wrapper>
  );
}

const EASurveyBannerComponent = registerComponent(
  "EASurveyBanner",
  EASurveyBanner,
  {styles},
);

declare global {
  interface ComponentTypes {
    EASurveyBanner: typeof EASurveyBannerComponent
  }
}
