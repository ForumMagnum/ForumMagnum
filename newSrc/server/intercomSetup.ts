import { Client } from 'intercom-client';
import { DatabaseServerSetting } from './databaseSettings';

// Initiate Intercom on the server
const intercomTokenSetting = new DatabaseServerSetting<string | null>("intercomToken", null)
const intercomClient = intercomTokenSetting.get()
  ? new Client({ token: intercomTokenSetting.get() })
  : null;


export default intercomClient;
