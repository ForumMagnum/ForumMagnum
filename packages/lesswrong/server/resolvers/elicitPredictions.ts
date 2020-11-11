import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery, addGraphQLMutation } from '../../lib/vulcan-lib/graphql';
import fetch from 'node-fetch'
import { DatabaseServerSetting } from '../databaseSettings';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { forumTypeSetting } from '../../lib/instanceSettings';

const ElicitUserType = `type ElicitUser {
    isQuestionCreator: Boolean
    displayName: String
}`

addGraphQLSchema(ElicitUserType);

const ElicitPredictionType = `type ElicitPrediction {
    prediction: Int
    createdAt: Date
    notes: String
    user: ElicitUser
}`

addGraphQLSchema(ElicitPredictionType);

const ElicitBlockDataType = `type ElicitBlockData {
  title: String
  notes: String
  resolvesBy: Date
  resolution: Boolean
  predictions: [ElicitPrediction]
}`

addGraphQLSchema(ElicitBlockDataType);

const elicitAPIUrl = "https://ought-elicit-alpha.herokuapp.com/api/v1"
const elicitAPIKey = new DatabaseServerSetting('elicitAPIKey', "3BG7J8Y-AZQMRH8-HQ2DFZS-QB0KVB1")
const elicitSourceName = new DatabaseServerSetting('elicitSourceName', 'LessWrong')
const elicitSourceURL = new DatabaseServerSetting('elicitSourceURL', 'https://LessWrong.com')

async function getPredictionsFromElicit(questionId: string = "9caNKRnBs") {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}/binary-predictions?user_most_recent=true&expand=user&prediction.fields=createdAt,notes`, {
    method: 'GET',
    redirect: 'follow'
  })
  const responseText = await response.text()
  if (!responseText) return null
  return JSON.parse(responseText)
}

async function getPredictionDataFromElicit(questionId: string = "9caNKRnBs") {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}?binaryQuestion.fields=notes,resolvesBy,resolution,title`, {
    method: 'GET',
    redirect: 'follow'
  })
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
  const responseText = await response.text()
  if (!responseText) throw Error ("Something went wrong with sending an Elicit Prediction")
  return JSON.parse(responseText)
}

async function getElicitQuestionWithPredictions(questionId: string) {
  const elicitData: any = await getPredictionDataFromElicit(questionId)
  const predictions: any = await getPredictionsFromElicit(questionId)
  console.log(elicitData)
  
  const { title, notes, resolvesBy, resolution } = elicitData
  const processedPredictions = predictions.map(({prediction, createdAt, notes, user}) => ({
    prediction,
    createdAt: new Date(createdAt),
    notes,
    user
  }))
  return {
    title,
    notes,
    resolution,
    resolvesBy: new Date(resolvesBy),
    predictions: processedPredictions
  }
}

if (elicitAPIKey.get()) {
  const elicitPredictionResolver = {
    Query: {
      async ElicitBlockData(root, { questionId }, context: ResolverContext) {
        return await getElicitQuestionWithPredictions(questionId)
      }
    },
    Mutation: {
      async MakeElicitPrediction(root, { questionId, prediction }, { currentUser }: ResolverContext) {
        if (!currentUser) throw Error("Can only make elicit prediction when logged in")
        const responseData: any = await sendElicitPrediction(questionId, prediction, currentUser)
        if (!responseData?.binaryQuestionId) throw Error("Error in sending prediction to Elicit")
        const newData = await getElicitQuestionWithPredictions(questionId)
        return newData
      }
    }
  };
  
  addGraphQLResolvers(elicitPredictionResolver);
  addGraphQLQuery('ElicitBlockData(questionId: String): ElicitBlockData');
  addGraphQLMutation('MakeElicitPrediction(questionId: String, prediction: Int): ElicitBlockData');
}


