import gql from "graphql-tag"
import { forumSelect } from "@/lib/forumTypeUtils";
import { getAdminTeamAccount } from "../utils/adminTeamAccount";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { adminAccountSetting } from "@/lib/publicSettings";
import { createConversation, createConversationGqlMutation } from '../collections/conversations/mutations';
import { createMessage } from '../collections/messages/mutations';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { ACCESS_FILTERED, accessFilterSingle } from "@/lib/utils/schemaUtils";
import { isAF } from "@/lib/instanceSettings";

export const dmTriggeringEvents = new TupleSet(['newFollowSubscription'] as const)
export type DmTriggeringEvent = UnionOf<typeof dmTriggeringEvents>;

const followSubscriptionStartDate = forumSelect({
  LessWrong: new Date("2024-06-06"),
  default: undefined
})

const getTriggeredDmContents = (eventType: DmTriggeringEvent) => {
  const adminEmail = adminAccountSetting.get()?.email ?? "";

  switch (eventType) {
    case "newFollowSubscription":
      return {
        title: "Congrats on your first follow!",
        message: `<div>
          <p>You just followed a user for the first time!</p>
          <p>The posts and comments of people you follow appear in your Subscribed Tab (tabs are on homepage above the posts list). (You will also see comments from other users that people you follow are responding to.)</p>
          <p>You can manage who you follow on the <a href="/manageSubscriptions">Manage Subscriptions page</a>.</p>
          <p>Feel free to ask us questions via Intercom or <a href="mailto:${adminEmail}">email</a>. This is an automated message, but we're happy to help!</p>
          <p>Happy following!</p>
        </div>`
      }
  }
}

export const conversationGqlTypeDefs = gql`
  extend type Mutation {
    markConversationRead(conversationId: String!): Boolean!
    sendEventTriggeredDM(eventType: String!): Boolean!
    initiateConversation(participantIds: [String!]!, af: Boolean, moderator: Boolean): Conversation
  }

`

export const conversationGqlMutations = {
  async markConversationRead (_: void, {conversationId}: {conversationId: string }, {currentUser, repos}: ResolverContext) {
    if (!currentUser) {
      throw new Error("You must be logged in to do this");
    }
    await repos.conversations.markConversationRead(conversationId, currentUser._id);
    return true;
  },
  async sendEventTriggeredDM (_: void, {eventType}: {eventType: string}, context: ResolverContext) {

    const { currentUser, Subscriptions, Conversations, Messages } = context;

    if (!currentUser) {
      throw new Error("You must be logged in to do this");
    }

    //check if eventType is one of dmTriggeringEvents, else return
    if (!dmTriggeringEvents.has(eventType)) {
      throw new Error("Invalid event type to trigger DM");
    }

    const lwAccount = await getAdminTeamAccount(context)

    if (!lwAccount) {
      throw new Error("Unable to find the lwAccount to send message to user")
    }

    if (eventType === "newFollowSubscription") {
      
      //check if this is a user's first follow
      const numUsersFollows = await Subscriptions.find({
        userId: currentUser._id,
        type: "newActivityForFeed",
        createdAt: {$gt: followSubscriptionStartDate}
      }).count();

      if (numUsersFollows > 1) {
        // already has followed and received a DM
        return false;
      }
    }

    const { title, message } = getTriggeredDmContents(eventType); 

    const conversationData = {
      participantIds: [currentUser._id, lwAccount._id],
      title
    }

    const lwContext = await computeContextFromUser({ user: lwAccount, isSSR: context.isSSR });

    const conversation = await createConversation({
      data: conversationData
    }, lwContext);

    const firstMessageData = {
      userId: lwAccount._id,
      contents: {
        originalContents: {
          type: "html",
          data: message
        }
      },
      conversationId: conversation._id
    }

    void createMessage({
      data: firstMessageData
    }, lwContext);

    return true;
  },
  async initiateConversation (_: void, { participantIds, moderator }: { participantIds: string[], moderator: boolean | null }, context: ResolverContext): Promise<(Partial<DbConversation> & { [ACCESS_FILTERED]: true }) | null> {
    const { currentUser, Conversations } = context;

    if (!currentUser) {
      throw new Error("You must be logged in to do this");
    }

    const afField = isAF ? { af: true } : {};
    const moderatorField = typeof moderator === 'boolean' ? { moderator } : {};

    // This is basically the `userGroupUntitledConversations` view plus the default view
    const selector = {
      participantIds: participantIds?.length
        ? { $size: participantIds.length, $all: participantIds }
        : currentUser._id,
        ...afField,
        ...moderatorField,
    };

    const existingConversation = await Conversations.findOne(selector, { sort: { moderator: 1 }});
    if (existingConversation) {
      return accessFilterSingle(currentUser, 'Conversations', existingConversation, context);
    }

    const conversationData = {
      ...afField,
      ...moderatorField,
      participantIds,
    };

    // This matches the previous behavior of the `createIfMissing` implementation, which used
    // the fully put-together "mutation" function including the permission check and acccess filtering.
    const createdConversationWrapper = await createConversationGqlMutation(_, { data: conversationData }, context);
    return createdConversationWrapper.data;
  }
}
