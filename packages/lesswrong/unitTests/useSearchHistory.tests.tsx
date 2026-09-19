/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { useSearchHistory } from '../components/search/useSearchHistory';

const refetch = jest.fn();
const mutate = jest.fn();
let queryError: Error | undefined;
jest.mock('../lib/crud/useQuery', () => ({useQuery: () => ({error: queryError, refetch})}));
jest.mock('@apollo/client/react', () => ({useMutation: () => [mutate]}));

beforeEach(() => {
  queryError = undefined;
  refetch.mockReset();
});

it('surfaces failed history reads and allows a successful retry to clear them', async () => {
  queryError = new Error('offline');
  const {result, rerender} = renderHook(() => useSearchHistory('user', true));
  expect(result.current.readError).toBe(true);
  refetch.mockRejectedValueOnce(new Error('still offline'));
  await act(async () => { await result.current.retryHistory(); });
  expect(result.current.readError).toBe(true);
  queryError = undefined;
  refetch.mockResolvedValueOnce({data: {}});
  await act(async () => { await result.current.retryHistory(); });
  rerender();
  expect(result.current.readError).toBe(false);
});

it('treats resolved refetch errors as failures and resets retry errors for another user', async () => {
  const {result, rerender} = renderHook(({id}) => useSearchHistory(id, true), {initialProps: {id: 'first'}});
  refetch.mockResolvedValueOnce({error: new Error('read failed')});
  await act(async () => { await result.current.retryHistory(); });
  expect(result.current.readError).toBe(true);
  rerender({id: 'second'});
  expect(result.current.readError).toBe(false);
});
