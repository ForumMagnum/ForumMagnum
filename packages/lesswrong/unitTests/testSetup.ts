import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { AbortSignal } from "node-abort-controller";

// Fix for Reference error AbortSignal in `lru-cache`
// See https://github.com/isaacs/node-lru-cache/issues/239
global.AbortSignal = AbortSignal as AnyBecauseHard;

jest.setTimeout(20000);

beforeAll(() => {
  chai.should();
  chai.use(chaiAsPromised);
});
