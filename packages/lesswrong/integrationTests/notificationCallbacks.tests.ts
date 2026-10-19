import "./integrationTestSetup";
import { createDummyPost, createDummyLocalgroup, createDummyUser, createDummyConversation, createDummyMessage } from "./utils";

// TODO: this is a temporary hack to resolve an import order issue with callback hooks on ReviewVotes.  Do not remove this or the stringify, or move it below the import of `notificationCallbacks`!
import ReviewVotes from "../server/collections/reviewVotes/collection";
JSON.stringify({ ReviewVotes });

import { sendNewPostNotifications } from "@/server/callbacks/postCallbackFunctions";
import { createNotifications } from "../server/notificationCallbacksHelpers";
import { updatePost } from "@/server/collections/posts/mutations";
import { updateUser } from "@/server/collections/users/mutations";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import Posts from "@/server/collections/posts/collection";

jest.mock('../server/notificationCallbacksHelpers', () => {
  const originalModule = jest.requireActual('../server/notificationCallbacksHelpers');

  // control which users are associated with which notifications (for testing postsNewNotifications)
  const mockGetSubscribedUsers = jest.fn().mockImplementation((document) => {
    // return users subscribed to the local group
    if (document.collectionName === 'Localgroups') return [{_id: '111'}]
    // return users subscribed to the author
    if (document.collectionName === 'Users') return [{_id: '222'}, {_id: '333'}]
  });

  return {
    __esModule: true,
    ...originalModule,
    getSubscribedUsers: mockGetSubscribedUsers,
    getUsersWhereLocationIsInNotificationRadius: jest.fn().mockResolvedValue([{_id: '222'}]),
    createNotifications: jest.fn()
  };
})

describe("coauthor notifications on author approval", () => {
  it.each([
    { label: "archived", archived: true },
    { label: "active", archived: false },
  ])("handles deferred invitations for an $label draft", async ({ archived }) => {
    const moderator = await createDummyUser({ isAdmin: true });
    const author = await createDummyUser({ reviewedByUserId: null });
    const coauthor = await createDummyUser();
    const context = createAdminContext({ currentUser: moderator, forumType: "LessWrong" });
    const post = await createDummyPost(author, {
      draft: true,
      coauthorUserIds: [coauthor._id],
    });
    expect(post.authorIsUnreviewed).toBe(true);

    if (archived) {
      await updatePost({
        selector: { _id: post._id },
        data: { deletedDraft: true },
      }, context);
    }

    jest.clearAllMocks();
    await updateUser({
      selector: { _id: author._id },
      data: { reviewedByUserId: moderator._id },
    }, context);

    expect(await Posts.findOne(post._id)).toMatchObject({
      authorIsUnreviewed: false,
      draft: true,
      deletedDraft: archived,
    });
    const notification = expect.objectContaining({
      userIds: [coauthor._id],
      notificationType: "addedAsCoauthor",
      documentId: post._id,
    });
    if (archived) {
      expect(createNotifications).not.toHaveBeenCalledWith(notification);
      await updatePost({ selector: { _id: post._id }, data: { deletedDraft: false } }, context);
    }
    expect(createNotifications).toHaveBeenCalledWith(notification);
  });
});

describe("test postsNewNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("only sends the newPost notifications when the new post is not in a group and not an event", async () => {
    const testPost = await createDummyPost()
    await sendNewPostNotifications(testPost, "LessWrong")
    // notify both users subscribed to the author
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['222', '333'],
      notificationType: 'newPost',
      documentType: 'post',
      documentId: testPost._id,
      context: expect.objectContaining({ forumType: "LessWrong" }),
    })
  })
  
  it("sends the newEventInRadius and newPost notifications when the new post is an event, not in a group", async () => {
    const testPost = await createDummyPost(null, {
      isEvent: true,
      location: "Sample location",
      googleLocation: {
        geometry: {
          location: {
            lng: 123,
            lat: 456,
          },
        },
      },
    });
    await sendNewPostNotifications(testPost, "LessWrong")
    // only send one notification per user
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['222'],
      notificationType: 'newEventInRadius',
      documentType: 'post',
      documentId: testPost._id,
      context: expect.objectContaining({ forumType: "LessWrong" }),
    })
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['333'],
      notificationType: 'newPost',
      documentType: 'post',
      documentId: testPost._id,
      context: expect.objectContaining({ forumType: "LessWrong" }),
    })
  })
  
  it("sends the newGroupPost and newPost notifications when the new post is in a group, not an event", async () => {
    const testGroup = await createDummyLocalgroup()
    const testPost = await createDummyPost(null, { groupId: testGroup._id });
    await sendNewPostNotifications(testPost, "LessWrong")

    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['111'],
      notificationType: 'newGroupPost',
      documentType: 'post',
      documentId: testPost._id,
      context: expect.objectContaining({ forumType: "LessWrong" }),
    })
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['222', '333'],
      notificationType: 'newPost',
      documentType: 'post',
      documentId: testPost._id,
      context: expect.objectContaining({ forumType: "LessWrong" }),
    })
  })
  
  it("sends the newEvent, newEventInRadius, and newPost notifications when the new post is an event in a group", async () => {
    const testGroup = await createDummyLocalgroup()
    const testPost = await createDummyPost(null, {
      groupId: testGroup._id,
      isEvent: true,
      location: "Sample location",
      googleLocation: {
        geometry: {
          location: {
            lng: 123,
            lat: 456,
          },
        },
      },
    });
    await sendNewPostNotifications(testPost, "LessWrong")
    // only send one notification per user
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['111'],
      notificationType: 'newEvent',
      documentType: 'post',
      documentId: testPost._id,
      context: expect.objectContaining({ forumType: "LessWrong" }),
    })
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['222'],
      notificationType: 'newEventInRadius',
      documentType: 'post',
      documentId: testPost._id,
      context: expect.objectContaining({ forumType: "LessWrong" }),
    })
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['333'],
      notificationType: 'newPost',
      documentType: 'post',
      documentId: testPost._id,
      context: expect.objectContaining({ forumType: "LessWrong" }),
    })
  })
})

describe("new message notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function expectNewMessageNotificationFor(userIds: string[]) {
    expect(createNotifications).toHaveBeenCalledWith(expect.objectContaining({ notificationType: 'newMessage', userIds }));
  }

  async function sendMessage(sender: DbUser, conversationId: string) {
    await createDummyMessage(sender, {
      conversationId,
      contents: { originalContents: { type: 'html', data: '<p>Hello</p>' } },
    });
  }

  it("doesn't notify moderators about messages in moderator conversations", async () => {
    const moderator = await createDummyUser({ isAdmin: true });
    const user = await createDummyUser();
    const conversation = await createDummyConversation(moderator, { participantIds: [moderator._id, user._id], moderator: true });

    await sendMessage(user, conversation._id);

    expectNewMessageNotificationFor([]);
  });

  it("still notifies the user about moderators' messages in moderator conversations", async () => {
    const moderator = await createDummyUser({ isAdmin: true });
    const user = await createDummyUser();
    const conversation = await createDummyConversation(moderator, { participantIds: [moderator._id, user._id], moderator: true });

    await sendMessage(moderator, conversation._id);

    expectNewMessageNotificationFor([user._id]);
  });

  it("notifies moderators about messages in ordinary conversations", async () => {
    const moderator = await createDummyUser({ isAdmin: true });
    const user = await createDummyUser();
    const conversation = await createDummyConversation(user, { participantIds: [user._id, moderator._id] });

    await sendMessage(user, conversation._id);

    expectNewMessageNotificationFor([moderator._id]);
  });
});
