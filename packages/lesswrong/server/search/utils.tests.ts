import { testStartup } from '../../testing/testMain';
import { subBatchArray, splitText } from './utils'
import { expect } from 'chai';

testStartup();

describe('subBatchArray', () => {
  it('divides a large array', () => {
    const arr = [1, 2, 3, 4, 5]
    const outputArrs = subBatchArray(arr, 2);
    (outputArrs as any).should.be.deep.equal([[1, 2], [3, 4], [5]])
  })

  it('makes an array of an array for a smaller array', () => {
    const arr = [1, 2]
    const outputArrs = subBatchArray(arr, 2);
    (outputArrs as any).should.be.deep.equal([[1, 2]])
  })
  
  it('Splits text', async () => {
    expect(splitText('text word boundary', 6)).to.deep.equal(['text', ' word', ' bound', 'ary'])
    expect(splitText('a b c d e f', 6)).to.deep.equal(['a b c', ' d e', ' f'])
    expect(splitText('', 6)).to.deep.equal([])
    expect(splitText('abc', 6)).to.deep.equal(['abc'])
  });
})
