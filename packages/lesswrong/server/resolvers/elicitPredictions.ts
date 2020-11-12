import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery, addGraphQLMutation } from '../../lib/vulcan-lib/graphql';
import fetch from 'node-fetch'
import { DatabaseServerSetting } from '../databaseSettings';
import { generateIdResolverSingle } from '../../lib/utils/schemaUtils';

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
  prediction: Int
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

const elicitAPIUrl = "https://ought-elicit-alpha.herokuapp.com/api/v1"
const elicitAPIKey = new DatabaseServerSetting('elicitAPIKey', null)
// const elicitSourceName = new DatabaseServerSetting('elicitSourceName', 'LessWrong')
const elicitSourceURL = new DatabaseServerSetting('elicitSourceURL', 'https://LessWrong.com')

async function getPredictionsFromElicit(questionId: string = "9caNKRnBs") {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}/binary-predictions?user_most_recent=true&expand=creator&prediction.fields=createdAt,notes,id,sourceUrl,sourceId,binaryQuestionId&creator.fields=sourceUserId`, {
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

async function getPredictionDataFromElicit(questionId: string = "9caNKRnBs") {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}?binaryQuestion.fields=notes,resolvesBy,resolution,title`, {
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

async function cancelElicitPrediction(predictionId: string) {
  console.log("predictionId", predictionId)
  const response =  await fetch(`${elicitAPIUrl}/binary-predictions/${predictionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `API_KEY ${elicitAPIKey.get()}`
    }
  })
  console.log(response)
  if (response.status !== 200) throw Error ("Something went wrong with cancelling an Elicit Prediction")
}

async function getElicitQuestionWithPredictions(questionId: string) {
  const elicitData: any = await getPredictionDataFromElicit(questionId)
  const predictions: any = await getPredictionsFromElicit(questionId)
  
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
    _id: creator.id, // Setting the unique ID to be equivalent to the creator id means optimistic UI can easily predict the correct ID, saving me a bunch of work in cache-reconsolidation
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
    resolution,
    resolvesBy: new Date(resolvesBy),
    predictions: processedPredictions
  }
}

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
      async ElicitBlockData(root, { questionId }, context: ResolverContext) {
        return await getElicitQuestionWithPredictions(questionId)
      }
    },
    Mutation: {
      async MakeElicitPrediction(root, { questionId, prediction }, { currentUser }: ResolverContext) {
        if (!currentUser) throw Error("Can only make elicit prediction when logged in")
        if (prediction) {
          const responseData: any = await sendElicitPrediction(questionId, prediction, currentUser)
          if (!responseData?.binaryQuestionId) throw Error("Error in sending prediction to Elicit")
        } else { // If we provide a falsy prediction (including 0, since 0 isn't a valid prediction, we cancel our current prediction)
          const currentData = await getElicitQuestionWithPredictions(questionId)
          const currentUserPrediction = currentData.predictions?.find(pred => pred?.creator?.sourceUserId === currentUser?._id)
          if (!currentUserPrediction) throw Error("Can't find a prediction to cancel on this question")
          await cancelElicitPrediction(currentUserPrediction.predictionId)
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


