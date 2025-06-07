/**
 * @jest-environment jsdom
 */
// The docstring above overrides the jest environment from node to jsdom
// because the jsdom env is required for compatibility with
// @testing-library/react, but other (server) code is incompatible with that
// environment. The docstring must be the first thing in the file.

import { renderHook, act } from '@testing-library/react'
import { useFilterSettings } from '../lib/filterSettings'

jest.mock('../components/common/withUser', () => ({
  useCurrentUser: () => ({}),
}))

jest.mock('../components/hooks/useUpdateCurrentUser', () => ({
  useUpdateCurrentUser: jest.fn().mockReturnValue(jest.fn()),
}))

jest.mock('@apollo/client', () => ({
  useQuery: jest.fn()
    .mockReturnValueOnce({
      data: undefined,
      loading: true,
      error: undefined,
    })
    .mockReturnValue({
      // Did you know that something sets our useMulti results to be frozen? And
      // did you know that if you don't run in strict mode, attempts to modify
      // the results will silently fail? And did you know that we don't run in
      // strict mode? I didn't. Now you do. You're welcome.
      // results: [Object.freeze({_id: '1', name: 'Paperclips'})],
      // EDIT: we no longer have useMulti and just use useQuery directly.
      // I have no idea if the above comment is still relevant.
      data: {
        tags: {
          results: [Object.freeze({_id: '1', name: 'Paperclips'})],
        },
      },
      loading: false,
      error: null,
    })
}))

jest.mock('../lib/publicSettings', () => {
  const originalModule = jest.requireActual('../lib/publicSettings');
  return {
    __esModule: true,
    ...originalModule,
    defaultVisibilityTags: {
      get: jest.fn().mockReturnValue([
        {tagId: '0', tagName: 'Communes', filterMode: 0.5}
      ])
    }
  }
})

describe('useFilterSettings', () => {
  it('useFilterSettings', () => {
    // initial return, loading state
    const {result: filterSettingsResults, rerender} = renderHook(() => useFilterSettings())
    expect(filterSettingsResults.current).toMatchObject({
      filterSettings: {
        personalBlog: 'Hidden',
        tags: [
          {tagId: '0', tagName: 'Communes', filterMode: "TagDefault"}
        ],
      },
      loadingSuggestedTags: true,
    })

    // set personalBlog filter
    rerender() // To trigger useMulti's non-loading state
    act(() => {
      filterSettingsResults.current.setPersonalBlogFilter!('Reduced')
    })
    rerender()
    expect(filterSettingsResults.current).toMatchObject({
      filterSettings: {
        personalBlog: 'Reduced',
        // These get set because of suggested tags
        tags: [
          {tagId: '0', tagName: 'Communes', filterMode: "TagDefault"},
          {tagId: '1', tagName: 'Paperclips', filterMode: 'Default'}
        ],
      },
    })

    //  add tag filter
    act(() => {
      filterSettingsResults.current.setTagFilter!({tagId: '2', tagName: 'Dank Memes', filterMode: 'Subscribed'})
    })
    rerender()
    expect(filterSettingsResults.current).toMatchObject({
      filterSettings: {
        personalBlog: 'Reduced',
        tags: [
          {tagId: '0', tagName: 'Communes', filterMode: "TagDefault"},
          {tagId: '1', tagName: 'Paperclips', filterMode: 'Default'},
          {tagId: '2', tagName: 'Dank Memes', filterMode: 'Subscribed'}
        ],
      },
    })

    // try to add tag filter with no tagName
    act(() => {
      let error: any
      try {
        filterSettingsResults.current.setTagFilter!({tagId: '3', tagName: '', filterMode: 'Subscribed'})
      } catch (err) {
        error = err
      }
      expect(error).toBeTruthy()
    })

    // update tag filter
    act(() => {
      filterSettingsResults.current.setTagFilter!({tagId: '2', tagName: 'Dank Memes', filterMode: 'Hidden'})
    })
    rerender()
    expect(filterSettingsResults.current).toMatchObject({
      filterSettings: {
        personalBlog: 'Reduced',
        tags: [
          {tagId: '0', tagName: 'Communes', filterMode: "TagDefault"},
          {tagId: '1', tagName: 'Paperclips', filterMode: 'Default'},
          {tagId: '2', tagName: 'Dank Memes', filterMode: 'Hidden'}
        ],
      },
    })

    // remove tag filter
    act(() => {
      filterSettingsResults.current.removeTagFilter!('2')
    })
    rerender()
    expect(filterSettingsResults.current).toMatchObject({
      filterSettings: {
        personalBlog: 'Reduced',
        tags: [
          {tagId: '0', tagName: 'Communes', filterMode: "TagDefault"},
          {tagId: '1', tagName: 'Paperclips', filterMode: 'Default'}
        ],
      },
    })

    // try to remove suggested tag filter
    act(() => {
      let error: any
      try {
        filterSettingsResults.current.removeTagFilter!('1')
      } catch (err) {
        error = err
      }
      expect(error).toBeTruthy()
    })
  })
})
