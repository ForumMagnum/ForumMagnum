import React, { useCallback } from "react";
import { useCurrentUser } from "../common/withUser";
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";

const AutoEmailSubscribeCheckbox = ({
  label = "Email me replies to all comments",
}: {
  label?: string;
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const checked = !!currentUser?.notificationRepliesToMyComments?.email?.enabled;

  const handleToggle = useCallback(async () => {
    if (!currentUser) return;

    const newEnabled = !checked;
    const newSetting = {
      ...currentUser.notificationRepliesToMyComments,
      email: {
        ...currentUser.notificationRepliesToMyComments?.email,
        enabled: newEnabled,
      },
    };

    await updateCurrentUser({ notificationRepliesToMyComments: newSetting });
  }, [currentUser, checked, updateCurrentUser]);

  // Render disabled checkbox for logged-out users (mirrors previous behaviour).
  if (!currentUser) {
    return <SectionFooterCheckbox label={label} value={false} onClick={() => {}} />;
  }

  return <SectionFooterCheckbox label={label} value={checked} onClick={handleToggle} />;
};

export default AutoEmailSubscribeCheckbox;
