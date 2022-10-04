import { testStartup } from '../../../testing/testMain';
import { stubbedTests } from '../../../unitTests/stubbedTests';

testStartup();
stubbedTests();

// import { chai } from 'chai';
// import chaiAsPromised from 'chai-as-promised';
// import { createDummyUser, createDummyPost, createDummyConversation, createDummyMessage } from '../../../testing/utils'
// import { performSubscriptionAction } from '../subscriptions/mutations';

// import Users from '../users/collection';
// import Notifications from './collection';
// //import Comments from '../comments/collection';
// import { waitUntilCallbacksFinished } from '../../vulcan-lib';

// chai.should();
// chai.use(chaiAsPromised);

// // describe('notification generation', () => {
// //   it("generates notifications for new posts", async (done) => {
// //     const user = await createDummyUser()
// //     const otherUser = await createDummyUser()
// //     await performSubscriptionAction('subscribe', Users, user._id, otherUser)
// //     await waitUntilCallbacksFinished();
// //     await createDummyPost(user);
// //     await waitUntilCallbacksFinished();
    
// //     const notifications = await Notifications.find({userId: otherUser._id}).fetch();
// //     (notifications as any).should.have.lengthOf(1);
// //     (notifications[0] as any).should.have.property('type', 'newPost');
// //     done();
// //   });
// //   /*it("generates notifications for new comments to post", async (done) => {
// //     const user = await createDummyUser()
// //     const otherUser = await createDummyUser()
// //     const post = await createDummyPost(user);
// //     await waitUntilCallbacksFinished();
// //     await createDummyComment(otherUser, {postId: post._id});
// //     await waitUntilCallbacksFinished();
  
// //     const notifications = await Notifications.find({userId: user._id}).fetch();
// //     notifications.should.have.lengthOf(1);
// //     notifications[0].should.have.property('type', 'newComment');
// //     done();
// //   });
// //   it("generates notifications for comment replies", async (done) => {
// //     // user1 makes a post
// //     // user2 comments on it
// //     // user3 subscribes to user2's comment
// //     // user1 replies to user2
// //     //
// //     // Notifications:
// //     //   user1 notified of user2's comment
// //     //   user2 notified of user1's reply
// //     //   user3 notified of user1's reply

// //     const user1 = await createDummyUser()
// //     const user2 = await createDummyUser()
// //     const user3 = await createDummyUser()
// //     const post = await createDummyPost(user1);
// //     await waitUntilCallbacksFinished();
// //     const comment = await createDummyComment(user2, {postId: post._id});
// //     await waitUntilCallbacksFinished();
// //     await performSubscriptionAction('subscribe', Comments, comment._id, user3)
// //     await waitUntilCallbacksFinished();
// //     await createDummyComment(user1, {postId: post._id, parentCommentId: comment._id});
// //     await waitUntilCallbacksFinished();
  
// //     const notifications1 = await Notifications.find({userId: user1._id}).fetch();
// //     const notifications2 = await Notifications.find({userId: user2._id}).fetch();
// //     const notifications3 = await Notifications.find({userId: user3._id}).fetch();
  
// //     notifications1.should.have.lengthOf(1);
// //     // FIXME: After shuffling this test around, getting wrong documentIds here
// //     // (is this supposed to be ID of the comment, or of the thing it's a reply
// //     // to?) Possibly this was assigning the correct ID all along, but the test
// //     // wasn't actually running like it was supposed to.
// //     //notifications1[0].should.not.have.property('documentId', comment._id);
// //     notifications1[0].should.have.property('type', 'newComment');

// //     notifications2.should.have.lengthOf(1);
// //     //notifications2[0].should.have.property('documentId', comment._id);
// //     notifications2[0].should.have.property('type', 'newReplyToYou');

// //     notifications3.should.have.lengthOf(1);
// //     //notifications3[0].should.have.property('documentId', comment._id);
// //     notifications3[0].should.have.property('type', 'newReply');
// //     done();
// //   });*/
// //   it("generates notifications for new private messages", async (done) => {
// //     const user = await createDummyUser({
// //       notificationPrivateMessage: {
// //         // Set notification channel to onsite (default is "both") so that there's one notification in the database rather than two
// //         channel: "onsite",
// //         batchingFrequency: "realtime",
// //       },
// //     })
// //     const otherUser = await createDummyUser({
// //       notificationPrivateMessage: {
// //         channel: "onsite",
// //         batchingFrequency: "realtime",
// //       },
// //     })
// //     const conversation = await createDummyConversation(user, {participantIds: [user._id, otherUser._id]});
// //     const message1 = await createDummyMessage(user, {conversationId: conversation._id});
// //     await createDummyMessage(otherUser, {conversationId: conversation._id});
// //     await waitUntilCallbacksFinished();
    
// //     const notifications = await Notifications.find({userId: otherUser._id}).fetch();

// //     (notifications as any).should.have.lengthOf(1);
// //     (notifications[0] as any).should.have.property('documentId', message1._id);
// //     (notifications[0] as any).should.have.property('type', 'newMessage');
// //     done();
// //   });
// // });
