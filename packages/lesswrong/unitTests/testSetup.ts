import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { AbortSignal } from "node-abort-controller";
import { setPublicSettings, setServerSettingsCache } from '../lib/settingsCache';
// See https://github.com/openai/openai-node#customizing-the-fetch-client
import "openai/shims/node";

// This is needed because one of the tests imports `gpt-3-encoder`, which relies on `TexttDecoder`
// https://stackoverflow.com/a/68468204
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });

// Fix for Reference error AbortSignal in `lru-cache`
// See https://github.com/isaacs/node-lru-cache/issues/239
global.AbortSignal = AbortSignal as AnyBecauseHard;

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

setServerSettingsCache({});
setPublicSettings({});

jest.setTimeout(20000);

beforeAll(() => {
  chai.should();
  chai.use(chaiAsPromised);
});
