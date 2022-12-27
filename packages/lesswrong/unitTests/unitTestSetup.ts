import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

beforeAll(() => {
  chai.should();
  chai.use(chaiAsPromised);
});
