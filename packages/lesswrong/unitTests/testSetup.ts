import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { AbortSignal } from "node-abort-controller";
import { setPublicSettings, setServerSettingsCache } from '../lib/settingsCache';

// Fix for Reference error AbortSignal in `lru-cache`
// See https://github.com/isaacs/node-lru-cache/issues/239
global.AbortSignal = AbortSignal as AnyBecauseHard;

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

setServerSettingsCache({});
setPublicSettings({});

jest.setTimeout(20000);

// A few old tests were written with EAForum-gated functionality in mind.
// We can pull them out or rewrite them, but until then...
process.env.FORUM_TYPE = "EAForum";

beforeAll(() => {
  chai.should();
  chai.use(chaiAsPromised);
});
