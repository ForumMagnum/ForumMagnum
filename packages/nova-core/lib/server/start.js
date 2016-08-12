import Telescope from 'nova-lib';
import {Inject} from 'meteor/meteorhacks:inject-initial';
import Events from 'nova-events';
import { Meteor } from 'meteor/meteor';

Meteor.startup(function () {
  Events.log({
    name: "firstRun",
    unique: true, // will only get logged a single time
    important: true
  });
});

// triggers "Assigning to rvalue" error
// if (Telescope.settings.get('mailUrl')) {
//   process.env.MAIL_URL = Telescope.settings.get('mailUrl');
// }

Meteor.startup(function() {
  if (typeof SyncedCron !== "undefined") {
    SyncedCron.start();
  }
});

Inject.obj('serverTimezoneOffset', {offset: new Date().getTimezoneOffset()});