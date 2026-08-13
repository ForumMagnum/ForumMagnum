import { Doc } from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { IndexeddbPersistence } from "y-indexeddb";
import {
  COMMENTS_SUBDOC_ID,
  createWebsocketProviderWithDoc,
  setCollaborationConfig,
} from "@/components/lexical/collaboration";

jest.mock("y-indexeddb", () => ({
  IndexeddbPersistence: jest.fn().mockImplementation(
    (name: string, document: unknown) => ({
      name,
      document,
      _db: Promise.resolve(),
      on: (_event: string, callback: () => void) => callback(),
      destroy: jest.fn(async () => {}),
    }),
  ),
}));

jest.mock("@hocuspocus/provider", () => ({
  HocuspocusProvider: jest.fn().mockImplementation(
    (config: { document: unknown }) => ({
      configuration: { preserveConnection: true },
      document: config.document,
      connect: jest.fn(async () => {}),
      destroy: jest.fn(),
    }),
  ),
}));

const mockHocuspocusProvider = jest.mocked(HocuspocusProvider);
const mockIndexeddbPersistence = jest.mocked(IndexeddbPersistence);

describe("collaboration IndexedDB persistence", () => {
  beforeEach(() => {
    mockHocuspocusProvider.mockClear();
    mockIndexeddbPersistence.mockClear();
    process.env.NEXT_PUBLIC_HOCUSPOCUS_URL = "ws://example.com";
    setCollaborationConfig({
      postId: "test-post",
      getToken: async () => "test-token",
      user: {
        id: "test-user",
        name: "Test User",
      },
    });
  });

  afterEach(() => {
    setCollaborationConfig(null);
  });

  it("restores the comments document from IndexedDB before connecting", async () => {
    const commentsDoc = new Doc();
    const provider = createWebsocketProviderWithDoc(COMMENTS_SUBDOC_ID, commentsDoc);

    await provider.connect();

    expect(mockIndexeddbPersistence).toHaveBeenCalledWith(
      "post-test-post/comments-v1",
      commentsDoc,
    );
    const originalConnect = jest.mocked(
      mockHocuspocusProvider.mock.results[0].value.connect,
    );
    expect(originalConnect).toHaveBeenCalledTimes(1);
    expect(mockIndexeddbPersistence.mock.invocationCallOrder[0])
      .toBeLessThan(originalConnect.mock.invocationCallOrder[0]);
  });
});
