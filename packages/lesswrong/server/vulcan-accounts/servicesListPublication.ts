import { Meteor } from 'meteor/meteor';
import { getLoginServices } from '../../lib/vulcan-accounts/helpers';

Meteor.publish('servicesList', function(this: any) {
  let services = getLoginServices();
  // @ts-ignore
  if (Package['accounts-password']) {
    services.push({name: 'password'});
  }
  let fields = {};
  // Publish the existing services for a user, only name or nothing else.
  services.forEach(service => fields[`services.${service.name}.name`] = 1);
  return Meteor.users.find({ _id: this.userId }, { fields: fields});
});
