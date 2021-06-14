import { Client } from 'intercom-client';
import { DatabaseServerSetting } from './databaseSettings';

// Initiate Intercom on the server
const intercomTokenSetting = new DatabaseServerSetting<string | null>("intercomToken", null)

let intercomClient: any = null;
export const getIntercomClient = () => {
  const intercomToken = intercomTokenSetting.get();
  if (!intercomClient && intercomToken) {
    intercomClient =  new Client({ token: intercomToken })
  }
  return intercomClient;
}
