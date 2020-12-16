import Intercom from 'intercom-client';
import { DatabaseServerSetting } from './databaseSettings';

// Initiate Intercom on the server
const intercomTokenSetting = new DatabaseServerSetting<string | null>("intercomToken", null)

let intercomClient: any = null;
export const getIntercomClient = () => {
  if (!intercomClient && intercomTokenSetting.get()) {
    intercomClient =  new Intercom.Client({ token: intercomTokenSetting.get() })
  }
  return intercomClient;
}
