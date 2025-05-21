// Wrapped so that `lib/random` can import this. There's a corresponding stub that exports null instead.
import crypto from 'crypto';
// eslint-disable-next-line no-barrel-files/no-barrel-files
export default crypto;
