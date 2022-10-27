import React, { useEffect, useState } from "react";
import { Components, getFragment, registerComponent } from "../../lib/vulcan-lib";
import NotificationsNoneIcon from "@material-ui/icons/NotificationsNone";
import NotificationsIcon from "@material-ui/icons/Notifications";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import IconButton from "@material-ui/core/IconButton";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Paper from "@material-ui/core/Paper";
import UserTagRels from "../../lib/collections/userTagRels/collection";
import { useMulti } from "../../lib/crud/withMulti";
import { Link } from "../../lib/reactRouterWrapper";
import { useRecordSubforumView } from "../hooks/useRecordSubforumView";

const styles = (theme: ThemeType): JssStyles => ({
  notificationsButton: {
    margin: "0 12px 0 0",
    padding: 4,
  },
  popout: {
    padding: "1px 0px 4px 0px",
  },
  accountLink: {
    marginTop: -6,
    padding: "0px 8px",
    fontStyle: "italic",
  },
});

const SubforumNotificationSettings = ({
  tag,
  currentUser,
  classes,
}: {
  tag: TagBasicInfo;
  currentUser: UsersCurrent;
  classes: ClassesType;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const { LWPopper, WrappedSmartForm, Typography, Loading } = Components;

  const { loading, results, refetch } = useMulti({
    terms: { view: "single", tagId: tag._id, userId: currentUser._id },
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelNotifications",
    fetchPolicy: "cache-and-network",
  });
  const recordSubforumView = useRecordSubforumView({userId: currentUser._id, tagId: tag._id});

  const userTagRel = results?.length ? results[0] : undefined;
  
  // This is to ensure the userTagRel exists, which it almost always should because it is created as a result of loading `SubforumCommentsThread`
  // but there are some weird edge cases related to logging in and out
  useEffect(() => {
    if (!loading && !userTagRel) {
      void recordSubforumView().then(() => refetch())
    }
  }, [userTagRel, recordSubforumView, refetch, loading]);

  // Don't show notification settings if the user is not subscribed to the tag
  if (!currentUser || !currentUser.profileTagIds?.includes(tag._id)) return null;
  if (!userTagRel) return null
  if (loading) return null

  const handleOpen = (event) => {
    setOpen(true);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (e) => {
    if (e && anchorEl?.contains(e.target)) {
      return;
    }
    setOpen(false);
  };

  const handleToggle = (e) => {
    if (open) {
      handleClose(null); // When closing from toggle, force a close by not providing an event
    } else {
      handleOpen(e);
    }
  };

  return (
    <AnalyticsContext pageSection="subforumNotificationSettings">
      <div className={classes.root}>
        <IconButton onClick={handleToggle} className={classes.notificationsButton}>
          {(!userTagRel.subforumShowUnreadInSidebar && !userTagRel.subforumEmailNotifications) ? (
            <NotificationsNoneIcon />
          ) : (
            <NotificationsIcon />
          )}
        </IconButton>
        <LWPopper open={open} anchorEl={anchorEl} placement="bottom-end">
          <ClickAwayListener onClickAway={handleClose}>
            <Paper className={classes.popout}>
              {loading ? (
                <Loading />
              ) : (
                <>
                  <WrappedSmartForm
                    collection={UserTagRels}
                    documentId={userTagRel?._id}
                    queryFragment={getFragment("UserTagRelNotifications")}
                    mutationFragment={getFragment("UserTagRelNotifications")}
                    autoSubmit
                  />
                  <Typography variant="subheading" className={classes.accountLink}>
                    <Link to={"/account"}>Change batching in user settings</Link>
                  </Typography>
                </>
              )}
            </Paper>
          </ClickAwayListener>
        </LWPopper>
      </div>
    </AnalyticsContext>
  );
};

const SubforumNotificationSettingsComponent = registerComponent(
  "SubforumNotificationSettings",
  SubforumNotificationSettings,
  { styles, stylePriority: 1 }
);

declare global {
  interface ComponentTypes {
    SubforumNotificationSettings: typeof SubforumNotificationSettingsComponent;
  }
}
