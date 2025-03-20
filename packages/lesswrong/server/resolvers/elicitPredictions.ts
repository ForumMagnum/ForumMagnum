import { generateIdResolverSingle } from '../../lib/utils/schemaUtils';
import ElicitQuestions from '../../server/collections/elicitQuestions/collection';
import ElicitQuestionPredictions from '../../server/collections/elicitQuestionPredictions/collection';
import { createMutator } from '../vulcan-lib/mutators';
import { randomId } from '@/lib/random';
import gql from 'graphql-tag';

export const elicitPredictionsGraphQLTypeDefs = gql`
  type ElicitUser {
    isQuestionCreator: Boolean
    displayName: String
    _id: String
    sourceUserId: String
    lwUser: User
  }
  type ElicitPrediction {
    _id: String
    predictionId: String
    prediction: Float
    createdAt: Date
    notes: String
    creator: ElicitUser
    sourceUrl: String
    sourceId: String
    binaryQuestionId: String
  }
  type ElicitBlockData {
    _id: String
    title: String
    notes: String
    resolvesBy: Date
    resolution: Boolean
    predictions: [ElicitPrediction]
  }
  extend type Query {
    ElicitBlockData(questionId: String): ElicitBlockData
  }
  extend type Mutation {
    MakeElicitPrediction(questionId: String, prediction: Int): ElicitBlockData
  }
`
export interface ElicitPredictionData {
  id: string,
  prediction: number,
  createdAt: string,
  notes: string | null,
  creator: any,
  sourceUrl: string,
  sourceId: string,
  binaryQuestionId: string
}

export type ConvertedElicitPredictionData = Omit<ElicitPredictionData, 'id' | 'createdAt'> & {
  _id: string,
  createdAt: Date
};

interface ElicitQuestionWithPredictions {
  _id: string,
  title: string,
  notes: string | null,
  resolution: boolean,
  resolvesBy: Date | null,
  predictions: DbElicitQuestionPrediction[]
}

async function getLocalElicitQuestionWithPredictions(questionId: string): Promise<ElicitQuestionWithPredictions | Record<any, never>> {
  const [questionData, predictionData] = await Promise.all([
    ElicitQuestions.findOne(questionId),
    ElicitQuestionPredictions.find({
      binaryQuestionId: questionId,
      isDeleted: false,
      prediction: { $ne: null },
    }).fetch()
  ]);

  if (!questionData) return {};

  return {
    ...questionData,
    resolution: questionData.resolution === 'YES',
    predictions: predictionData
  };
}

export const elicitPredictionsGraphQLFieldResolvers = {
  ElicitUser: {
    lwUser: generateIdResolverSingle({
      collectionName: "Users",
      fieldName: "sourceUserId",
      nullable: true
    })
  }
}

export const elicitPredictionsGraphQLMutations = {
  async MakeElicitPrediction(root: void, { questionId, prediction }: { questionId: string, prediction: number }, { currentUser }: ResolverContext) {
    if (!currentUser) throw Error("Can only make elicit prediction when logged in")
    const predictionObj = (await createMutator({
      collection: ElicitQuestionPredictions,
      document: {
        prediction,
        binaryQuestionId: questionId,
        notes: "",
        creator: {
          _id: randomId(),
          displayName: currentUser.displayName ?? currentUser._id,
          sourceUserId: currentUser._id,
          isQuestionCreator: false, //TODO
        },
        userId: currentUser._id,
        sourceUrl: "",
        sourceId: "",
      },
      currentUser,
      validate: false,
    })).data;

    // Delete any predictions by this user other than this one
    await ElicitQuestionPredictions.rawUpdateMany({
      binaryQuestionId: questionId,
      userId: currentUser._id,
      _id: { $ne: predictionObj._id },
    }, {
      $set: { isDeleted: true }
    });

    // When not using their API, use the imported data
    return await getLocalElicitQuestionWithPredictions(questionId)
  },
}


export const elicitPredictionsGraphQLQueries = {
  async ElicitBlockData(root: void, { questionId }: { questionId: string }, context: ResolverContext) {
    return await getLocalElicitQuestionWithPredictions(questionId);
  }
}
