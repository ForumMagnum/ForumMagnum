import { getLoginServices } from '../../lib/vulcan-accounts/helpers';
import { meteorUsersCollection } from '../../platform/current/lib/meteorAccounts';
import { publishDDP } from '../../platform/current/lib/meteorDdp';

publishDDP('servicesList', function(this: any) {
  let services = getLoginServices();
  // @ts-ignore
  if (Package['accounts-password']) {
    services.push({name: 'password'});
  }
  let fields = {};
  // Publish the existing services for a user, only name or nothing else.
  services.forEach(service => fields[`services.${service.name}.name`] = 1);
  return meteorUsersCollection.find({ _id: this.userId }, { fields: fields});
});
