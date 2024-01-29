import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { AbortSignal } from "node-abort-controller";
import { setPublicSettings } from '../lib/settingsCache';
// See https://github.com/openai/openai-node#customizing-the-fetch-client
import "openai/shims/node";
import { refreshSettingsCaches } from '../server/loadDatabaseSettings';

// Fix for Reference error AbortSignal in `lru-cache`
// See https://github.com/isaacs/node-lru-cache/issues/239
global.AbortSignal = AbortSignal as AnyBecauseHard;

setPublicSettings({});
void refreshSettingsCaches();

jest.setTimeout(20000);

beforeAll(() => {
  chai.should();
  chai.use(chaiAsPromised);
});
