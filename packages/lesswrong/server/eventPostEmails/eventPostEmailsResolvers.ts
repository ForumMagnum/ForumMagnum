import gql from "graphql-tag";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { sendEventPostEmailById, sendEventPostEmails } from "./eventPostEmails";

export const eventPostEmailsGqlTypeDefs = gql`
  extend type Mutation {
    sendEventPostEmail(postId: String!, subject: String!, isTest: Boolean!): Boolean!
  }
`;

export const eventPostEmailsGqlMutations = {
  async sendEventPostEmail(
    _root: void,
    {postId, subject, isTest}: {postId: string, subject: string, isTest: boolean},
    {currentUser}: ResolverContext,
  ): Promise<boolean> {
    if (!currentUser || !userIsAdmin(currentUser)) {
      throw new Error("This feature is only available to admins");
    }
    if (!postId || !subject) {
      throw new Error("Missing args");
    }
    if (isTest) {
      await sendEventPostEmailById(postId, currentUser._id, subject);
    } else {
      void sendEventPostEmails(postId, subject);
    }
    return true;
  }
}
