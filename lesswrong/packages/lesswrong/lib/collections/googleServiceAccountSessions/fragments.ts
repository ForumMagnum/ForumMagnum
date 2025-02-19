import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment GoogleServiceAccountSessionInfo on GoogleServiceAccountSession {
    _id
    email
  }
`);

registerFragment(`
  fragment GoogleServiceAccountSessionAdminInfo on GoogleServiceAccountSession {
    _id
    email
    estimatedExpiry
  }
`);
