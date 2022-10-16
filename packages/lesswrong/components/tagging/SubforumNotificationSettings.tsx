import React, { useState } from "react";
import { Components, getFragment, registerComponent } from "../../lib/vulcan-lib";
import NotificationsIcon from "@material-ui/icons/Notifications";
import { useCurrentUser } from "../common/withUser";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import IconButton from "@material-ui/core/IconButton";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Paper from "@material-ui/core/Paper";
import UserTagRels from "../../lib/collections/userTagRels/collection";
import { useMulti } from "../../lib/crud/withMulti";
import { useUpdate } from "../../lib/crud/withUpdate";
import Checkbox from "@material-ui/core/Checkbox";

const styles = (theme: ThemeType): JssStyles => ({
  root: {},
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

  const { LWPopper, WrappedSmartForm } = Components;

  const { loading, results } = useMulti({
    terms: { tagId: tag._id, userId: currentUser._id },
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelNotifications",
    fetchPolicy: "cache-and-network",
  });

  const { mutate: updateUserTagRel } = useUpdate({
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelNotifications",
  });

  if (!currentUser || !currentUser.profileTagIds.includes(tag._id)) return null;

  const userTagRel = results?.length ? results[0] : undefined;

  const handleOpen = (event) => {
    setOpen(true);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (e) => {
    if (e && anchorEl?.contains(e.target)) {
      return;
    }
    setOpen(false);
    setAnchorEl(null);
  };

  const handleToggle = (e) => {
    if (open) {
      handleClose(null); // When closing from toggle, force a close by not providing an event
    } else {
      handleOpen(e);
    }
  };

  return (
    <AnalyticsContext pageSection="karmaChangeNotifer">
      <div className={classes.root}>
        <IconButton onClick={handleToggle} className={classes.karmaNotifierButton}>
          <NotificationsIcon />
        </IconButton>
        <LWPopper open={open} anchorEl={anchorEl} placement="bottom-end" className={classes.karmaNotifierPopper}>
          <ClickAwayListener onClickAway={handleClose}>
            <Paper className={classes.karmaNotifierPaper}>
              {/* <div>
                <div className={classes.root}>
                  <Checkbox
                    className={classes.size}
                    checked={true}
                    onChange={(event, checked) => {}}
                    disableRipple
                  />
                  <Components.Typography className={classes.inline} variant="body2" component="label">
                    {"test"}
                  </Components.Typography>
                </div>
              </div> */}
              <WrappedSmartForm
                collection={UserTagRels}
                documentId={userTagRel?._id}
                queryFragment={getFragment("UserTagRelNotifications")}
                mutationFragment={getFragment("UserTagRelNotifications")}
                changeCallback={() => {return "hello"}}
                autoSubmit
              />
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
