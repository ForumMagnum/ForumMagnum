import ElicitQuestionPredictions from '../../lib/collections/elicitQuestionPredictions/collection';
import ElicitQuestions from '../../lib/collections/elicitQuestions/collection';
import { executePromiseQueue } from '../../lib/utils/asyncUtils';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { CommentsRepo, PostsRepo } from '../repos';
import { ElicitPredictionData, getPredictionDataFromElicit, getPredictionsFromElicit } from '../resolvers/elicitPredictions';
import { cheerioParse } from '../utils/htmlUtil';
import { registerMigration } from './migrationUtils';
import { createAdminContext } from "../vulcan-lib/query";
import { createMutator } from "../vulcan-lib/mutators";

const apiQuestionToDBQuestion = (question: any, id: string): Omit<DbElicitQuestion, 'schemaVersion'|'legacyData'> => ({
  _id: id,
  title: question.title,
  notes: question.notes,
  resolution: question.resolution,
  resolvesBy: new Date(question.resolvesBy),
  createdAt: new Date(),
})

const apiPredictionToDBQuestion = (prediction: ElicitPredictionData, questionId: string): Omit<DbElicitQuestionPrediction, 'schemaVersion'> => ({
  _id: prediction.id,
  prediction: prediction.prediction,
  createdAt: prediction.createdAt ? new Date(prediction.createdAt) : new Date(),
  notes: prediction.notes,
  creator: {
    _id: prediction.creator.id,
    displayName: prediction.creator.displayName,
    isQuestionCreator: prediction.creator.isQuestionCreator,
    sourceUserId: prediction.creator.sourceUserId,
  },
  userId: prediction.creator.sourceUserId,
  sourceUrl: prediction.sourceUrl,
  sourceId: prediction.sourceId,
  binaryQuestionId: questionId,
  isDeleted: false,
})

registerMigration({
  name: "importElicitPredictions",
  dateWritten: "2023-11-07",
  idempotent: true,
  action: async () => {
    const [postsWithPredictions, commentsWithPredictions] = await Promise.all([
      (new PostsRepo()).getPostsWithElicitData(),
      (new CommentsRepo()).getCommentsWithElicitData()
    ]);


    const questionIds = Array.from(new Set([...postsWithPredictions, ...commentsWithPredictions]
      .map(d => cheerioParse(d.contents?.html ?? ""))
      .map($ => $('[data-elicit-id]').toArray().map(elt => $(elt).attr('data-elicit-id')))
      .map(filterNonnull)
      .flat())
    )

    const elicitQuestionsWithPredictions = await executePromiseQueue(questionIds.map(
      id => () => Promise.all([
        getPredictionDataFromElicit(id).then(q => apiQuestionToDBQuestion(q, id)).catch(() => null),
        getPredictionsFromElicit(id).then(ps => (ps ?? []).map(p => apiPredictionToDBQuestion(p, id))).catch(() => [])
      ])
    ), 10)

    const adminContext = createAdminContext();
    await Promise.all(elicitQuestionsWithPredictions.flatMap(([questionData, predictionData]) => {
      if (!questionData) return;
      return [
        createMutator({
          collection: ElicitQuestions,
          document: questionData,
          validate: true,
          context: adminContext
        }),
        ...predictionData.map(p => createMutator({
          collection: ElicitQuestionPredictions,
          document: p,
          validate: true,
          context: adminContext
        }))
      ]
    }))
  },
});
