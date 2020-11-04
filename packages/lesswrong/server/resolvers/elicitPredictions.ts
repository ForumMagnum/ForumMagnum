import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import fetch from 'node-fetch'
import { DatabaseServerSetting } from '../databaseSettings';

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

async function getPredictionsFromElicit(predictionId: string = "9caNKRnBs") {
  const response = await fetch(`https://ought-elicit-alpha.herokuapp.com/api/v1/binary-questions/${predictionId}/binary-predictions?user_most_recent=true&expand=user&prediction.fields=createdAt,notes`, {
    method: 'GET',
    redirect: 'follow'
  })
  const responseText = await response.text()
  if (!responseText) return null
  return JSON.parse(responseText)
}

async function getPredictionDataFromElicit(predictionId: string = "9caNKRnBs") {
  const response = await fetch(`https://ought-elicit-alpha.herokuapp.com/api/v1/binary-questions/${predictionId}?binaryQuestion.fields=notes,resolvesBy,resolution`, {
    method: 'GET',
    redirect: 'follow'
  })
  const responseText = await response.text()
  if (!responseText) return null
  return JSON.parse(responseText)
}

const elicitPredictionResolver = {
  Query: {
    async ElicitBlockData(root, { predictionId }, context: ResolverContext) {
      const elicitData: any = await getPredictionDataFromElicit(predictionId)
      const predictions: any = await getPredictionsFromElicit(predictionId)
      
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
  },
};

addGraphQLResolvers(elicitPredictionResolver);

addGraphQLQuery('ElicitBlockData(predictionId: String): ElicitBlockData');
