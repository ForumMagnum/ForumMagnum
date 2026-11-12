import { EventDebouncer, dispatchPendingEvents } from '@/server/debouncer';
import { DebouncerEvents } from '@/server/collections/debouncerEvents/collection';

const mockCallback = jest.fn();
const mockDebouncer = new EventDebouncer({
  name: 'forumDispatchTest',
  defaultTiming: { type: 'none' },
  callback: mockCallback,
});

jest.mock('../server/getDebouncerByName', () => ({
  getDebouncerByName: () => mockDebouncer,
}));

describe('dispatching debounced events', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockCallback.mockClear();
  });

  it('drains events regardless of their af flag and always dispatches them as LessWrong', async () => {
    const pendingEvents = [false, true].map(af => ({
      name: 'forumDispatchTest',
      key: JSON.stringify('user-id'),
      pendingEvents: [af ? 'af-notification' : 'lw-notification'],
      af,
    }));
    const findOneAndUpdate = jest.fn(async (selector: MongoSelector<DbDebouncerEvents>) => {
      const index = pendingEvents.findIndex(event => selector.af === undefined || selector.af === event.af);
      return { value: index >= 0 ? pendingEvents.splice(index, 1)[0] : null };
    });
    jest.spyOn(DebouncerEvents, 'rawCollection').mockImplementation(jest.fn().mockReturnValue({ findOneAndUpdate }));

    await dispatchPendingEvents();

    expect(pendingEvents).toHaveLength(0);
    expect(mockCallback).toHaveBeenNthCalledWith(1, 'user-id', ['lw-notification'], 'LessWrong');
    expect(mockCallback).toHaveBeenNthCalledWith(2, 'user-id', ['af-notification'], 'LessWrong');
  });
});
