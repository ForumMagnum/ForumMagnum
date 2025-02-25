import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery, addGraphQLMutation } from '../../lib/vulcan-lib/graphql';
import { DatabaseServerSetting } from '../databaseSettings';
import { generateIdResolverSingle } from '../../lib/utils/schemaUtils';
import { elicitSourceURL } from '../../lib/publicSettings';
import { encode } from 'querystring'
import ElicitQuestions from '../../lib/collections/elicitQuestions/collection';
import ElicitQuestionPredictions from '../../lib/collections/elicitQuestionPredictions/collection';
import { useElicitApi } from '../../lib/betas';
import { createMutator } from '../vulcan-lib/mutators';
import { randomId } from '@/lib/random';

const ElicitUserType = `type ElicitUser {
  isQuestionCreator: Boolean
  displayName: String
  _id: String
  sourceUserId: String
  lwUser: User
}`

addGraphQLSchema(ElicitUserType);

const ElicitPredictionType = `type ElicitPrediction {
  _id: String
  predictionId: String
  prediction: Float
  createdAt: Date
  notes: String
  creator: ElicitUser
  sourceUrl: String
  sourceId: String
  binaryQuestionId: String
}`

addGraphQLSchema(ElicitPredictionType);

const ElicitBlockDataType = `type ElicitBlockData {
  _id: String
  title: String
  notes: String
  resolvesBy: Date
  resolution: Boolean
  predictions: [ElicitPrediction]
}`

addGraphQLSchema(ElicitBlockDataType);

const elicitAPIUrl = "https://forecast.elicit.org/api/v1"
const elicitAPIKey = new DatabaseServerSetting('elicitAPIKey', null)
// const elicitSourceName = new DatabaseServerSetting('elicitSourceName', 'LessWrong')

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

export async function getPredictionsFromElicit(questionId: string): Promise<null|Array<ElicitPredictionData>> {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}/binary-predictions?${encode({
    user_most_recent: "true",
    expand: "creator",
    "prediction.fields": "createdAt,notes,id,sourceUrl,sourceId,binaryQuestionId",
    "creator.fields": "sourceUserId"
  })}`, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'Authorization': `API_KEY ${elicitAPIKey.get()}`
    }
  })
  const responseText = await response.text()
  if (!responseText) return null
  return JSON.parse(responseText)
}

export async function getPredictionDataFromElicit(questionId: string) {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}?${encode({
    "binaryQuestion.fields":"notes,resolvesBy,resolution,title"
  })}`, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'Authorization': `API_KEY ${elicitAPIKey.get()}`
    }
  })
  if (response.status !== 200) throw new Error(`Cannot get elicit prediction for questionId ${questionId}, got: ${response.status}: ${response.statusText}`)
  const responseText = await response.text()
  if (!responseText) return null
  return JSON.parse(responseText)
}

async function sendElicitPrediction(questionId: string, prediction: number, user: DbUser) {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}/binary-predictions`, {
    method: 'POST',
    body: JSON.stringify({
      prediction,
      sourceUserId: user._id,
      sourceUserDisplayName: user.displayName,
      sourceUrl: elicitSourceURL.get()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `API_KEY ${elicitAPIKey.get()}`
    }
  })
  if (response.status !== 200) throw new Error(`Cannot send elicit prediction, got: ${response.status}: ${response.statusText}`)
  const responseText = await response.text()
  if (!responseText) throw Error ("Something went wrong with sending an Elicit Prediction")
  return JSON.parse(responseText)
}

async function cancelElicitPrediction(questionId: string, user: DbUser) {
  const response =  await fetch(`${elicitAPIUrl}/binary-questions/${questionId}/binary-predictions?sourceUserId=${user._id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `API_KEY ${elicitAPIKey.get()}`
    }
  })
  if (response.status !== 200) throw new Error(`Cannot cancel elicit prediction, got: ${response.status}: ${response.statusText}`)
}

interface ElicitQuestionWithPredictions {
  _id: string,
  title: string,
  notes: string | null,
  resolution: boolean,
  resolvesBy: Date|null,
  predictions: DbElicitQuestionPrediction[]
}

async function getElicitQuestionWithPredictions(questionId: string) {
  const elicitData: any = await getPredictionDataFromElicit(questionId)
  const predictions = await getPredictionsFromElicit(questionId)
  if (!elicitData || !predictions) return {}
  const { title, notes, resolvesBy, resolution } = elicitData
  const processedPredictions = predictions.map(({
    id,
    prediction,
    createdAt,
    notes,
    creator,
    sourceUrl,
    sourceId,
    binaryQuestionId
  }) => ({
    _id: id,
    predictionId: id,
    prediction,
    createdAt: new Date(createdAt),
    notes,
    creator: {
      ...creator,
      _id: creator.id
    },
    sourceUrl,
    sourceId,
    binaryQuestionId
  }))
  return {
    _id: questionId,
    title,
    notes,
    resolution: resolution === "YES",
    resolvesBy: new Date(resolvesBy),
    predictions: processedPredictions
  }
}

async function getLocalElicitQuestionWithPredictions(questionId: string): Promise<ElicitQuestionWithPredictions | Record<any, never>> {
  const [questionData, predictionData] = await Promise.all([
    ElicitQuestions.findOne(questionId),
    ElicitQuestionPredictions.find({
      binaryQuestionId: questionId,
      isDeleted: false,
      prediction: {$ne: null},
    }).fetch()
  ]);
  
  if (!questionData) return {};

  return {
    ...questionData,
    resolution: questionData.resolution === 'YES',
    predictions: predictionData
  };
}

export function addElicitResolvers() {
  if (elicitAPIKey.get()) {
    const elicitPredictionResolver = {
      ElicitUser: {
        lwUser: generateIdResolverSingle({
          collectionName: "Users",
          fieldName: "sourceUserId",
          nullable: true 
        })
      },
      Query: {
        async ElicitBlockData(root: void, {questionId}: {questionId: string}, context: ResolverContext) {
          if (useElicitApi) return await getElicitQuestionWithPredictions(questionId);
          
          return await getLocalElicitQuestionWithPredictions(questionId);
        }
      },
      Mutation: {
        async MakeElicitPrediction(root: void, {questionId, prediction}: {questionId: string, prediction: number}, { currentUser }: ResolverContext) {
          if (!currentUser) throw Error("Can only make elicit prediction when logged in")
          // Elicit API is (to be) shut down. We don't support predictions (yet?)
          if (useElicitApi) {
            if (prediction) {
              const responseData: any = await sendElicitPrediction(questionId, prediction, currentUser)
              if (!responseData?.binaryQuestionId) throw Error("Error in sending prediction to Elicit")
            } else { // If we provide a falsy prediction (including 0, since 0 isn't a valid prediction, we cancel our current prediction)
              await cancelElicitPrediction(questionId, currentUser)
            }

            return await getElicitQuestionWithPredictions(questionId);
          } else {
            // Create a prediction
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
              _id: {$ne: predictionObj._id},
            }, {
              $set: { isDeleted: true }
            });
          }

          // When not using their API, use the imported data
          return await getLocalElicitQuestionWithPredictions(questionId)
        },
      }
    };
    
    addGraphQLResolvers(elicitPredictionResolver);
    addGraphQLQuery('ElicitBlockData(questionId: String): ElicitBlockData');
    addGraphQLMutation('MakeElicitPrediction(questionId: String, prediction: Int): ElicitBlockData');
  }
}
