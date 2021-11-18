import { FilterSettings, useFilterSettings } from './filterSettings';
import { testStartup } from "../testing/testMain";

testStartup();

jest.mock('../components/common/withUser', () => ({
  useCurrentUser: () => ({
    frontpageFilterSettings: {
      personalBlog: 'Hidden',
      tags: [],
    } as FilterSettings
  }),
}));

jest.mock('../components/hooks/useUpdateCurrentUser', () => ({
  useUpdateCurrentUser: jest.fn(),
}));

jest.mock('./crud/withMulti', () => ({
  useMulti: () => ({
    results: [],
    loading: false,
    error: null,
  })
}))

describe('useFilterSettings', () => {
  it('', () => {

  })
})
