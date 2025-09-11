import gql from "graphql-tag";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { sendEventPostEmailById, sendEventPostEmails } from "./eventPostEmails";

export const eventPostEmailsGqlTypeDefs = gql`
  extend type Mutation {
    sendEventPostEmail(postId: String!, isTest: Boolean!): Boolean!
  }
`;

export const eventPostEmailsGqlMutations = {
  async sendEventPostEmail(
    _root: void,
    {postId, isTest}: {postId: string, isTest: boolean},
    {currentUser}: ResolverContext,
  ): Promise<boolean> {
    if (!currentUser || !userIsAdmin(currentUser)) {
      throw new Error("This feature is only available to admins");
    }
    if (typeof postId !== "string" || typeof isTest !== "boolean") {
      throw new Error("Invalid args");
    }
    if (isTest) {
      await sendEventPostEmailById(postId, currentUser._id);
    } else {
      void sendEventPostEmails(postId);
    }
    return true;
  }
}
