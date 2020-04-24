import { ServiceConfiguration } from 'meteor/service-configuration';
import { DatabaseServerSetting } from '../databaseSettings';

const oAuthServicesSetting = new DatabaseServerSetting<any>('oAuth', null)

if (oAuthServicesSetting.get()) {
  const services = oAuthServicesSetting.get()
  Object.keys(services).forEach(serviceName => {
    ServiceConfiguration.configurations.upsert({service: serviceName}, {
      $set: services[serviceName]
    });
  });
}
