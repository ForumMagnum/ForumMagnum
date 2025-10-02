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
  const [localChecked, setLocalChecked] = useState(checked);
  const classes = useStyles(styles);

  // Sync local state when the authoritative server value changes (e.g. after refetch)
  useEffect(() => {
    setLocalChecked(checked);
  }, [checked]);

  const handleToggle = useCallback(async () => {
    if (!currentUser) {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
      });
      return
    };

    const newEnabled = !localChecked;
    setLocalChecked(newEnabled);

    const newSetting = { ...setting, email: { ...setting?.email, enabled: newEnabled } };

    try {
      await updateCurrentUser({ notificationRepliesToMyComments: newSetting });
    } catch (e) {
      // Revert optimistic update on error
      setLocalChecked(!newEnabled);
    }
  }, [currentUser, localChecked, setting, updateCurrentUser, openDialog]);

  return <span className={!localChecked? classes.disabled : ""}>
    <SectionFooterCheckbox label={"Email me replies to all comments"} value={localChecked} onClick={handleToggle} />
  </span>;
};

export default AutoEmailSubscribeCheckbox;
