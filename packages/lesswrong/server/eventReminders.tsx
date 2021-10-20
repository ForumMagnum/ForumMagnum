import React from 'react';
import { Components } from '../lib/vulcan-lib/components';
import { testServerSetting } from './debouncer';
import { Posts } from '../lib/collections/posts/collection';
import { Users } from '../lib/collections/users/collection';
import { getUsersToNotifyAboutEvent } from './notificationCallbacks';
import { addCronJob } from './cronUtil';
import { updateMutator } from './vulcan-lib/mutators';
import { wrapAndSendEmail } from './emails/renderEmail';
import './emailComponents/EventTomorrowReminder';
import moment from '../lib/moment-timezone';

async function checkAndSendUpcomingEventEmails() {
  const in24hours = moment(new Date()).add(24, 'hours');
  
  // Find events that:
  //  * Are in the future
  //  * Start in less than 25 hours
  let upcomingEvents = await Posts.find({
    ...Posts.defaultView({}).selector,
    startTime: {$gte: new Date(), $lt: in24hours},
  }).fetch();
  
  for (let upcomingEvent of upcomingEvents) {
    // Skip if it's already had next-day reminders sent
    if (upcomingEvent.nextDayReminderSent)
      continue;
    // Mark it as having had the reminders sent
    // (We do this before the actual sending, rather than after, so that if
    // something goes wrong we can't get into a resend-loop.)
    await updateMutator({
      collection: Posts,
      documentId: upcomingEvent._id,
      set: {
        nextDayReminderSent: true,
      },
      validate: false,
    });
    
    const emailsToNotify = await getUsersToNotifyAboutEvent(upcomingEvent);
    
    for (let {userId,email,rsvp} of emailsToNotify) {
      if (!email) continue;
      const user = await Users.findOne(userId);
      
      await wrapAndSendEmail({
        user, to: email,
        subject: `Event soon: ${upcomingEvent.title}`,
        body: <Components.EventTomorrowReminder rsvp={rsvp} postId={upcomingEvent._id}/>
      });
    }
  }
}

if (!testServerSetting.get()) {
  addCronJob({
    name: "Send upcoming-event reminders",
    // every minute
    cronStyleSchedule: '* * * * *',
    job() {
      void checkAndSendUpcomingEventEmails();
    }
  });
}
