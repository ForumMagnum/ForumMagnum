import { getDateRange } from '../components/posts/timeframeUtils'
import { withNoLogs } from '../integrationTests/utils';
import chai from 'chai';
import moment from 'moment';
import { formatRelative } from '../lib/utils/timeFormat';

// This file side-effectfully configured momentjs
import '../components/momentjs';

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

describe('formatRelative', () => {
  it('formats dates in the past the same way as momentjs did', () => {
    const now = new Date();

    function assertSameFormat(when: Date) {
      const formattedByMoment = moment(when).from(now);
      const formattedByUs = formatRelative(when, now);
      formattedByMoment.should.equal(formattedByUs);
    }
    
    assertSameFormat(now);

    // Exact offsets
    assertSameFormat(moment(now).subtract(2, 'minutes').toDate());
    assertSameFormat(moment(now).subtract(2, 'hours').toDate());
    assertSameFormat(moment(now).subtract(2, 'days').toDate());
    assertSameFormat(moment(now).subtract(2, 'months').toDate());
    assertSameFormat(moment(now).subtract(2, 'years').toDate());
    assertSameFormat(moment(now).add(2, 'minutes').toDate());
    assertSameFormat(moment(now).add(2, 'hours').toDate());
    assertSameFormat(moment(now).add(2, 'days').toDate());
    assertSameFormat(moment(now).add(2, 'months').toDate());
    assertSameFormat(moment(now).add(2, 'years').toDate());

    // Inexact offsets - off by one in either direction of the next unit down
    assertSameFormat(moment(now).subtract(2, 'minutes').subtract(1, 'seconds').toDate());
    assertSameFormat(moment(now).subtract(2, 'hours'  ).subtract(1, 'minutes').toDate());
    assertSameFormat(moment(now).subtract(2, 'days'   ).subtract(1, 'hours'  ).toDate());
    assertSameFormat(moment(now).subtract(2, 'months' ).subtract(1, 'days'   ).toDate());
    assertSameFormat(moment(now).subtract(2, 'years'  ).subtract(1, 'months' ).toDate());
    assertSameFormat(moment(now).subtract(2, 'minutes').add(1, 'seconds').toDate());
    assertSameFormat(moment(now).subtract(2, 'hours'  ).add(1, 'minutes').toDate());
    assertSameFormat(moment(now).subtract(2, 'days'   ).add(1, 'hours'  ).toDate());
    assertSameFormat(moment(now).subtract(2, 'months' ).add(1, 'days'   ).toDate());
    assertSameFormat(moment(now).subtract(2, 'years'  ).add(1, 'months' ).toDate());
  });
});
