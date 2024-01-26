import { subBatchArray } from '../server/search/subBatchArray'

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
})
