import React, { MouseEvent, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePostSideRecommendations } from "../../lib/postSideRecommendations";
import { useCurrentUser } from "../common/withUser";
import classNames from "classnames";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import moment from "moment";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { Loading } from "@/components/vulcan-core/Loading";
import IntercomFeedbackButton from "@/components/common/IntercomFeedbackButton";

const WIDTH = 250;

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: "100vh",
    background: theme.palette.grey[55],
    padding: 16,
    borderRadius: theme.borderRadius.default,
    width: WIDTH,
    minWidth: WIDTH,
    maxWidth: WIDTH,
    ["@media (max-width: 1250px)"]: {
      display: "none",
    },
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 600,
  },
  list: {
    margin: "12px 0",
    "& li": {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 4,
      lineHeight: "1.5em",
    },
    "& a": {
      color: theme.palette.primary.main,
    },
  },
  buttons: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  hideButton: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 600,
    color: `${theme.palette.grey[600]} !important`,
    "&:hover": {
      color: `${theme.palette.grey[800]} !important`,
      opacity: 1,
    },
  },
});

const PostSideRecommendations = ({post, className, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();
  const {
    loading,
    title,
    Container = "div",
    items,
    hideCookieName,
  } = usePostSideRecommendations(currentUser, post);
  const [
    cookies,
    setCookie,
  ] = useCookiesWithConsent(hideCookieName ? [hideCookieName] : []);

  const onHide = useCallback((ev: MouseEvent) => {
    ev.preventDefault();
    if (hideCookieName) {
      setCookie(hideCookieName, "true", {
        expires: moment().add(365, "days").toDate(),
        path: "/",
      });
      captureEvent("hidePostSideRecommendations", {title, hideCookieName});
    }
  }, [hideCookieName, setCookie, captureEvent, title]);

  if (hideCookieName && cookies[hideCookieName] === "true") {
    return null;
  }

  if (!loading && items.length < 1) {
    return null;
  }
  return (
    <AnalyticsContext pageSectionContext="postSideRecommendations">
      <div className={classNames(classes.root, className)}>
        <div className={classes.title}>{title}</div>
        {loading && <Loading />}
        <Container className={classes.list}>
          {items.map((Item, i) => <Item key={i} />)}
        </Container>
        <div className={classes.buttons}>
          <IntercomFeedbackButton eventName="postSideRecommendationsFeedback" />
          {hideCookieName &&
            <a onClick={onHide} className={classes.hideButton}>Hide</a>
          }
        </div>
      </div>
    </AnalyticsContext>
  );
}

const PostSideRecommendationsComponent = registerComponent(
  "PostSideRecommendations",
  PostSideRecommendations,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostSideRecommendations: typeof PostSideRecommendationsComponent
  }
}

export default PostSideRecommendationsComponent;
