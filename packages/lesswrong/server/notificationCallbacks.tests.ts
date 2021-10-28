import { testStartup } from "../testing/testMain";
// import { createDummyPost } from "../testing/utils";
// import { getSubscribedUsers, postsNewNotifications } from "./notificationCallbacks";

testStartup()

jest.mock('./notificationCallbacks', () => {
  const originalModule = jest.requireActual('./notificationCallbacks');

  // we just want to mock getSubscribedUsers()
  return {
    __esModule: true,
    ...originalModule,
    getSubscribedUsers: jest.fn(),
  };
})
 

describe("postsNewNotifications", () => {
  it("creates the correct type of notification", () => {
    // There is a bug with this logic, where postsNewNotifications() can notify users for the wrong reason,
    // which means it may notify them in a way they did not want.
    //
    // For example, take a user who wants on-site notifications for a specific author's posts and emails for
    // posts in their local group. If that author creates a new post in a group *that is not that local group*,
    // we will send the user an email about it, rather than an on-site notification. However, the user would expect
    // to get an on-site notification and not an email.
    //
    // I feel like the fix may require significant refactoring of postsNewNotifications(), since a post may
    // qualify for multiple notification types
    // (ex. if the author above posted in the user's local group, we may want to send both notification types)
    // and we also need to be sure not to send multiple of any notification.
    //
    // JP and I (Sarah) intended to write tests around this issue, but since I don't know how impactful this is
    // and I don't think I have time to properly fix this now, I will leave this for the next person.
    

    // const testPost = createDummyPost()
    // await postsNewNotifications(testPost)
  })
})
