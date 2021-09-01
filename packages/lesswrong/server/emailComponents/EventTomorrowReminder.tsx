import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import type { RSVPType } from '../../lib/collections/posts/schema';

const styles = (theme: ThemeType): JssStyles => ({
});

const EventTomorrowReminder = ({postId, rsvp, classes}: {
  postId: string,
  rsvp: RSVPType,
  classes: ClassesType,
}) => {
  return <Components.NewPostEmail
    documentId={postId}
    hideRecommendations
    reason={`you RSVPed ${rsvp.response} to this event`}
  />
}

const EventTomorrowReminderComponent = registerComponent("EventTomorrowReminder", EventTomorrowReminder, {styles});

declare global {
  interface ComponentTypes {
    EventTomorrowReminder: typeof EventTomorrowReminderComponent
  }
}
