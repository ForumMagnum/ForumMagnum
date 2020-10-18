// import { Meteor } from 'meteor/meteor';
// import { Tracker } from 'meteor/tracker';
// import { ServiceConfiguration } from 'meteor/service-configuration';
// export { Tracker, ServiceConfiguration };

// export const publishDDP = Meteor.publish;
// export const subscribeDDP = Meteor.subscribe;
// export const disconnectDdp = Meteor.disconnect;
// export const reconnectDdp = Meteor.reconnect;

export const Tracker = {};
export const ServiceConfiguration = {};

export const publishDDP = console.log("publishDDP");
export const subscribeDDP = console.log("subsribe");
export const disconnectDdp = console.log("disconnect");
export const reconnectDdp = console.log("reconnect");