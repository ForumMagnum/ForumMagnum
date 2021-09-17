import { Client as IntercomClient } from 'intercom-client';
import { DatabaseServerSetting } from './databaseSettings';

// Initiate Intercom on the server
const intercomTokenSetting = new DatabaseServerSetting<string | null>("intercomToken", null)

let intercomClient: IntercomClient | null = null;
export const getIntercomClient = () => {
  const intercomToken = intercomTokenSetting.get();
  if (!intercomClient && intercomToken) {
    intercomClient =  new IntercomClient({ token: intercomToken })
  }
  return intercomClient;
}
