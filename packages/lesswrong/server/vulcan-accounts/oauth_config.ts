import { ServiceConfiguration } from '../../lib/meteorDdp';
import { DatabaseServerSetting } from '../databaseSettings';

const oAuthServicesSetting = new DatabaseServerSetting<any>('oAuth', null)
const services = oAuthServicesSetting.get()

if (services) {
  Object.keys(services).forEach(serviceName => {
    ServiceConfiguration.configurations.upsert({service: serviceName}, {
      $set: services[serviceName]
    });
  });
}
