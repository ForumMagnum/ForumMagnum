import { Client } from 'intercom-client';
import { DatabaseServerSetting } from './databaseSettings';

// Initiate Intercom on the server
const intercomTokenSetting = new DatabaseServerSetting<string | null>("intercomToken", null)

let intercomClient: any = null;
export const getIntercomClient = () => {
  if (!intercomClient && intercomTokenSetting.get()) {
    intercomClient =  new Client({ token: intercomTokenSetting.get() })
  }
  return intercomClient;
}
