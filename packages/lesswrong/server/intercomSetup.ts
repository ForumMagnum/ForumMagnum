import { Client as IntercomClient } from 'intercom-client';
import { intercomTokenSetting } from './databaseSettings';

let intercomClient: IntercomClient | null = null;
export const getIntercomClient = () => {
  const intercomToken = intercomTokenSetting.get();
  if (!intercomClient && intercomToken) {
    intercomClient =  new IntercomClient({
      tokenAuth: {
        token: intercomToken
      },
    })
  }
  return intercomClient;
}
