import React, { useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isPostsListViewType, usePostsListView } from "../hooks/usePostsListView";
import { useTracking } from "../../lib/analyticsEvents";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import { NEW_POSTS_LIST_VIEW_TOGGLE_COOKIE } from "../../lib/cookies/cookies";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
  },
  flag: {
    position: "absolute",
    right: -34,
    top: 8,
    width: 34,
    height: 18,
    padding: "2px 4px",
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    borderRadius: theme.borderRadius.small,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 11,
    fontWeight: 600,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  flagPoint: {
    position: "absolute",
    top: 6,
    left: -3,
    width: 6,
    height: 6,
    transform: "scaleY(70%) rotate(45deg)",
    background: theme.palette.primary.main,
  },
});

const options = {
  card: {label: "Card view", icon: "CardView"},
  list: {label: "List view", icon: "ListView"},
} as const;

type ViewToggleCookieData = {
  viewCount: number,
  firstViewedAt: Date,
}

const getCookieData = (data: unknown): ViewToggleCookieData => {
  try {
    if (
      !data || typeof data !== "object" ||
      !("viewCount" in data) || typeof data.viewCount !== "number" ||
      !("firstViewedAt" in data) || typeof data.firstViewedAt !== "string"
    ) {
      throw new Error("Invalid data");
    }
    return {
      viewCount: data.viewCount,
      firstViewedAt: new Date(data.firstViewedAt),
    };
  } catch (e) {
    return {
      viewCount: 0,
      firstViewedAt: new Date(),
    };
  }
}

const PostsListViewToggle = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();

  /*
   * Hide the NEW flag when any of the following is true:
   *   - The user clicks the toggle
   *   - The user sees it three times without clicking
   *   - One month passes from when the user first saw it
   */
  const [cookies, setCookie] = useCookiesWithConsent([
    NEW_POSTS_LIST_VIEW_TOGGLE_COOKIE,
  ]);
  const [data, setData] = useState(
    () => getCookieData(cookies[NEW_POSTS_LIST_VIEW_TOGGLE_COOKIE]),
  );

  const updateData = useCallback((newData: ViewToggleCookieData) => {
    setCookie(NEW_POSTS_LIST_VIEW_TOGGLE_COOKIE, JSON.stringify(newData), {
      path: "/",
    });
    setData(newData);
  }, [setCookie]);

  const onClick = useCallback(() => {
    updateData({...data, viewCount: 5});
  }, [data, updateData]);

  useEffect(() => {
    updateData({...data, viewCount: data.viewCount + 1});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showFlag = data.viewCount < 4 &&
    moment(data.firstViewedAt).add(1, "month").isAfter(moment()) &&
    new Date() < new Date("2024-05-31");

  const {view, setView} = usePostsListView();

  const onSelect = useCallback((value: string) => {
    if (isPostsListViewType(value)) {
      setView(value);
      captureEvent("postsListViewToggle", {value});
    }
  }, [setView, captureEvent]);

  const {ForumDropdown} = Components;
  return (
    <div className={classes.root} onClick={onClick}>
      <ForumDropdown
        value={view}
        options={options}
        onSelect={onSelect}
        paddingSize={24}
        useIconLabel
        className={classes.root}
      />
      {showFlag &&
        <div className={classes.flag}>
          <div className={classes.flagPoint} />
          NEW
        </div>
      }
    </div>
  );
}

const PostsListViewToggleComponent = registerComponent(
  "PostsListViewToggle",
  PostsListViewToggle,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsListViewToggle: typeof PostsListViewToggleComponent
  }
}
