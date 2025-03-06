import startCase from 'lodash/startCase';
import React from 'react';
import { NotificationChannelOption } from '../../lib/collections/users/schema';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import FormComponentCheckbox from "@/components/form-components/FormComponentCheckbox";

const styles = (theme: ThemeType) => ({})

const SubforumNotifications = (props: FormComponentProps<boolean>) => {
  const currentUser = useCurrentUser();
  if (!currentUser) return null;

  const frequencyLabel = `${startCase(currentUser.notificationSubforumUnread?.batchingFrequency ?? "Daily")} notifications`

  const getChannelLabel = (channel: NotificationChannelOption): string => {
    if (channel === "none") return "(disabled in user settings)"
    if (channel === "onsite") return "on-site"
    if (channel === "email") return "by email"
    if (channel === "both") return "both on-site and by email"
    return channel // backup in case we add a new channel type and forget to update this
  }
  const channelLabel = currentUser ? getChannelLabel(currentUser.notificationSubforumUnread?.channel ?? "none") : "disabled"
  return <FormComponentCheckbox {...props} label={`${frequencyLabel} ${channelLabel}`} />
}

const SubforumNotificationsComponent = registerComponent("SubforumNotifications", SubforumNotifications, {styles});

declare global {
  interface ComponentTypes {
    SubforumNotifications: typeof SubforumNotificationsComponent
  }
}

export default SubforumNotificationsComponent;

