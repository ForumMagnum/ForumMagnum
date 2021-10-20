import { testStartup } from "../testing/testMain";
import { getSubscribedUsers, postsNewNotifications } from "./notificationCallbacks";

testStartup()

jest.mock('./notificationCallbacks', () => {
  const originalModule = jest.requireActual('./notificationCallbacks');

  //Mock the default export and named export 'foo'
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(() => 'mocked baz'),
    foo: 'mocked foo',
  };
})
 


describe("postsNewNotifications", () => {
  it("creates the correct type of notification", () => {
    // await getSubscribedUsers({documentI})
  })
})
