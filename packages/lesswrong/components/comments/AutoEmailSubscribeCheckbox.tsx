import React, { useCallback, useState, useEffect, useRef } from "react";
import { useCurrentUser } from "../common/withUser";
import Switch from '@/lib/vendor/@material-ui/core/src/Switch';
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useDialog } from "../common/withDialog";
import LoginPopup from "../users/LoginPopup";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { NotificationTypeSettings } from "@/lib/collections/users/notificationFieldHelpers";
import LWTooltip from "../common/LWTooltip";
import ToggleSwitch from "../common/ToggleSwitch";

const styles = defineStyles("AutoEmailSubscribeCheckbox", (theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
  },
  switchWrapper: {
    cursor: "pointer",
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    lineHeight: `18px`,
    display: "flex",
    alignItems: "center",
    "& .ToggleSwitch-root": {
      width: `26px !important`,
      height: `16px !important`,
      minWidth: `26px !important`,
    },
    "& .ToggleSwitch-switchOn": {
      left: -4,
    }
  },
  switch: {
    marginRight: 8,
    opacity: 0.75,
    "& .ToggleSwitch-handle": {
      width: 12,
      height: 12,
    },
  },
  label: {
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
  },
  disabled: {
    opacity: 0.7,
    filter: "grayscale(100%)",
  },
  hideOnMobile: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
}));

const AutoEmailSubscribeCheckbox = () => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { openDialog } = useDialog();

  const setting: NotificationTypeSettings|null = currentUser?.notificationRepliesToMyComments;
  const checked = !!setting?.email.enabled;
  const classes = useStyles(styles);

  const handleToggle = useCallback(async () => {
    if (!currentUser) {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
      });
      return
    };

    const newSetting = { ...setting, email: { ...setting?.email, enabled: !checked } };

    await updateCurrentUser({ notificationRepliesToMyComments: newSetting }, {
      optimisticResponse: {
        updateUser: {
          __typename: "UserOutput",
          data: {
            __typename: "User",
            ...{
              ...currentUser,
              notificationRepliesToMyComments: newSetting,
            }
          }
        }
      }
    });
  }, [currentUser, setting, updateCurrentUser, openDialog, checked]);

  // if email notifications are not enabled on first page-load, don't show this UI
  // (otherwise, continuing showing the UI when the user toggles it on-and-off)
  const initialEmailEnabled = useRef(checked);
  if (!initialEmailEnabled.current) {
    return null;
  }

  const tooltip = <div><p>If enabled, you'll get an email whenever someone replies to any of your comments.</p><p><em>(Applies to all replies to all comments you make.)</em></p></div>

  const label = <span>Email me replies <span className={classes.hideOnMobile}>to all my comments</span></span>

  const switchElement = <span className={classes.switchWrapper} onClick={handleToggle}>
    <ToggleSwitch className={classes.switch} value={checked} />
    <span className={classes.label}>{label}</span>
  </span>

  return <span className={!checked? classes.disabled : classes.root}>
    <LWTooltip title={tooltip} placement="bottom-start" inlineBlock={false}>
      {switchElement}
    </LWTooltip>
  </span>
};

export default AutoEmailSubscribeCheckbox;
