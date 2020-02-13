import { getSetting } from '../../lib/vulcan-lib/settings';
import { ServiceConfiguration } from 'meteor/service-configuration';

const services: any = getSetting('oAuth');

if (services) {
  Object.keys(services).forEach(serviceName => {
    ServiceConfiguration.configurations.upsert({service: serviceName}, {
      $set: services[serviceName]
    });
  });
}
