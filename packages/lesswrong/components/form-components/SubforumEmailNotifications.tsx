import startCase from 'lodash/startCase';
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({})

const SubforumEmailNotifications = (props, context) => {
  const currentUser = useCurrentUser();
  const label = currentUser ? `${startCase(currentUser.notificationSubforumUnread.batchingFrequency)} email notifications` : "Email notifications"
  const { FormComponentCheckbox } = Components

  return <FormComponentCheckbox {...props} label={label} />
}

const SubforumEmailNotificationsComponent = registerComponent("SubforumEmailNotifications", SubforumEmailNotifications, {styles});

declare global {
  interface ComponentTypes {
    SubforumEmailNotifications: typeof SubforumEmailNotificationsComponent
  }
}

