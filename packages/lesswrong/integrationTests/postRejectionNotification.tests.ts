import './integrationTestSetup';
import { createDummyPost, createDummyUser } from './utils';
import { runQuery } from '@/server/vulcan-lib/query';
import Conversations from '@/server/collections/conversations/collection';
import Posts from '@/server/collections/posts/collection';

const rejectMutation = `
  mutation RejectPostNotificationTest($id: String!, $data: UpdatePostDataInput!) {
    updatePost(selector: { _id: $id }, data: $data) {
      data { _id rejected rejectedReason rejectedByUserId }
    }
  }
`;

describe('post rejection notifications', () => {
  it.each([undefined, false, true])('only suppresses the DM when skipRejectionPM is true (%s)', async skipRejectionPM => {
    const moderator = await createDummyUser({ groups: ['sunshineRegiment'] });
    const author = await createDummyUser();
    const post = await createDummyPost(author);
    const result = await runQuery(rejectMutation, {
      id: post._id,
      data: { rejected: true, rejectedReason: 'Test reason', skipRejectionPM },
    }, { currentUser: moderator });
    expect(result.errors).toBeUndefined();
    const updatedPost = await Posts.findOne(post._id);
    expect(updatedPost).toMatchObject({ rejected: true, rejectedReason: 'Test reason', rejectedByUserId: moderator._id });
    expect(await Conversations.find({ participantIds: author._id, moderator: true }).count()).toBe(skipRejectionPM ? 0 : 1);

    // Suppression belongs to this mutation; a later rejection defaults to sending a DM.
    if (skipRejectionPM) {
      await runQuery(rejectMutation, { id: post._id, data: { rejected: false } }, { currentUser: moderator });
      const secondRejection = await runQuery(rejectMutation, { id: post._id, data: { rejected: true } }, { currentUser: moderator });
      expect(secondRejection.errors).toBeUndefined();
      expect(await Conversations.find({ participantIds: author._id, moderator: true }).count()).toBe(1);
    }
  });

  it('does not allow the post author to suppress rejection messages', async () => {
    const author = await createDummyUser();
    const post = await createDummyPost(author);
    const result = await runQuery(rejectMutation, {
      id: post._id,
      data: { skipRejectionPM: true },
    }, { currentUser: author });
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});
