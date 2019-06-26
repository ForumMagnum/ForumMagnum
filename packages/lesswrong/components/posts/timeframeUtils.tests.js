import {getDatePosts, getDateRange} from './timeframeUtils'

describe('getDatePosts', () => {
  const posts = [
    {testId: 1, postedAt: '2019-01-11T01:20:30.123Z'},
    {testId: 2, postedAt: '2019-01-12T01:20:30.123Z'},
    // Feb
    {testId: 3, postedAt: '2019-02-13T01:20:30.123Z'},
    // curatedAt
    {testId: 4, postedAt: '2018-12-31T01:20:30.123Z', curatedAt: '2019-01-11T01:20:30.123Z'},
  ]

  it('handles basic case', () => {
    const result = getDatePosts(posts, '2019-01-12', 'days', null, 'Etc/UTC')
    result.should.deep.equal([{testId: 2, postedAt: '2019-01-12T01:20:30.123Z'}])
  })

  it('handles timezones', () => {
    // Note that in Pacific Time, those posts are all still in the previous
    // day. We ask for posts on the 11th and expect to get back the 2nd post.
    const result = getDatePosts(posts, '2019-01-11', 'days', null, 'America/Los_Angeles')
    result.should.deep.equal([{testId: 2, postedAt: '2019-01-12T01:20:30.123Z'}])
  })

  it('handles months', () => {
    // Also test that it can return more than one post
    const result = getDatePosts(posts, '2019-01-01', 'months', null, 'Etc/UTC')
    result.should.deep.equal([
      {testId: 1, postedAt: '2019-01-11T01:20:30.123Z'},
      {testId: 2, postedAt: '2019-01-12T01:20:30.123Z'},
    ])
  })

  it('handles timeField', () => {
    // Also test that it can handle missing field gracefully
    const result = getDatePosts(posts, '2019-01-11', 'months', 'curatedAt', 'Etc/UTC')
    result.should.deep.equal([
      {testId: 4, postedAt: '2018-12-31T01:20:30.123Z', curatedAt: '2019-01-11T01:20:30.123Z'},
    ])
  })
})

describe('getDateRange', () => {
  const posts = [
    {testId: 1, postedAt: '2019-01-11T01:20:30.123Z'},
    {testId: 2, postedAt: '2019-01-12T01:20:30.123Z'},
    {testId: 3, postedAt: '2019-01-13T01:20:30.123Z'},
  ]

  it('handles case basic case', () => {
    const result = getDateRange('2019-01-11', '2019-01-13', posts, 'days', null, 'Etc/UTC')
    result.should.deep.equal(['2019-01-13', '2019-01-12', '2019-01-11'])
  })

  it('excludes last day if there\'s no posts', () => {
    const result = getDateRange('2019-01-12', '2019-01-14', posts, 'days', null, 'Etc/UTC')
    result.should.deep.equal(['2019-01-13', '2019-01-12'])
  })

  // TODO; Week, month, year
})

