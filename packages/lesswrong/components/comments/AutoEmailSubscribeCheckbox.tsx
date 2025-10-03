import React, { useCallback, useState, useEffect } from "react";
import { useCurrentUser } from "../common/withUser";
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useDialog } from "../common/withDialog";
import LoginPopup from "../users/LoginPopup";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles("AutoEmailSubscribeCheckbox", (theme) => ({
  disabled: {
    opacity: 0.8,
    filter: "grayscale(100%)",
  },
}));

const AutoEmailSubscribeCheckbox = () => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { openDialog } = useDialog();

  const setting = currentUser?.notificationRepliesToMyComments;
  const checked = !!setting?.email?.enabled;
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

  return <span className={!checked? classes.disabled : ""}>
    <SectionFooterCheckbox label={"Email me replies to all comments"} value={checked} onClick={handleToggle} />
  </span>;
};

export default AutoEmailSubscribeCheckbox;
