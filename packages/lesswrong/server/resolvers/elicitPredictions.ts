import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery, addGraphQLMutation } from '../../lib/vulcan-lib/graphql';
import { DatabaseServerSetting } from '../databaseSettings';
import { generateIdResolverSingle } from '../../lib/utils/schemaUtils';
import { elicitSourceURL } from '../../lib/publicSettings';
import { encode } from 'querystring'
import { onStartup } from '../../lib/executionEnvironment';

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

async function getPredictionsFromElicit(questionId: string): Promise<null|Array<{
  id: string,
  prediction: number,
  createdAt: string,
  notes: string,
  creator: any,
  sourceUrl: string,
  sourceId: string,
  binaryQuestionId: string
}>> {
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

async function getPredictionDataFromElicit(questionId:string) {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}?${encode({
    "binaryQuestion.fields":"notes,resolvesBy,resolution,title"
  })}`, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'Authorization': `API_KEY ${elicitAPIKey.get()}`
    }
  })
  if (response.status !== 200) throw new Error(`Cannot get elicit prediction, got: ${response.status}: ${response.statusText}`)
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

onStartup(() => {
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
          return await getElicitQuestionWithPredictions(questionId)
        }
      },
      Mutation: {
        async MakeElicitPrediction(root: void, {questionId, prediction}: {questionId: string, prediction: number}, { currentUser }: ResolverContext) {
          if (!currentUser) throw Error("Can only make elicit prediction when logged in")
          if (prediction) {
            const responseData: any = await sendElicitPrediction(questionId, prediction, currentUser)
            if (!responseData?.binaryQuestionId) throw Error("Error in sending prediction to Elicit")
          } else { // If we provide a falsy prediction (including 0, since 0 isn't a valid prediction, we cancel our current prediction)
            await cancelElicitPrediction(questionId, currentUser)
          }
          const newData = await getElicitQuestionWithPredictions(questionId)
          return newData
        }
      }
    };
    
    addGraphQLResolvers(elicitPredictionResolver);
    addGraphQLQuery('ElicitBlockData(questionId: String): ElicitBlockData');
    addGraphQLMutation('MakeElicitPrediction(questionId: String, prediction: Int): ElicitBlockData');
  }
})
