import "./integrationTestSetup";
import { createDummyPost, createDummyLocalgroup } from "./utils";

// TODO: this is a temporary hack to resolve an import order issue with callback hooks on ReviewVotes.  Do not remove this or the stringify, or move it below the import of `notificationCallbacks`!
import ReviewVotes from "../lib/collections/reviewVotes/collection";
JSON.stringify({ ReviewVotes });

import { postsNewNotifications } from "../server/notificationCallbacks";
import { createNotifications } from "../server/notificationCallbacksHelpers";

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

describe("test postsNewNotifications", () => {
  it("only sends the newPost notifications when the new post is not in a group and not an event", async () => {
    const testPost = await createDummyPost()
    await postsNewNotifications(testPost)
    // notify both users subscribed to the author
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['222', '333'],
      notificationType: 'newPost',
      documentType: 'post',
      documentId: testPost._id
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
    await postsNewNotifications(testPost)
    // only send one notification per user
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['222'],
      notificationType: 'newEventInRadius',
      documentType: 'post',
      documentId: testPost._id
    })
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['333'],
      notificationType: 'newPost',
      documentType: 'post',
      documentId: testPost._id
    })
  })
  
  it("sends the newGroupPost and newPost notifications when the new post is in a group, not an event", async () => {
    const testGroup = await createDummyLocalgroup()
    const testPost = await createDummyPost(null, { groupId: testGroup._id });
    await postsNewNotifications(testPost)

    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['111'],
      notificationType: 'newGroupPost',
      documentType: 'post',
      documentId: testPost._id
    })
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['222', '333'],
      notificationType: 'newPost',
      documentType: 'post',
      documentId: testPost._id
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
    await postsNewNotifications(testPost)
    // only send one notification per user
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['111'],
      notificationType: 'newEvent',
      documentType: 'post',
      documentId: testPost._id
    })
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['222'],
      notificationType: 'newEventInRadius',
      documentType: 'post',
      documentId: testPost._id
    })
    expect(createNotifications).toHaveBeenCalledWith({
      userIds: ['333'],
      notificationType: 'newPost',
      documentType: 'post',
      documentId: testPost._id
    })
  })
})
