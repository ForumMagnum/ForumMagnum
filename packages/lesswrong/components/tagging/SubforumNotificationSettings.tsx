import React, { useEffect, useRef, useState } from "react";
import { Components, getFragment, registerComponent } from "../../lib/vulcan-lib";
import NotificationsNoneIcon from "@material-ui/icons/NotificationsNone";
import NotificationsIcon from "@material-ui/icons/Notifications";
import Checkbox from '@material-ui/core/Checkbox';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import UserTagRels from "../../lib/collections/userTagRels/collection";
import { useMulti } from "../../lib/crud/withMulti";
import { Link } from "../../lib/reactRouterWrapper";
import { useRecordSubforumView } from "../hooks/useRecordSubforumView";
import { useFilterSettings } from '../../lib/filterSettings';

const styles = (theme: ThemeType): JssStyles => ({
  notificationsButton: {
    padding: 4,
  },
  popout: {
    padding: "1px 0px 4px 0px",
    maxWidth: 250,
    '& .form-input': {
      marginTop: 12,
    },
    '& .form-input:last-child': {
      marginBottom: 4,
    }
  },
  upweight: {
    display: "flex",
    alignItems: "center",
    marginBottom: -3,
    "& .MuiButtonBase-root": {
      padding: 6,
    },
  },
  accountLink: {
    borderTop: "solid 1px",
    borderColor: theme.palette.grey[300],
    margin: "0px 4px",
    padding: "4px 4px 0px 4px",
    fontSize: 13,
    color: theme.palette.primary.main
  },
});

const SubforumNotificationSettings = ({
  tag,
  currentUser,
  className,
  classes,
}: {
  tag: TagBasicInfo;
  currentUser: UsersCurrent;
  className?: string;
  classes: ClassesType;
}) => {
  const {filterSettings, setTagFilter, removeTagFilter} = useFilterSettings();
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const { LWClickAwayListener, LWPopper, WrappedSmartForm, FormComponentCheckbox, Typography, Loading } = Components;

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

  const filterSetting = filterSettings?.tags?.find(({tagId}) => tag._id === tagId);
  const isFrontpageSubscribed = filterSetting?.filterMode === "Subscribed";

  const toggleIsFrontpageSubscribed = () =>
    setTagFilter({
      tagId: tag._id,
      tagName: tag.name,
      filterMode: isFrontpageSubscribed ? 0 : "Subscribed",
    });

  return (
    <AnalyticsContext pageSection="subforumNotificationSettings">
      <div className={className}>
        <div ref={anchorEl}>
          <IconButton onClick={() => setOpen(!open)} className={classes.notificationsButton}>
            {(!userTagRel.subforumShowUnreadInSidebar && !userTagRel.subforumEmailNotifications) ? (
              <NotificationsNoneIcon />
            ) : (
              <NotificationsIcon />
            )}
          </IconButton>
        </div>
        <LWPopper open={open} anchorEl={anchorEl.current} placement="bottom-end">
          <LWClickAwayListener onClickAway={() => setOpen(false)}>
            <Paper className={classes.popout}>
              {loading ? (
                <Loading />
              ) : (
                <>
                  <span className={classes.upweight}>
                    <Checkbox checked={isFrontpageSubscribed} onChange={toggleIsFrontpageSubscribed} disableRipple />
                    <Typography variant="body2">Upweight on frontpage</Typography>
                  </span>
                  <WrappedSmartForm
                    collection={UserTagRels}
                    documentId={userTagRel?._id}
                    queryFragment={getFragment("UserTagRelNotifications")}
                    mutationFragment={getFragment("UserTagRelNotifications")}
                    autoSubmit
                  />
                  <Typography variant="body2" className={classes.accountLink}>
                    <Link to={"/account?highlightField=notificationSubforumUnread"}>Change batching and email vs on-site in account settings</Link>
                  </Typography>
                </>
              )}
            </Paper>
          </LWClickAwayListener>
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
