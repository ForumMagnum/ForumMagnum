import React, { MouseEvent, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePostSideRecommendations } from "../../lib/postSideRecommendations";
import { useCurrentUser } from "../common/withUser";
import classNames from "classnames";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import moment from "moment";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";

const WIDTH = 250;

const styles = (theme: ThemeType) => ({
  root: {
    width: WIDTH,
    minWidth: WIDTH,
    maxWidth: WIDTH,
    ["@media (max-width: 1500px)"]: {
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
    paddingLeft: "1em",
    "& li": {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 4,
    },
  },
  numberedList: {
    "& li": {
      marginBottom: 14,
    },
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
  classes: ClassesType,
}) => {
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();
  const {
    loading,
    title,
    numbered,
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
  }, [hideCookieName, setCookie]);

  if (hideCookieName && cookies[hideCookieName] === "true") {
    return null;
  }

  const List = numbered ? "ol" : "ul";
  return (
    <AnalyticsContext pageSectionContext="postSideRecommendations">
      <div className={classNames(classes.root, className)}>
        <div className={classes.title}>{title}</div>
        {loading && <Components.Loading />}
        <List className={classNames(classes.list, {
          [classes.numberedList]: numbered,
        })}>
          {items.map((Item, i) => <Item key={i} />)}
        </List>
        {hideCookieName &&
          <a onClick={onHide} className={classes.hideButton}>Hide</a>
        }
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
