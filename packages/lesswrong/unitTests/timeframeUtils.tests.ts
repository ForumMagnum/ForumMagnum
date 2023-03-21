import { getDateRange } from '../components/posts/timeframeUtils'
import { withNoLogs } from '../integrationTests/utils';
import chai from 'chai';

chai.should();

describe('getDateRange', () => {
  it('handles days', () => {
    const result = getDateRange('2019-01-01', '2019-01-03', 'day');
    (result as any).should.deep.equal(['2019-01-02', '2019-01-01'])
  })

  it('handles weeks, basic case', () => {
    const result = getDateRange('2019-01-01', '2019-01-15', 'week');
    (result as any).should.deep.equal(['2019-01-08', '2019-01-01'])
  })

  it('handles months', () => {
    const result = getDateRange('2019-01-01', '2019-03-01', 'month');
    (result as any).should.deep.equal(['2019-02-01', '2019-01-01'])
  })

  it('handles years', () => {
    const result = getDateRange('2019-01-01', '2020-01-01', 'year');
    (result as any).should.deep.equal(['2019-01-01'])
  })

  // --- Sad cases --- //

  // Correct behavior for partial timeBlocks isn't super obvious. I'd hope it
  // wouldn't come up, but I think the right way to handle it is to go further
  // back than expected
  it('handles partial timeBlocks', async () => {
    await withNoLogs(async () => {
      const result = getDateRange('2019-01-02', '2019-01-15', 'week');
      (result as any).should.deep.equal(['2019-01-08', '2019-01-01'])
    });
  })

  it('handles reversed start and end dates', () => {
    ((
      () => getDateRange('2019-01-03', '2019-01-01', 'day')
    ) as any).should.throw(Error, /got after .* after the before/)
  })

  it('handles malformed dates', () => {
    ((
      () => getDateRange('01/01/2019', '2019-01-03', 'day')
    ) as any).should.throw(Error, /Invalid after/)
  })

  it('handles malformed timeBlock', () => {
    ((
      () => getDateRange('2019-01-01', '2019-01-03', 'asdf' as any)
    ) as any).should.throw(Error, /Invalid timeBlock/)
  })

  it('handles null timeBlock', () => {
    ((
      () => getDateRange('2019-01-01', '2019-01-03', null as any)
    ) as any).should.throw(Error, /Invalid timeBlock/)
  })
})
