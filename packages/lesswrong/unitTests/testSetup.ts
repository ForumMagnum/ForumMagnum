import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

jest.setTimeout(20000);

beforeAll(() => {
  chai.should();
  chai.use(chaiAsPromised);
});
