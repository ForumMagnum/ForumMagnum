import "./integrationTestSetup";
import { expect } from "chai";
import { runQuery } from "../server/vulcan-lib/query";
import { catchGraphQLErrors, createDummyConversation, createDummyUser } from "./utils";

const expectBlockedDmError = async (response: Promise<unknown>, graphQLerrors: ReturnType<typeof catchGraphQLErrors>) => {
  let rejected = false;
  try {
    await response;
  } catch {
    rejected = true;
  }

  expect(rejected).to.equal(true);
  expect(JSON.stringify(graphQLerrors.getErrors())).to.contain("blocked you from sending");
}

describe("Direct message user blocks", () => {
  const graphQLerrors = catchGraphQLErrors();

  it("prevents starting a conversation with someone who blocked you", async () => {
    const sender = await createDummyUser();
    const blocker = await createDummyUser({blockedUserIds: [sender._id]});

    const response = runQuery(`
      mutation StartBlockedConversation {
        initiateConversation(participantIds: ["${sender._id}", "${blocker._id}"]) {
          _id
        }
      }
    `, {}, {currentUser: sender});

    await expectBlockedDmError(response, graphQLerrors);
  });

  it("prevents sending a message after another participant blocks you", async () => {
    const sender = await createDummyUser();
    const blocker = await createDummyUser({blockedUserIds: [sender._id]});
    const conversation = await createDummyConversation(sender, {
      participantIds: [sender._id, blocker._id],
    });

    const response = runQuery(`
      mutation SendBlockedMessage {
        createMessage(data: {
          conversationId: "${conversation._id}",
          contents: { originalContents: { type: "markdown", data: "hello" } }
        }) {
          data {
            _id
          }
        }
      }
    `, {}, {currentUser: sender});

    await expectBlockedDmError(response, graphQLerrors);
  });
});
