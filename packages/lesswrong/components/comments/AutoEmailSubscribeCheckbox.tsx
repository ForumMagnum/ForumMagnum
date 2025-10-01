import React, { useCallback, useState, useEffect } from "react";
import { useCurrentUser } from "../common/withUser";
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useDialog } from "../common/withDialog";
import LoginPopup from "../users/LoginPopup";

const AutoEmailSubscribeCheckbox = ({
  label = "Email me replies to all comments",
}: {
  label?: string;
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const checked = !!currentUser?.notificationRepliesToMyComments?.email?.enabled;

  const [localChecked, setLocalChecked] = useState(checked);

  useEffect(() => {
    setLocalChecked(checked);
  }, [checked]);

  const { openDialog } = useDialog();

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

    const newSetting = {
      ...currentUser.notificationRepliesToMyComments,
      email: {
        ...currentUser.notificationRepliesToMyComments?.email,
        enabled: newEnabled,
      },
    };

    try {
      await updateCurrentUser({ notificationRepliesToMyComments: newSetting });
    } catch (e) {
      // Revert optimistic update on error
      setLocalChecked(!newEnabled);
    }
  }, [currentUser, localChecked, updateCurrentUser, openDialog]);

  return <SectionFooterCheckbox label={label} value={localChecked} onClick={handleToggle} />;
};

export default AutoEmailSubscribeCheckbox;
