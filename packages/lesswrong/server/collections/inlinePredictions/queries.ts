import { createInlinePredictionKarmaRequirement } from "@/lib/collections/inlinePredictions/constants";
import schema from "@/lib/collections/inlinePredictions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import { insertAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import { createElicitQuestion } from "../elicitQuestions/mutations";
import { isValidCollectionName } from "../allCollections";
import { createElicitQuestionPrediction } from "../elicitQuestionPredictions/mutations";
import { randomId } from "@/lib/random";
import { createComment } from "../comments/mutations";
import InlinePredictions from "./collection";
import { userCanMoveInlinePredictionToComment } from "@/lib/utils/predictionUtil";
import { sanitize } from "@/lib/vulcan-lib/utils";

export const graphqlInlinePredictionQueryTypeDefs = gql`
  type InlinePrediction ${ getAllGraphQLFields(schema) }
  
  type SingleInlinePredictionOutput {
    result: InlinePrediction
  }
  
  input InlinePredictionSelector {
    default: EmptyViewInput
  }
  
  type MultiInlinePredictionOutput {
    results: [InlinePrediction!]!
    totalCount: Int
  }
  
  extend type Query {
    inlinePrediction(
      selector: SelectorInput
    ): SingleInlinePredictionOutput
    inlinePredictions(
      selector: InlinePredictionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiInlinePredictionOutput
  }
  
  input CreateInlinePredictionDataInput {
    collectionName: String!
    documentId: String!
    quote: String!
    probability: Float!
  }
  
  extend type Mutation {
    createInlinePrediction(data: CreateInlinePredictionDataInput!): InlinePrediction
    convertPredictionToComment(inlinePredictionId: String!): Comment
  }
`;

export const inlinePredictionGqlFieldResolvers = getFieldGqlResolvers('InlinePredictions', schema);

export const inlinePredictionsMutations = {
  async createInlinePrediction(
    _: void,
    {data}: {data: CreateInlinePredictionDataInput},
    context: ResolverContext
  ) {
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("You must be logged in to create inline predictions");
    }
    if (currentUser.karma < createInlinePredictionKarmaRequirement) {
      throw new Error(`You need at least ${createInlinePredictionKarmaRequirement} karma to create inline predictions`);
    }
    const { collectionName } = data;
    if (!(isValidCollectionName(collectionName))) {
      throw new Error("Invalid collection name");
    }
    
    // Create a question
    const elicitQuestion = await createElicitQuestion({
      data: {
        title: data.quote,
      },
    }, context);
    
    // Create a prediction for the current user of this question
    const elicitPrediction = await createElicitQuestionPrediction({
      data: {
        binaryQuestionId: elicitQuestion._id,
        creator: {
          _id: randomId(17),
          displayName: currentUser.displayName,
          sourceUserId: currentUser._id,
          isQuestionCreator: true,
        },
        userId: currentUser._id,
        prediction: data.probability,
      },
    }, context);
    
    // Create the relation between the question and the document
    const inlinePredictionObj = await insertAndReturnDocument({
      userId: currentUser._id,
      deleted: false,
      documentId: data.documentId,
      collectionName,
      questionId: elicitQuestion._id,
      quote: data.quote,
    }, "InlinePredictions", context);
    
    return await accessFilterSingle(currentUser, "InlinePredictions", inlinePredictionObj, context);
  },
  
  async convertPredictionToComment(
    _: void,
    {inlinePredictionId}: {inlinePredictionId: string},
    context: ResolverContext
  ) {
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("You must be logged in");
    }
    const inlinePrediction = await context.loaders.InlinePredictions.load(inlinePredictionId);
    if (!inlinePrediction || inlinePrediction.deleted) {
      throw new Error("Invalid inlinePredictionId");
    }

    const currentUserIsCreator = inlinePrediction.userId === currentUser._id;
    const currentUserIsPostAuthor = false; //TODO
    if (!userCanMoveInlinePredictionToComment({
      currentUserIsCreator,
      currentUserIsPostAuthor,
    })) {
      throw new Error("You must be the post author or question creator to move an inline prediction");
    }
    
    // Create the comment
    const questionId = inlinePrediction.questionId;
    const commentMarkup = `<div class="elicit-binary-prediction" data-elicit-id="${questionId}"></div>`;

    const postId = inlinePrediction.documentId;
    const comment = await createComment({
      data: {
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: sanitize(commentMarkup),
          },
        },
        postId,
      },
    }, context);
    
    // Delete the inline version
    await InlinePredictions.rawUpdateOne(
      {_id: inlinePrediction._id},
      {$set: {
        deleted: true
      }}
    );

    return comment;
  }
}
