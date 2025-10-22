import { generateIdResolverSingle } from '../../lib/utils/schemaUtils';
import ElicitQuestions from '../../server/collections/elicitQuestions/collection';
import ElicitQuestionPredictions from '../../server/collections/elicitQuestionPredictions/collection';
import { randomId } from '@/lib/random';
import gql from 'graphql-tag';
import { createElicitQuestionPrediction } from '../collections/elicitQuestionPredictions/mutations';
import InlinePredictions from '../collections/inlinePredictions/collection';
import times from 'lodash/times';
import { percentageToBucket } from '@/lib/utils/predictionUtil';

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
    predictions: [ElicitPrediction!]
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
      foreignCollectionName: "Users",
      fieldName: "sourceUserId",
      nullable: true 
    })
  }
}

export const elicitPredictionsGraphQLMutations = {
  async MakeElicitPrediction(
    root: void,
    { questionId, prediction }: { questionId: string, prediction: number|null },
    context: ResolverContext
  ) {
    const { currentUser } = context;

    if (!currentUser) {
      throw new Error("Can only make elicit prediction when logged in")
    }
    const question = await ElicitQuestions.findOne(questionId);
    if (!question) {
      throw new Error("Invalid questionId");
    }

    let numDeleted = 0;
    if (prediction !== null) {
      const predictionObj = (await createElicitQuestionPrediction({
        data: {
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
      }, context));

      // Delete any predictions by this user other than this one
      numDeleted = await ElicitQuestionPredictions.rawUpdateMany({
        binaryQuestionId: questionId,
        userId: currentUser._id,
        isDeleted: false,
        _id: { $ne: predictionObj._id },
      }, {
        $set: { isDeleted: true }
      });
    } else {
      // If the prediction is null, that means we are cancelling any previous
      // predictions (and do not need to create a new one).
      numDeleted = await ElicitQuestionPredictions.rawUpdateMany({
        binaryQuestionId: questionId,
        isDeleted: false,
        userId: currentUser._id,
      }, {
        $set: { isDeleted: true }
      });
    }
    
    // If we deleted any predictions, check whether this is an inline prediction
    // and that was the only prediction. If so, delete the inline prediction as
    // well. (This is so that if you create an inline prediction and then
    // immediately un-predict, you don't leave behind a zero-predictions
    // question.)
    if (numDeleted > 0) {
      const numRemainingPredictions = await ElicitQuestionPredictions.find({
        binaryQuestionId: questionId,
        isDeleted: false,
      }).count();
      if (!numRemainingPredictions) {
        await InlinePredictions.rawUpdateOne(
          {questionId},
          {$set: {deleted: true}}
        );
      }
    }

    // When not using their API, use the imported data
    return await getLocalElicitQuestionWithPredictions(questionId)
  },
}


export const elicitPredictionsGraphQLQueries = {
  async ElicitBlockData(root: void, { questionId }: { questionId: string }, context: ResolverContext) {
    return await getLocalElicitQuestionWithPredictions(questionId);
  }
}

export const getPredictionDistribution = async (questionId: string, numBuckets: number, context: ResolverContext): Promise<number[]> => {
  const predictions = await ElicitQuestionPredictions.find({
    binaryQuestionId: questionId,
    isDeleted: false,
  }).fetch();
  const buckets = times(numBuckets, i => 0);
  for (const prediction of predictions) {
    if (prediction.prediction !== null) {
      const bucket = percentageToBucket(prediction.prediction, numBuckets);
      if (bucket>0 && bucket<numBuckets) {
        buckets[bucket]++;
      }
    }
  }
  return buckets;
}
