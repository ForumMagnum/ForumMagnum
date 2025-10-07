import React, { useCallback, useState, useEffect, useRef } from "react";
import { useCurrentUser } from "../common/withUser";
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useDialog } from "../common/withDialog";
import LoginPopup from "../users/LoginPopup";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { NotificationTypeSettings } from "@/lib/collections/users/notificationFieldHelpers";

const styles = defineStyles("AutoEmailSubscribeCheckbox", (theme) => ({
  disabled: {
    opacity: 0.8,
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

  const initialEmailEnabled = useRef(checked);

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

  if (!initialEmailEnabled.current) {
    return null;
  }

  const tooltip = <div><p>If enabled, you'll get an email whenever someone replies to any of your comments.</p><p><em>(Applies to all replies to all comments you make.)</em></p></div>

  const label = <span>Email me replies <span className={classes.hideOnMobile}>to all my comments</span></span>

  return <span className={!checked? classes.disabled : ""}>
    <SectionFooterCheckbox label={label} value={checked} onClick={handleToggle} tooltip={tooltip}  />
  </span>
};

export default AutoEmailSubscribeCheckbox;
