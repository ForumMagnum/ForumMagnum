import { forumSelect } from "@/lib/forumTypeUtils";
import { getAdminTeamAccount } from "../callbacks/commentCallbacks";
import { defineMutation } from "../utils/serverGraphqlUtil";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { createMutator } from "../vulcan-lib";
import { adminAccountSetting } from "@/lib/publicSettings";

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

defineMutation({
  name: "markConversationRead",
  resultType: "Boolean!",
  argTypes: "(conversationId: String!)",
  fn: async (_, {conversationId}: {conversationId: string }, {currentUser, repos}) => {
    if (!currentUser) {
      throw new Error("You must be logged in to do this");
    }
    await repos.conversations.markConversationRead(conversationId, currentUser._id);
    return true;
  }
});

//mutation to send one of a prespeified type of message to users
defineMutation({
  name: "sendEventTriggeredDM",
  resultType: "Boolean!",
  argTypes: "(eventType: String!)",
  fn: async (_, {eventType}: {eventType: string}, context) => {

    const { currentUser, Subscriptions, Conversations, Messages } = context;

    if (!currentUser) {
      throw new Error("You must be logged in to do this");
    }

    //check if eventType is one of dmTriggeringEvents, else return
    if (!dmTriggeringEvents.has(eventType)) {
      throw new Error("Invalid event type to trigger DM");
    }

    const lwAccount = await getAdminTeamAccount()

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

    const conversation = await createMutator({
      collection: Conversations,
      document: conversationData,
      currentUser: lwAccount,
      validate: false,
    });

    const firstMessageData = {
      userId: lwAccount._id,
      contents: {
        originalContents: {
          type: "html",
          data: message
        }
      },
      conversationId: conversation.data._id
    }

    void createMutator({
      collection: Messages,
      document: firstMessageData,
      currentUser: lwAccount,
      validate: false,
    })

    return true;
  }
})
