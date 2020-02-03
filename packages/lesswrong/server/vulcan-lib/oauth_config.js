import { getSetting } from '../../lib/vulcan-lib/settings.js';

const services = getSetting('oAuth');

if (services) {
  Object.keys(services).forEach(serviceName => {
    ServiceConfiguration.configurations.upsert({service: serviceName}, {
      $set: services[serviceName]
    });
  });
}
