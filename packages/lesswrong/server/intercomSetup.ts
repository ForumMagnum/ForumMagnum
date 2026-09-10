import { Client as IntercomClient } from 'intercom-client';

let intercomClient: IntercomClient | null = null;
export const getIntercomClient = () => {
  const intercomToken = (process.env.private_intercomToken ?? null);
  if (!intercomClient && intercomToken) {
    intercomClient =  new IntercomClient({
      tokenAuth: {
        token: intercomToken
      },
    })
  }
  return intercomClient;
}
